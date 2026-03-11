"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Play, Square, ArrowLeft, Loader2, Bot, User, Volume2 } from "lucide-react";
import { researchApi, VoiceAgentInfo } from "@/lib/researchApi";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
});

function VoiceTesterContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const agentId = searchParams?.get("agentId");

    const [agent, setAgent] = useState<VoiceAgentInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [active, setActive] = useState(false);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [transcript, setTranscript] = useState<Array<{ role: "user" | "assistant", content: string }>>([]);

    // Audio & WS Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const websocketRef = useRef<WebSocket | null>(null);
    const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const audioQueueRef = useRef<Int16Array[]>([]);
    const isPlayingRef = useRef(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!agentId) {
            setError("No Agent ID provided");
            setLoading(false);
            return;
        }
        fetchAgent();
        return () => {
            cleanup();
        };
    }, [agentId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcript]);

    const fetchAgent = async () => {
        try {
            const data = await researchApi.getVoiceAgent(agentId!);
            setAgent(data);
        } catch (err: any) {
            console.error("Failed to fetch agent", err);
            setError("Failed to load voice agent configuration.");
        } finally {
            setLoading(false);
        }
    };

    const cleanup = () => {
        if (websocketRef.current) {
            websocketRef.current.send(JSON.stringify({ type: "close" }));
            websocketRef.current.close();
        }
        if (audioProcessorRef.current) audioProcessorRef.current.disconnect();
        if (audioContextRef.current) audioContextRef.current.close();
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        setActive(false);
    };

    const startSession = async () => {
        try {
            // 1. Request Mic Access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 24000
                }
            });
            mediaStreamRef.current = stream;

            // 2. Setup WebSocket
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";
            const baseUrl = API_URL.replace(/\/api$/, "").replace(/^https?:\/\//, "");
            const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const wsUrl = `${wsProtocol}//${baseUrl}/api/voice-agents/${agentId}/test`;

            const ws = new WebSocket(wsUrl);
            console.log(`Frontend connecting to: ${wsUrl}`);
            websocketRef.current = ws;

            ws.onopen = () => {
                console.log("Frontend WebSocket connected");
                setActive(true);
                setupAudioCapture();
                // Initial prompt
                ws.send(JSON.stringify({ type: "response.create" }));
            };

            ws.onmessage = (event) => {
                console.log("Frontend received message:", event.data);
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "openai_event") {
                        handleAgentEvent(data.event);
                    } else if (data.type === "error") {
                        console.error("Received error from backend:", data.message);
                        setError(data.message);
                        cleanup();
                    }
                } catch (e) {
                    console.error("WS Message Error", e);
                }
            };

            ws.onerror = (err) => {
                console.error("Frontend WebSocket error:", err);
                setError("WebSocket connection error");
            };
            ws.onclose = (event) => {
                console.warn(`Frontend WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
                setActive(false);
            };

        } catch (err: any) {
            console.error("Start Session Error", err);
            setError(err.message || "Failed to start session. Check mic permissions.");
        }
    };

    const handleAgentEvent = (event: any) => {
        if (event.type === "error") {
            const msg = event.error?.message || event.message || JSON.stringify(event);
            setError(`Agent Error: ${msg}`);
            cleanup();
            return;
        }

        switch (event.type) {
            case "conversation.item.input_audio_transcription.completed":
                if (event.transcript) {
                    setTranscript(prev => [...prev.filter(t => t.content !== "..."), { role: "user", content: event.transcript }]);
                }
                break;
            case "response.audio_transcript.delta":
                if (event.delta) {
                    setTranscript(prev => {
                        const last = prev[prev.length - 1];
                        if (last && last.role === "assistant") {
                            const newContent = last.content + event.delta;
                            return [...prev.slice(0, -1), { ...last, content: newContent }];
                        } else {
                            return [...prev, { role: "assistant", content: event.delta }];
                        }
                    });
                }
                break;
            case "response.audio_transcript.done":
                if (event.transcript) {
                    setTranscript(prev => {
                        const last = prev[prev.length - 1];
                        if (last && last.role === "assistant") {
                            return [...prev.slice(0, -1), { ...last, content: event.transcript }];
                        } else {
                            return [...prev, { role: "assistant", content: event.transcript }];
                        }
                    });
                }
                break;
            case "response.audio.delta":
                if (event.delta) {
                    const binary = atob(event.delta);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                    const pcm16 = new Int16Array(bytes.buffer);
                    audioQueueRef.current.push(pcm16);
                    if (!isPlayingRef.current) playNextChunk();
                }
                break;
            case "input_audio_buffer.speech_started":
                setIsUserSpeaking(true);
                // Clear queue on interruption
                audioQueueRef.current = [];
                isPlayingRef.current = false;
                // Add placeholder for user speech
                setTranscript(prev => [...prev, { role: "user", content: "..." }]);
                break;
            case "input_audio_buffer.speech_stopped":
                setIsUserSpeaking(false);
                break;
        }
    };

    const setupAudioCapture = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(mediaStreamRef.current!);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        const targetSampleRate = 24000;
        const resampleRatio = targetSampleRate / audioContext.sampleRate;

        processor.onaudioprocess = (e) => {
            if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN || !isMicOn) return;

            const inputData = e.inputBuffer.getChannelData(0);

            // Simplified Resampling
            const targetLength = Math.floor(inputData.length * resampleRatio);
            const resampled = new Float32Array(targetLength);
            for (let i = 0; i < targetLength; i++) {
                resampled[i] = inputData[Math.floor(i / resampleRatio)];
            }

            const pcm16 = new Int16Array(resampled.length);
            for (let i = 0; i < resampled.length; i++) {
                const s = Math.max(-1, Math.min(1, resampled[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }

            const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
            websocketRef.current.send(JSON.stringify({ type: "audio_chunk", audio: base64 }));
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        audioProcessorRef.current = processor;
    };

    const playNextChunk = () => {
        if (!audioContextRef.current || audioQueueRef.current.length === 0) {
            isPlayingRef.current = false;
            return;
        }

        isPlayingRef.current = true;
        const chunk = audioQueueRef.current.shift()!;
        const float32 = new Float32Array(chunk.length);
        for (let i = 0; i < chunk.length; i++) float32[i] = chunk[i] / 32768;

        const buffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
        buffer.copyToChannel(float32, 0);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = playNextChunk;
        source.start();
    };

    const toggleMic = () => {
        if (mediaStreamRef.current) {
            const track = mediaStreamRef.current.getAudioTracks()[0];
            if (track) {
                track.enabled = !isMicOn;
                setIsMicOn(!isMicOn);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Loading voice agent config...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <h3 className="text-lg font-semibold mb-2">Error</h3>
                <p>{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Link href="/research">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Voice Agent: {agent?.name} (v{agent?.version})
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Voice Model</p>
                            <p className="text-sm font-mono">{agent?.voice}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Temperature</p>
                            <p className="text-sm font-mono">{agent?.temperature}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Provider</p>
                            <p className="text-sm font-mono">{agent?.provider}</p>
                        </div>
                        <div className="pt-4 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-2">System Instructions</p>
                            <p className="text-xs text-muted-foreground line-clamp-6 bg-slate-50 p-2 rounded">
                                {agent?.systemPrompt}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-2 space-y-6 flex flex-col h-[600px]">
                    <Card className="flex-1 flex flex-col min-h-0 bg-slate-900 border-slate-800 text-slate-100">
                        <CardHeader className="border-b border-slate-800 py-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Volume2 className="h-4 w-4 text-green-400" /> Real-time Interaction
                                </CardTitle>
                                {active && (
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] text-green-400 font-mono uppercase">Live</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 font-sans" ref={scrollRef}>
                            {transcript.length === 0 && !active && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                                    <Bot className="h-12 w-12 mb-2" />
                                    <p>Start a session to begin testing the voice agent.</p>
                                </div>
                            )}

                            {transcript.map((t, i) => (
                                <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`flex gap-3 max-w-[85%] ${t.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${t.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                                            }`}>
                                            {t.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                        </div>
                                        <div
                                            className={`rounded-2xl px-4 py-2 text-sm shadow-md prose prose-invert max-w-none ${t.role === 'user'
                                                ? 'bg-blue-700 text-white rounded-tr-none'
                                                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                                }`}
                                            dangerouslySetInnerHTML={{ __html: md.render(t.content) }}
                                        />
                                    </div>
                                </div>
                            ))}

                            {isUserSpeaking && (
                                <div className="flex justify-end">
                                    <div className="bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full text-xs animate-pulse">
                                        USER SPEAKING...
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="p-4 border-t border-slate-800 flex justify-center gap-4 bg-slate-900/50">
                            {!active ? (
                                <Button size="lg" className="rounded-full px-8 bg-green-600 hover:bg-green-700" onClick={startSession}>
                                    <Play className="mr-2 h-4 w-4" /> Start Testing
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className={`rounded-full h-12 w-12 ${!isMicOn ? 'bg-red-900/20 border-red-500 text-red-500' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                                        onClick={toggleMic}
                                    >
                                        {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                                    </Button>
                                    <Button variant="destructive" size="lg" className="rounded-full px-8" onClick={cleanup}>
                                        <Square className="mr-2 h-4 w-4" /> Stop Session
                                    </Button>
                                </>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function VoiceTesterPage() {
    return (
        <Suspense fallback={<div>Loading Suspense...</div>}>
            <VoiceTesterContent />
        </Suspense>
    );
}
