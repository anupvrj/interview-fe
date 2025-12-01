"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Loader2,
  AlertCircle,
  PhoneOff,
  Volume2,
} from "lucide-react";
import { interviewApi, Interview } from "@/lib/api";
import { formatDuration } from "@/lib/utils";

const MAX_INTERVIEW_DURATION = 15 * 60; // 15 minutes in seconds

export default function RealtimeInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [connected, setConnected] = useState(false);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [videoStreamActive, setVideoStreamActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  // Transcript state
  const [transcript, setTranscript] = useState<
    Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>
  >([]);
  const [currentAssistantTranscript, setCurrentAssistantTranscript] =
    useState("");
  const [lastAIMessage, setLastAIMessage] = useState("");

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingAudioRef = useRef(false);
  const isInterviewActiveRef = useRef(false);

  useEffect(() => {
    loadInterview();
    return () => {
      cleanup();
    };
  }, [interviewId]);

  // Setup media stream after video element is mounted
  useEffect(() => {
    // Wait for video element to be available
    const checkVideoElement = () => {
      if (videoRef.current && !mediaStreamRef.current) {
        console.log("✅ Video element found, setting up media stream");
        setupMediaStream();
      } else if (!videoRef.current) {
        // Retry after a short delay if element not found
        setTimeout(checkVideoElement, 100);
      }
    };
    
    // Start checking after component mounts
    const timeoutId = setTimeout(checkVideoElement, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (isInterviewActive && elapsedTime >= MAX_INTERVIEW_DURATION) {
      endInterview();
    }
  }, [elapsedTime, isInterviewActive]);

  const loadInterview = async () => {
    try {
      const data = await interviewApi.get(interviewId);
      setInterview(data);
      // Don't call setupMediaStream here - let useEffect handle it after video element is mounted
      // setupMediaStream will be called by useEffect when videoRef.current is available
      await connectWebSocket();
    } catch (error: any) {
      console.error("Error loading interview:", error);
      setError("Failed to load interview. Please allow camera/mic access.");
    } finally {
      setLoading(false);
    }
  };

  const setupMediaStream = async () => {
    // Check if video element exists first
    if (!videoRef.current) {
      console.warn("⚠️ Video element not found yet, will retry...");
      // Retry after a short delay
      setTimeout(() => {
        if (videoRef.current) {
          setupMediaStream();
        } else {
          console.error("❌ Video element still not found after retry");
          setError("Video element not found. Please refresh the page.");
        }
      }, 500);
      return;
    }

    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "getUserMedia is not supported in this browser. Please use a modern browser."
        );
      }

      // Check if we're on HTTPS (required for production)
      if (
        window.location.protocol !== "https:" &&
        window.location.hostname !== "localhost"
      ) {
        console.warn(
          "⚠️ Camera/microphone access requires HTTPS in production"
        );
      }

      console.log("🎤 Requesting camera and microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user", // Front-facing camera
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000, // Match OpenAI's expected sample rate
          channelCount: 1, // Mono audio
        } as MediaTrackConstraints,
      });

      console.log("✅ Media stream acquired");
      console.log("Video tracks:", stream.getVideoTracks().length);
      console.log("Audio tracks:", stream.getAudioTracks().length);
      console.log(
        "Video track:",
        stream.getVideoTracks().map((t) => ({
          label: t.label,
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState,
        }))
      );

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Required for autoplay
        videoRef.current.playsInline = true; // Required for mobile

        // Explicitly play the video with better error handling
        try {
          await videoRef.current.play();
          console.log("✅ Video playback started");
          setVideoStreamActive(true);

          // Verify video is actually playing
          videoRef.current.addEventListener("playing", () => {
            console.log("✅ Video is playing");
            setVideoStreamActive(true);
          });

          videoRef.current.addEventListener("loadedmetadata", () => {
            console.log("✅ Video metadata loaded");
          });
        } catch (playError: any) {
          console.error("❌ Error playing video:", playError);
          setVideoStreamActive(false);
          // Try to get more specific error info
          if (playError.name === "NotAllowedError") {
            setError(
              "Video autoplay was blocked. Please interact with the page first."
            );
          } else {
            setError(`Video playback error: ${playError.message}`);
          }
        }
      } else {
        console.error("❌ Video element ref is null");
        setError("Video element not found. Please refresh the page.");
      }
    } catch (error: any) {
      console.error("❌ Error accessing media devices:", error);

      // Provide specific error messages
      let errorMessage =
        "Please allow camera and microphone access to continue.";

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        errorMessage =
          "Camera and microphone access was denied. Please allow permissions and refresh the page.";
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        errorMessage =
          "No camera or microphone found. Please connect a camera and microphone.";
      } else if (
        error.name === "NotReadableError" ||
        error.name === "TrackStartError"
      ) {
        errorMessage =
          "Camera or microphone is already in use by another application.";
      } else if (
        error.name === "OverconstrainedError" ||
        error.name === "ConstraintNotSatisfiedError"
      ) {
        errorMessage =
          "Camera or microphone doesn't support the required settings.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    }
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (websocketRef.current) websocketRef.current.close();
    if (audioProcessorRef.current) audioProcessorRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    audioQueueRef.current = [];
    isPlayingAudioRef.current = false;
    isInterviewActiveRef.current = false;
  };

  const connectWebSocket = async () => {
    try {
      const userId = localStorage.getItem("clerk-user-id");
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get API URL from environment (e.g., https://interview-core-production.up.railway.app/api)
      // Remove /api suffix and protocol to build WebSocket URL
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";
      const baseUrl = apiUrl.replace(/\/api$/, "").replace(/^https?:\/\//, "");

      // Use wss:// for HTTPS sites, ws:// for HTTP (localhost)
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${baseUrl}/api/interviews/${interviewId}/realtime?userId=${userId}`;

      console.log("🔌 Connecting to WebSocket:", wsUrl);
      const ws = new WebSocket(wsUrl);
      websocketRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "connected") {
            console.log("✅ Realtime interview connected");
          } else if (data.type === "openai_event") {
            handleOpenAIEvent(data.event);
          } else if (data.type === "error") {
            setError(data.message);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Connection error. Please try again.");
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        setConnected(false);
      };
    } catch (error: any) {
      console.error("Error connecting WebSocket:", error);
      setError(error.message || "Failed to connect to interview service.");
    }
  };

  const playAudioQueue = async () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) {
      isPlayingAudioRef.current = false;
      return;
    }

    isPlayingAudioRef.current = true;
    const pcm16Chunk = audioQueueRef.current.shift()!;

    // Convert PCM16 to Float32
    const float32 = new Float32Array(pcm16Chunk.length);
    for (let i = 0; i < pcm16Chunk.length; i++) {
      float32[i] = pcm16Chunk[i] / 32768.0;
    }

    // Create and play audio buffer
    const audioBuffer = audioContextRef.current.createBuffer(
      1,
      float32.length,
      24000 // 24kHz sample rate for OpenAI audio
    );
    audioBuffer.copyToChannel(float32, 0);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);

    // When this chunk finishes, play the next one
    source.onended = () => {
      if (audioQueueRef.current.length > 0) {
        playAudioQueue();
      } else {
        isPlayingAudioRef.current = false;
      }
    };

    source.start();
  };

  const handleOpenAIEvent = (event: any) => {
    switch (event.type) {
      case "conversation.item.input_audio_transcription.completed":
        if (event.transcript) {
          const userContent = event.transcript;
          setTranscript((prev) => [
            ...prev,
            {
              role: "user",
              content: userContent,
              timestamp: new Date(),
            },
          ]);
        }
        break;

      case "input_audio_buffer.speech_started":
        // User started speaking - stop AI audio immediately
        setIsUserSpeaking(true);
        audioQueueRef.current = [];
        isPlayingAudioRef.current = false;
        // Stop any currently playing audio
        if (audioContextRef.current) {
          audioContextRef.current.suspend();
          setTimeout(() => {
            if (audioContextRef.current?.state === "suspended") {
              audioContextRef.current.resume();
            }
          }, 100);
        }
        break;

      case "input_audio_buffer.speech_stopped":
        // User stopped speaking
        setIsUserSpeaking(false);
        break;

      case "response.created":
        // New response starting - clear current transcript and audio queue
        setCurrentAssistantTranscript(""); // Clear to start fresh
        audioQueueRef.current = [];
        isPlayingAudioRef.current = false;
        break;

      case "response.cancelled":
        // Response was cancelled (due to interruption)
        audioQueueRef.current = [];
        isPlayingAudioRef.current = false;
        setCurrentAssistantTranscript("");
        break;

      case "response.audio_transcript.delta":
        if (event.delta) {
          setCurrentAssistantTranscript((prev) => prev + event.delta);
        }
        break;

      case "response.audio_transcript.done":
        if (event.transcript) {
          setTranscript((prev) => [
            ...prev,
            {
              role: "assistant",
              content: event.transcript,
              timestamp: new Date(),
            },
          ]);
          // Save to lastAIMessage so it stays visible until next message
          setLastAIMessage(event.transcript);
          setCurrentAssistantTranscript("");
        }
        break;

      case "response.audio.done":
        // AI finished speaking
        break;

      case "response.audio.delta":
        // Queue AI audio for sequential playback
        if (event.delta) {
          try {
            // Decode base64 to PCM16
            const binaryString = atob(event.delta);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const pcm16 = new Int16Array(bytes.buffer);

            // Add to queue
            audioQueueRef.current.push(pcm16);

            // Start playing if not already playing
            if (!isPlayingAudioRef.current) {
              playAudioQueue();
            }
          } catch (error) {
            console.error("Error queueing AI audio:", error);
          }
        }
        break;

      case "response.done":
        // Response complete
        break;

      default:
      // Silently ignore unhandled events
    }
  };

  const setupAudioCapture = () => {
    if (!mediaStreamRef.current) {
      console.error("❌ No media stream available for audio capture");
      return;
    }

    try {
      const audioContext = new (globalThis.AudioContext ||
        (globalThis as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      console.log(
        `🎵 Audio resampling: ${audioContext.sampleRate}Hz → 24000Hz`
      );

      if (audioContext.sampleRate !== 24000) {
        console.warn(
          `⚠️ Sample rate mismatch! Browser: ${audioContext.sampleRate}Hz, OpenAI: 24000Hz. This may cause transcription issues.`
        );
      }

      const source = audioContext.createMediaStreamSource(
        mediaStreamRef.current
      );
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      let audioChunkCount = 0;
      let maxAmplitude = 0;

      // Critical: Calculate resampling ratio
      const browserSampleRate = audioContext.sampleRate;
      const targetSampleRate = 24000; // OpenAI expects 24kHz
      const resampleRatio = targetSampleRate / browserSampleRate;

      console.log(
        `🎵 Audio Resampling: ${browserSampleRate}Hz → ${targetSampleRate}Hz (ratio: ${resampleRatio.toFixed(
          4
        )})`
      );

      processor.onaudioprocess = (e) => {
        // Log status and audio level every 50 chunks (~5 seconds)
        if (audioChunkCount % 50 === 0) {
          console.log(
            `🎤 Audio status: active=${
              isInterviewActiveRef.current
            }, mic=${isMicOn}, ws=${
              websocketRef.current?.readyState
            }, maxLevel=${maxAmplitude.toFixed(3)}`
          );
          maxAmplitude = 0; // Reset
        }
        audioChunkCount++;

        // Continuously stream audio when interview is active and mic is on
        if (
          !isInterviewActiveRef.current ||
          !isMicOn ||
          !websocketRef.current ||
          websocketRef.current.readyState !== WebSocket.OPEN
        ) {
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);

        // CRITICAL FIX: Resample audio to 24kHz for OpenAI
        let resampledData = inputData;
        if (browserSampleRate !== targetSampleRate) {
          const targetLength = Math.floor(inputData.length * resampleRatio);
          resampledData = new Float32Array(targetLength);

          for (let i = 0; i < targetLength; i++) {
            const sourceIndex = i / resampleRatio;
            const index0 = Math.floor(sourceIndex);
            const index1 = Math.min(index0 + 1, inputData.length - 1);
            const fraction = sourceIndex - index0;

            // Linear interpolation for resampling
            resampledData[i] =
              inputData[index0] * (1 - fraction) + inputData[index1] * fraction;
          }
        }

        const pcm16 = new Int16Array(resampledData.length);

        // Convert float32 to int16 and track amplitude
        for (let i = 0; i < resampledData.length; i++) {
          const s = Math.max(-1, Math.min(1, resampledData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;

          // Track max amplitude for debugging
          const absVal = Math.abs(s);
          if (absVal > maxAmplitude) {
            maxAmplitude = absVal;
          }
        }

        // Convert Int16Array to base64 string
        const buffer = new Uint8Array(pcm16.buffer);
        let binary = "";
        const len = buffer.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(buffer[i]);
        }
        const base64Audio = btoa(binary);

        // Continuously stream audio to OpenAI (server VAD handles turn detection)
        if (audioChunkCount % 50 === 0) {
          console.log(
            `✅ Sending audio chunk #${audioChunkCount} to backend (${base64Audio.length} bytes, ${inputData.length}→${resampledData.length} samples)`
          );
        }
        websocketRef.current.send(
          JSON.stringify({
            type: "audio_chunk",
            audio: base64Audio,
          })
        );
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      audioProcessorRef.current = processor;
      console.log("✅ Audio capture setup complete");
    } catch (error) {
      console.error("Error setting up audio capture:", error);
    }
  };

  const startInterview = async () => {
    try {
      if (
        !websocketRef.current ||
        websocketRef.current.readyState !== WebSocket.OPEN
      ) {
        setError("WebSocket not connected. Please refresh and try again.");
        return;
      }

      // Start interview on backend
      await interviewApi.start(interviewId);

      // Set interview as active BEFORE setting up audio capture
      setIsInterviewActive(true);
      isInterviewActiveRef.current = true;

      // Setup audio capture (must be after setIsInterviewActive)
      setupAudioCapture();

      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      // Request first response from AI
      setTimeout(() => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
          console.log("🎤 Requesting AI to start the conversation...");
          websocketRef.current.send(
            JSON.stringify({
              type: "response.create",
            })
          );
        }
      }, 1000);
    } catch (error: any) {
      console.error("Error starting interview:", error);
      setError(error.message || "Failed to start interview.");
    }
  };

  const endInterview = async () => {
    try {
      // Stop timer
      if (timerRef.current) clearInterval(timerRef.current);

      // Close WebSocket
      if (websocketRef.current) {
        websocketRef.current.send(JSON.stringify({ type: "close" }));
        websocketRef.current.close();
      }

      // Complete interview
      await interviewApi.complete(interviewId);

      // Redirect to processing page
      router.push(`/dashboard/interviews/${interviewId}/processing`);
    } catch (error: any) {
      console.error("Error ending interview:", error);
      setError(error.message || "Failed to end interview.");
    }
  };

  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
      }
    }
  };

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error && !isInterviewActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              {interview?.metadata.role || "Interview"}
            </h1>
            <p className="text-sm text-gray-400">
              {formatDuration(elapsedTime)} /{" "}
              {formatDuration(MAX_INTERVIEW_DURATION)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Progress
              value={(elapsedTime / MAX_INTERVIEW_DURATION) * 100}
              className="w-32 h-2"
            />
            {isInterviewActive && (
              <Button
                variant="destructive"
                size="sm"
                onClick={endInterview}
                className="ml-4"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                End Interview
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Left: AI Avatar/Conversation */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center transition-all ${
                    isUserSpeaking
                      ? "ring-4 ring-green-400 scale-110"
                      : currentAssistantTranscript
                      ? "ring-4 ring-purple-400 scale-110"
                      : ""
                  }`}
                >
                  <Volume2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">AI Interviewer</h2>
                  <p className="text-sm text-gray-400">
                    {!connected
                      ? "Connecting..."
                      : isUserSpeaking
                      ? "🎤 Listening to you..."
                      : currentAssistantTranscript
                      ? "🗣️ Speaking..."
                      : "Ready"}
                  </p>
                </div>
              </div>

              {!isInterviewActive ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-6">
                    Ready to start your interview?
                  </p>
                  <Button
                    onClick={startInterview}
                    disabled={!connected}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    Start Interview
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-[200px] px-4">
                  {currentAssistantTranscript ? (
                    // AI is actively speaking
                    <div className="p-6 rounded-lg bg-purple-600/20 max-w-xl w-full">
                      <div className="text-xs text-purple-400 mb-2 font-semibold">
                        Speaking...
                      </div>
                      <div className="text-base leading-relaxed">
                        {currentAssistantTranscript}
                      </div>
                    </div>
                  ) : lastAIMessage ? (
                    // Show last AI message until next one starts
                    <div className="p-6 rounded-lg bg-purple-600/10 max-w-xl w-full border border-purple-500/20">
                      <div className="text-base leading-relaxed text-gray-300">
                        {lastAIMessage}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center">
                      Listening to your response...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Webcam */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => {
                    console.log("Video metadata loaded");
                    setVideoStreamActive(true);
                  }}
                  onPlaying={() => {
                    console.log("Video is playing");
                    setVideoStreamActive(true);
                  }}
                  onError={(e) => {
                    console.error("Video element error:", e);
                    setVideoStreamActive(false);
                  }}
                />
                {(!isCameraOn || !videoStreamActive) && (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <VideoOff className="w-16 h-16 text-gray-600" />
                    {!videoStreamActive && (
                      <p className="absolute bottom-4 text-sm text-gray-400">
                        Waiting for camera...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Transcription */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4">Real-time Transcription</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transcript.length === 0 && !currentAssistantTranscript ? (
                <p className="text-gray-400 text-sm">
                  Transcription will appear here...
                </p>
              ) : (
                <>
                  {transcript.map((item, index) => (
                    <div
                      key={index}
                      className={`text-sm p-3 rounded ${
                        item.role === "user"
                          ? "bg-blue-600/30"
                          : "bg-purple-600/30"
                      }`}
                    >
                      <span
                        className={`font-semibold ${
                          item.role === "user"
                            ? "text-blue-400"
                            : "text-purple-400"
                        }`}
                      >
                        {item.role === "user" ? "You: " : "AI: "}
                      </span>
                      <span className="text-gray-200">{item.content}</span>
                    </div>
                  ))}
                  {currentAssistantTranscript && (
                    <div className="text-sm p-3 rounded bg-purple-600/40 border border-purple-500/50 animate-pulse">
                      <span className="font-semibold text-purple-300">
                        AI (speaking...):
                      </span>
                      <span className="text-gray-200">
                        {currentAssistantTranscript}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant={isMicOn ? "default" : "destructive"}
            size="lg"
            onClick={toggleMic}
            className="rounded-full w-16 h-16"
          >
            {isMicOn ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </Button>
          <Button
            variant={isCameraOn ? "default" : "destructive"}
            size="lg"
            onClick={toggleCamera}
            className="rounded-full w-16 h-16"
          >
            {isCameraOn ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
