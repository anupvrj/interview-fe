"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { researchApi } from "@/lib/researchApi";
import { Loader2, ArrowLeft, Save, Mic, Play } from "lucide-react";
import Link from "next/link";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

export default function EditVoiceAgentPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = require("react").use(params) as { id: string };
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        version: "v1",
        description: "",
        environment: "development",
        voice: "alloy",
        temperature: 0.8,
        silenceDurationMs: 2500,
        systemPrompt: "You are a helpful AI assistant. Respond warmly and concisely.",
        language: "en",
        provider: "gemini"
    });

    useEffect(() => {
        const fetchAgent = async () => {
            try {
                setInitialLoad(true);
                const data = await researchApi.getVoiceAgent(resolvedParams.id);
                setFormData({
                    name: data.name || "",
                    version: data.version || "v1",
                    description: data.description || "",
                    environment: data.environment || "development",
                    voice: data.voice || "alloy",
                    temperature: data.temperature ?? 0.8,
                    silenceDurationMs: data.silenceDurationMs ?? 2500,
                    systemPrompt: data.systemPrompt || "",
                    language: data.language || "en",
                    provider: data.provider || "openai" // or "gemini" depending on default
                });
            } catch (err) {
                console.error("Failed to load voice agent:", err);
                setError("Failed to load voice agent configuration.");
            } finally {
                setInitialLoad(false);
            }
        };

        if (resolvedParams.id) {
            fetchAgent();
        }
    }, [resolvedParams.id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "temperature" || name === "silenceDurationMs" ? Number(value) : value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            setError("Name is required");
            return;
        }

        if (!formData.systemPrompt) {
            setError("System Prompt is required");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await researchApi.updateVoiceAgent(resolvedParams.id, formData);
            router.push("/research");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to update voice agent");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoad) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /></div>;
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden pb-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-4">
                    <Link href="/research">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Voice Agent</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Voice Agent
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal">

                    {/* Left: Configuration Form */}
                    <ResizablePanel defaultSize={35} minSize={25} maxSize={50} className="border-r bg-slate-50 p-6 overflow-y-auto">
                        <div className="space-y-6">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                                    {error}
                                </div>
                            )}

                            <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">General Profile</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Name <span className="text-red-500">*</span></label>
                                    <Input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Senior Tech Interviewer" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Version</label>
                                        <Input name="version" value={formData.version} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Environment</label>
                                        <select
                                            name="environment"
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                            value={formData.environment}
                                            onChange={handleChange}
                                        >
                                            <option value="development">Development</option>
                                            <option value="staging">Staging</option>
                                            <option value="production">Production</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Textarea name="description" value={formData.description} onChange={handleChange} className="h-20 resize-none" placeholder="What is this voice persona used for?" />
                                </div>
                            </div>

                            <hr />

                            <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Voice Capabilities</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">LLM Provider</label>
                                        <select
                                            name="provider"
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                            value={formData.provider}
                                            onChange={handleChange}
                                        >
                                            <option value="openai">OpenAI (Realtime)</option>
                                            <option value="gemini">Google Gemini (Multimodal Live)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Voice Model</label>
                                        <select
                                            name="voice"
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                            value={formData.voice}
                                            onChange={handleChange}
                                        >
                                            <option value="alloy">Alloy (Neutral)</option>
                                            <option value="echo">Echo (Male)</option>
                                            <option value="fable">Fable (Male/British)</option>
                                            <option value="onyx">Onyx (Deep Male)</option>
                                            <option value="nova">Nova (Energetic Female)</option>
                                            <option value="shimmer">Shimmer (Clear Female)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Language Hint</label>
                                        <Input name="language" value={formData.language} onChange={handleChange} placeholder="e.g. 'en', 'es'" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Temperature</label>
                                        <Input type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleChange} />
                                        <p className="text-xs text-muted-foreground">Creativity (0.0 to 1.0)</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Silence Threshold (ms)</label>
                                    <Input type="number" step="100" name="silenceDurationMs" value={formData.silenceDurationMs} onChange={handleChange} />
                                    <p className="text-xs text-muted-foreground">Time before AI responds</p>
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Right: System Prompt Editor and Tester Pane */}
                    <ResizablePanel defaultSize={65} minSize={30} className="flex flex-col bg-white">
                        <div className="flex-1 flex flex-col p-6 h-full">
                            <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider mb-4">Interviewer System Prompt</h3>
                            <Textarea
                                name="systemPrompt"
                                value={formData.systemPrompt}
                                onChange={handleChange}
                                className="flex-1 font-mono text-sm resize-none p-4"
                                spellCheck={false}
                                placeholder="You are a senior technical interviewer. Keep responses brief to enable back-and-forth conversation..."
                            />

                            <div className="mt-6 bg-slate-50 border p-6 rounded-lg text-center flex flex-col items-center justify-center">
                                <span className="bg-green-100 text-green-700 p-4 rounded-full mb-4">
                                    <Mic className="h-8 w-8" />
                                </span>
                                <h3 className="font-semibold text-lg mb-2">Voice Playground Testbed</h3>
                                <p className="text-muted-foreground text-sm max-w-sm mb-6">
                                    Save your agent first to test the system prompt and verify the turn-detection thresholds live in your browser.
                                </p>
                                <Button disabled className="bg-slate-200 text-slate-500">
                                    <Play className="mr-2 h-4 w-4" />
                                    Save to Test Voice
                                </Button>
                            </div>
                        </div>
                    </ResizablePanel>

                </ResizablePanelGroup>
            </div>
        </div>
    );
}
