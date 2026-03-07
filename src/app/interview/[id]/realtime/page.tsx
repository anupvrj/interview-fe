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
  Circle,
  Square,
} from "lucide-react";
import { interviewApi, Interview } from "@/lib/api";
import { formatDuration } from "@/lib/utils";

const MAX_INTERVIEW_DURATION = 15 * 60; // 15 minutes in seconds

/** Voice provider for realtime: "chatgpt" (default) or "gemini". Set via NEXT_PUBLIC_VOICE_PROVIDER. */
const VOICE_PROVIDER: "chatgpt" | "gemini" =
  (process.env.NEXT_PUBLIC_VOICE_PROVIDER as "chatgpt" | "gemini") || "chatgpt";

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
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);

  // Transcript state
  const [transcript, setTranscript] = useState<
    Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>
  >([]);
  const [currentAssistantTranscript, setCurrentAssistantTranscript] =
    useState("");
  const [currentUserTranscript, setCurrentUserTranscript] = useState(""); // For Gemini partial transcripts
  const [isAISpeaking, setIsAISpeaking] = useState(false); // Track if AI is actually speaking
  const [lastAIMessage, setLastAIMessage] = useState("");

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const audioBufferRef = useRef<Int16Array[]>([]); // Buffer for batching small chunks
  const audioBufferTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingAudioRef = useRef(false);
  const isInterviewActiveRef = useRef(false);
  const connectionInitiatedRef = useRef(false); // Prevent duplicate connections
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const aiAudioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(
    null
  );
  const voiceProviderRef = useRef<"chatgpt" | "gemini">(VOICE_PROVIDER);

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
        globalThis.location.protocol !== "https:" &&
        globalThis.location.hostname !== "localhost"
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
    // Stop recording if active
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error("Error stopping recorder during cleanup:", error);
      }
    }
    // Stop screen capture stream
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    // Clean up AI audio destination
    if (aiAudioDestinationRef.current) {
      aiAudioDestinationRef.current.disconnect();
      aiAudioDestinationRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    audioQueueRef.current = [];
    audioBufferRef.current = [];
    if (audioBufferTimerRef.current) {
      clearTimeout(audioBufferTimerRef.current);
      audioBufferTimerRef.current = null;
    }
    recordedChunksRef.current = [];
    isPlayingAudioRef.current = false;
    isInterviewActiveRef.current = false;
    connectionInitiatedRef.current = false; // Reset for next connection
  };

  const connectWebSocket = async () => {
    // Prevent duplicate connections (React Strict Mode can cause double mounting)
    if (connectionInitiatedRef.current) {
      console.warn("⚠️ WebSocket connection already initiated, skipping duplicate");
      return;
    }
    
    try {
      console.log("🔌 Initiating WebSocket connection");
      connectionInitiatedRef.current = true;
      
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
      const wsProtocol =
        globalThis.location.protocol === "https:" ? "wss:" : "ws:";
      const realtimePath =
        VOICE_PROVIDER === "gemini"
          ? `interviews/${interviewId}/realtime/gemini`
          : `interviews/${interviewId}/realtime`;
      const wsUrl = `${wsProtocol}//${baseUrl}/api/${realtimePath}?userId=${userId}`;

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
            if (data.provider) voiceProviderRef.current = data.provider;
          } else if (data.type === "openai_event") {
            handleOpenAIEvent(data.event);
          } else if (data.type === "audio_response") {
            handleGeminiAudioResponse(data.audioData);
            setIsAISpeaking(true); // AI is sending audio, so it's speaking
          } else if (data.type === "text_response") {
            // AI transcript - only add complete sentences to transcript
            if (data.text) {
              console.log(`🤖 AI transcript: "${data.text.substring(0, 50)}..." (finished: ${data.finished !== false})`);
              if (data.finished !== false) {
                // Complete transcript - add to chat history
                console.log(`✅ Adding complete AI transcript to UI`);
                setTranscript((prev) => [
                  ...prev,
                  { role: "assistant", content: data.text, timestamp: new Date() },
                ]);
                setLastAIMessage(data.text);
              }
            }
          } else if (data.type === "turn_complete") {
            // AI finished speaking - clear the "speaking..." indicator
            console.log("✅ AI turn complete - clearing speaking indicator");
            setIsAISpeaking(false);
            setCurrentAssistantTranscript("");
            isPlayingAudioRef.current = false;
          } else if (data.type === "user_transcript") {
            // Gemini sends partial transcripts - only show complete ones
            if (data.text) {
              console.log(`📝 User transcript: "${data.text.substring(0, 50)}..." (finished: ${data.finished !== false})`);
              if (data.finished !== false) {
                // Complete transcript - add to chat history
                console.log(`✅ Adding complete user transcript to UI`);
                setTranscript((prev) => [
                  ...prev,
                  { role: "user", content: data.text, timestamp: new Date() },
                ]);
                setCurrentUserTranscript(""); // Clear partial
              } else {
                // Partial transcript - just update state (for debugging, not shown in UI)
                setCurrentUserTranscript(data.text);
              }
            }
          } else if (data.type === "interrupted") {
            audioQueueRef.current = [];
            audioBufferRef.current = [];
            if (audioBufferTimerRef.current) {
              clearTimeout(audioBufferTimerRef.current);
              audioBufferTimerRef.current = null;
            }
            isPlayingAudioRef.current = false;
            setIsAISpeaking(false); // Clear AI speaking state
            setCurrentAssistantTranscript("");
            setCurrentUserTranscript(""); // Clear partial user transcript
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
      float32[i] = pcm16Chunk[i] / 32768;
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

    // Connect to speakers for playback
    source.connect(audioContextRef.current.destination);

    // Also connect to recording destination if it exists (for capturing AI voice)
    if (aiAudioDestinationRef.current) {
      source.connect(aiAudioDestinationRef.current);
    }

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

  /** Decode Gemini audio_response (base64 PCM 24kHz) and batch for smooth playback. */
  const handleGeminiAudioResponse = (base64Audio: string) => {
    if (!base64Audio) return;
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.codePointAt(i) ?? 0;
      }
      
      // Skip empty audio chunks (0 bytes) to prevent stuttering
      if (bytes.length === 0) return;
      
      const pcm16 = new Int16Array(bytes.buffer);
      
      // Add to buffer for batching
      audioBufferRef.current.push(pcm16);
      
      // Clear existing timer
      if (audioBufferTimerRef.current) {
        clearTimeout(audioBufferTimerRef.current);
      }
      
      // Flush buffer after 20ms of no new chunks (batches small chunks together, low latency)
      audioBufferTimerRef.current = setTimeout(() => {
        if (audioBufferRef.current.length > 0) {
          // Concatenate all buffered chunks into one
          const totalLength = audioBufferRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
          const combined = new Int16Array(totalLength);
          let offset = 0;
          
          for (const chunk of audioBufferRef.current) {
            combined.set(chunk, offset);
            offset += chunk.length;
          }
          
          // Add combined chunk to playback queue
          audioQueueRef.current.push(combined);
          audioBufferRef.current = [];
          
          // Start playing if not already playing
          if (!isPlayingAudioRef.current) {
            playAudioQueue();
          }
        }
      }, 20);
    } catch (err) {
      console.error("Error queueing Gemini audio:", err);
    }
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
        audioBufferRef.current = [];
        if (audioBufferTimerRef.current) {
          clearTimeout(audioBufferTimerRef.current);
          audioBufferTimerRef.current = null;
        }
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
        audioBufferRef.current = [];
        if (audioBufferTimerRef.current) {
          clearTimeout(audioBufferTimerRef.current);
          audioBufferTimerRef.current = null;
        }
        isPlayingAudioRef.current = false;
        break;

      case "response.cancelled":
        // Response was cancelled (due to interruption)
        audioQueueRef.current = [];
        audioBufferRef.current = [];
        if (audioBufferTimerRef.current) {
          clearTimeout(audioBufferTimerRef.current);
          audioBufferTimerRef.current = null;
        }
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
              bytes[i] = binaryString.codePointAt(i) ?? 0;
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
          binary += String.fromCodePoint(buffer[i]);
        }
        const base64Audio = btoa(binary);

        // Stream audio: Gemini expects { type: "audio", audioData }; ChatGPT expects { type: "audio_chunk", audio }
        const isGemini = voiceProviderRef.current === "gemini";
        websocketRef.current.send(
          JSON.stringify(
            isGemini
              ? { type: "audio", audioData: base64Audio }
              : { type: "audio_chunk", audio: base64Audio }
          )
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

      // Request first response: ChatGPT uses response.create; Gemini uses a text nudge
      setTimeout(() => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
          if (voiceProviderRef.current === "gemini") {
            console.log("🎤 Telling Gemini to start the interview...");
            websocketRef.current.send(
              JSON.stringify({
                type: "text",
                text: "I'm ready. Please start the interview with a brief greeting and your first question.",
              })
            );
          } else {
            console.log("🎤 Requesting AI to start the conversation...");
            websocketRef.current.send(
              JSON.stringify({ type: "response.create" })
            );
          }
        }
      }, 1000);
    } catch (error: any) {
      console.error("Error starting interview:", error);
      setError(error.message || "Failed to start interview.");
    }
  };

  const endInterview = async () => {
    try {
      // Immediately stop screen capture to remove red indicator
      const currentScreenStream = screenStreamRef.current;
      if (currentScreenStream) {
        console.log("🛑 Stopping screen capture immediately...");
        currentScreenStream.getTracks().forEach((track: MediaStreamTrack) => {
          if (track.readyState === "live") {
            track.stop();
            console.log(`✅ Stopped screen track: ${track.kind}`);
          }
        });
        screenStreamRef.current = null;
      }

      // Stop recording if active
      if (
        isRecording &&
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        console.log("🛑 Stopping recording before ending interview...");
        stopRecording();

        // Wait a bit for recording to stop and upload to complete
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Stop timer
      if (timerRef.current) clearInterval(timerRef.current);

      // Close WebSocket (Gemini expects end_session first)
      if (websocketRef.current) {
        if (voiceProviderRef.current === "gemini") {
          websocketRef.current.send(JSON.stringify({ type: "end_session" }));
        } else {
          websocketRef.current.send(JSON.stringify({ type: "close" }));
        }
        websocketRef.current.close();
      }

      // Ensure screen capture is stopped (double check)
      const finalScreenStream = screenStreamRef.current;
      if (finalScreenStream) {
        finalScreenStream.getTracks().forEach((track: MediaStreamTrack) => {
          if (track.readyState === "live") {
            track.stop();
          }
        });
        screenStreamRef.current = null;
      }

      // Update state
      setIsInterviewActive(false);
      isInterviewActiveRef.current = false;

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

  const startRecording = async () => {
    try {
      // Request screen capture (user will select tab/window/screen)
      console.log("🖥️ Requesting screen capture...");
      console.log("💡 The current tab should now appear in the picker!");
      console.log(
        "   1. Select the 'Interview Trix' tab (should be visible now)"
      );
      console.log(
        "   2. Enable 'Also share tab audio' checkbox for best quality"
      );
      console.log("   3. Click 'Share' to start recording");

      // Try to get display media with flexible constraints
      // Include the current tab in the picker using selfBrowserSurface (prevents "hall of mirrors")
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser", // Prefer browser tab
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
          frameRate: { ideal: 30, max: 60 },
        } as MediaTrackConstraints,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          suppressLocalAudioPlayback: false,
        } as MediaTrackConstraints,
        // Allow current tab to appear in the picker (prevents "hall of mirrors" exclusion)
        selfBrowserSurface: "include" as any,
        // Prefer current tab to be pre-selected
        preferCurrentTab: true as any,
      } as any);

      // Log what was selected and check for tab audio
      const selectedVideoTrack = screenStream.getVideoTracks()[0];
      const initialScreenAudioTracks = screenStream.getAudioTracks();
      let displayType = "unknown";

      if (selectedVideoTrack && (selectedVideoTrack as any).getSettings) {
        const settings = (selectedVideoTrack as any).getSettings();
        displayType = settings.displaySurface || "unknown";
        console.log("📺 Screen capture selected:", {
          displaySurface: displayType,
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate,
          hasAudio: initialScreenAudioTracks.length > 0,
        });
      }

      // Check if we have tab audio (required for AI voice via screen capture)
      if (initialScreenAudioTracks.length === 0 && displayType !== "browser") {
        // User selected window or screen, which doesn't support tab audio
        console.warn(
          "⚠️ No tab audio available - tab audio only works when sharing a browser tab"
        );

        // Ask user to cancel and try again with a tab
        const shouldRetry = globalThis.confirm(
          "⚠️ Tab audio is not available.\n\n" +
            "To capture the AI's voice, you need to share THIS browser tab (not window or screen).\n\n" +
            "Please:\n" +
            "1. Click Cancel below\n" +
            "2. Click 'Start Recording' again\n" +
            "3. In the screen share dialog, select the tab with 'Interview Trix'\n" +
            "4. Enable the 'Also share tab audio' checkbox\n\n" +
            "Click OK to continue anyway (AI voice may not be captured fully), or Cancel to retry."
        );

        if (!shouldRetry) {
          // User wants to retry - stop the current stream and return
          screenStream.getTracks().forEach((track) => track.stop());
          return;
        }
      } else if (displayType === "browser") {
        console.log(
          "✅ Browser tab selected - perfect! Tab audio should be available."
        );
      } else if (displayType === "window" || displayType === "monitor") {
        console.log(
          `ℹ️ ${
            displayType === "window" ? "Window" : "Screen"
          } selected - tab audio not available, but AI voice will be captured via AudioContext.`
        );
      }

      screenStreamRef.current = screenStream;

      // Use the existing microphone stream from mediaStreamRef (already in use for interview)
      // This avoids requesting a second microphone stream which might fail or be muted
      let micStream: MediaStream | null = null;
      if (mediaStreamRef.current) {
        const existingMicTracks = mediaStreamRef.current.getAudioTracks();
        if (existingMicTracks.length > 0) {
          // Create a new stream with the existing microphone track
          micStream = new MediaStream();
          existingMicTracks.forEach((track) => {
            // Clone the track or use it directly
            micStream!.addTrack(track);
          });
          console.log(
            `🎤 Using existing microphone track for recording (${existingMicTracks.length} track(s))`
          );
        } else {
          console.warn("⚠️ No microphone track found in existing media stream");
        }
      }

      // Fallback: Request microphone if not available from existing stream
      if (!micStream || micStream.getAudioTracks().length === 0) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 48000,
            } as MediaTrackConstraints,
          });
          console.log("🎤 Microphone stream acquired separately for recording");
        } catch (micError) {
          console.warn("⚠️ Could not get microphone for recording:", micError);
          // Continue without microphone audio
        }
      }

      // Combine screen video with microphone audio
      const videoTrack = screenStream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error("No video track in screen capture. Please try again.");
      }

      // Verify video track is active
      if (videoTrack.readyState !== "live") {
        throw new Error(
          "Screen capture video track is not live. Please try again."
        );
      }

      const audioTracks: MediaStreamTrack[] = [];

      // Check for tab audio first (PRIMARY source for AI voice - highest quality)
      const screenAudioTracks = screenStream.getAudioTracks();
      let hasTabAudio = screenAudioTracks.length > 0;

      if (hasTabAudio) {
        console.log(
          `🔊 Tab audio tracks: ${screenAudioTracks.length} (AI voice will be captured from tab)`
        );
        // Add tab audio tracks to recording - this is the PRIMARY source for AI voice
        audioTracks.push(...screenAudioTracks);
        console.log("✅ Tab audio tracks added to recording");
      } else {
        console.warn(
          "⚠️ No tab audio detected - will use AudioContext as fallback"
        );
      }

      // Create MediaStreamAudioDestination to capture AI audio directly from AudioContext
      // ONLY use this as a fallback if tab audio is not available (to avoid echo)
      if (!hasTabAudio && audioContextRef.current) {
        const aiAudioDestination =
          audioContextRef.current.createMediaStreamDestination();
        aiAudioDestinationRef.current = aiAudioDestination;
        console.log(
          "🎙️ Created AI audio capture destination (fallback - no tab audio)"
        );

        // Add AI audio track to recording (only if tab audio is not available)
        const aiAudioTrack = aiAudioDestination.stream.getAudioTracks()[0];
        if (aiAudioTrack) {
          audioTracks.push(aiAudioTrack);
          console.log(
            "✅ AI audio track added to recording (AudioContext fallback)"
          );
        }
      } else if (hasTabAudio && audioContextRef.current) {
        // Still create the destination for playAudioQueue to connect to, but don't add to recording
        // This prevents echo while still allowing AudioContext to work for playback
        const aiAudioDestination =
          audioContextRef.current.createMediaStreamDestination();
        aiAudioDestinationRef.current = aiAudioDestination;
        console.log(
          "🎙️ Created AI audio destination (for playback only - tab audio used for recording)"
        );
      } else if (!audioContextRef.current) {
        console.warn(
          "⚠️ AudioContext not available - AI audio capture may not work"
        );
      }

      // Add microphone audio if available (this captures user's voice)
      if (micStream) {
        const micAudioTracks = micStream.getAudioTracks();
        if (micAudioTracks.length > 0) {
          console.log(
            `🎤 Microphone audio tracks: ${micAudioTracks.length} (Your voice will be captured)`
          );
          // Verify tracks are enabled and not muted
          micAudioTracks.forEach((track, index) => {
            console.log(`🎤 Mic track ${index + 1}:`, {
              id: track.id,
              label: track.label,
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState,
            });
            // Ensure track is enabled
            if (!track.enabled) {
              track.enabled = true;
              console.log(`✅ Enabled microphone track ${index + 1}`);
            }
          });
          audioTracks.push(...micAudioTracks);
          console.log("✅ Microphone audio tracks added to recording");
        } else {
          console.warn("⚠️ Microphone stream has no audio tracks");
        }
      } else {
        console.warn("⚠️ No microphone stream available for recording");
      }

      // Mix all audio tracks into a single track using AudioContext
      // MediaRecorder may not properly handle multiple audio tracks, so we mix them
      let finalAudioTrack: MediaStreamTrack | null = null;

      if (audioTracks.length > 0) {
        try {
          // Create a new AudioContext for mixing (separate from the interview AudioContext)
          const mixAudioContext = new (globalThis.AudioContext ||
            (globalThis as any).webkitAudioContext)();

          // Create a destination node for the mixed audio
          const mixedDestination =
            mixAudioContext.createMediaStreamDestination();

          console.log(
            `🎚️ Mixing ${audioTracks.length} audio tracks into one...`
          );

          // Connect all audio tracks to the mixer
          audioTracks.forEach((track, index) => {
            try {
              // Create a MediaStream with just this track
              const trackStream = new MediaStream([track]);
              const source =
                mixAudioContext.createMediaStreamSource(trackStream);

              // Connect to the mixer destination
              source.connect(mixedDestination);

              console.log(`✅ Connected audio track ${index + 1} to mixer:`, {
                label: track.label || "unknown",
                kind: track.kind,
                enabled: track.enabled,
                muted: track.muted,
              });
            } catch (err) {
              console.warn(
                `⚠️ Failed to connect audio track ${index + 1} to mixer:`,
                err
              );
            }
          });

          // Get the mixed audio track
          const mixedTracks = mixedDestination.stream.getAudioTracks();
          if (mixedTracks.length > 0) {
            finalAudioTrack = mixedTracks[0];
            console.log("✅ Created mixed audio track with all sources:", {
              id: finalAudioTrack.id,
              label: finalAudioTrack.label,
              enabled: finalAudioTrack.enabled,
              muted: finalAudioTrack.muted,
            });
          } else {
            console.warn("⚠️ No mixed audio track created");
          }
        } catch (mixError) {
          console.error("❌ Failed to create audio mixer:", mixError);
          // Fallback: use all tracks (let MediaRecorder handle it)
          console.log(
            "⚠️ Falling back to multiple audio tracks (MediaRecorder may only record first)"
          );
        }
      }

      // Create combined stream with video and mixed audio
      const combinedStream = new MediaStream();
      combinedStream.addTrack(videoTrack);

      if (finalAudioTrack) {
        combinedStream.addTrack(finalAudioTrack);
        console.log("✅ Added mixed audio track to recording stream");
      } else if (audioTracks.length > 0) {
        // Fallback: add all tracks if mixing failed
        audioTracks.forEach((track) => combinedStream.addTrack(track));
        console.warn(
          `⚠️ Added ${audioTracks.length} audio tracks directly (mixing failed - MediaRecorder may only record first)`
        );
      } else {
        console.warn("⚠️ No audio track available for recording");
      }

      // Monitor video track for issues
      videoTrack.addEventListener("ended", () => {
        console.warn("⚠️ Screen capture video track ended unexpectedly");
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          stopRecording();
        }
      });

      videoTrack.addEventListener("mute", () => {
        console.warn("⚠️ Screen capture video track muted");
      });

      videoTrack.addEventListener("unmute", () => {
        console.log("✅ Screen capture video track unmuted");
      });

      // Handle screen share stop (user clicks stop sharing)
      screenStream.getVideoTracks()[0].addEventListener("ended", () => {
        console.log("🛑 Screen sharing stopped by user");
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          stopRecording();
        }
      });

      console.log("🎥 Recording setup:", {
        videoTracks: combinedStream.getVideoTracks().length,
        audioTracks: combinedStream.getAudioTracks().length,
        tabAudio: screenAudioTracks.length,
        aiAudioContext: aiAudioDestinationRef.current ? 1 : 0,
        micAudio: micStream ? micStream.getAudioTracks().length : 0,
        totalAudioTracks: audioTracks.length,
      });

      // Log each audio track for debugging
      combinedStream.getAudioTracks().forEach((track, index) => {
        console.log(`🎵 Audio track ${index + 1}:`, {
          id: track.id,
          label: track.label,
          kind: track.kind,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
        });
      });

      // Check if MediaRecorder is supported
      const mimeType = "video/webm;codecs=vp8,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Try alternative formats
        const alternatives = [
          "video/webm;codecs=vp9,opus",
          "video/webm",
          "video/mp4",
        ];
        let supportedType = null;
        for (const alt of alternatives) {
          if (MediaRecorder.isTypeSupported(alt)) {
            supportedType = alt;
            break;
          }
        }
        if (!supportedType) {
          throw new Error("No supported video format found in this browser.");
        }
        console.log(`⚠️ Using alternative format: ${supportedType}`);
      }

      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType)
          ? mimeType
          : "video/webm",
        videoBitsPerSecond: 5000000, // 5 Mbps for screen recording
      });

      let totalSize = 0;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          totalSize += event.data.size;
          console.log(
            `📦 Chunk received: ${event.data.size} bytes (total: ${totalSize} bytes)`
          );
        } else {
          console.warn("⚠️ Empty data chunk received");
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop screen capture tracks
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => {
            if (track.readyState === "live") {
              track.stop();
            }
          });
        }

        // Clean up AI audio destination
        if (aiAudioDestinationRef.current) {
          // Disconnect all connections
          aiAudioDestinationRef.current.disconnect();
          aiAudioDestinationRef.current = null;
        }

        const totalBytes = recordedChunksRef.current.reduce(
          (sum, chunk) => sum + chunk.size,
          0
        );
        console.log(
          `📹 Recording stopped. Total size: ${(
            totalBytes /
            1024 /
            1024
          ).toFixed(2)} MB, Chunks: ${recordedChunksRef.current.length}`
        );

        // Minimum size check - should be at least 100KB for a meaningful recording
        if (totalBytes < 100 * 1024) {
          console.error("❌ Recording too small, likely failed");
          setError(
            "Recording failed - file too small. Please ensure screen sharing is active and try again."
          );
          setIsRecording(false);
          recordedChunksRef.current = [];
          // Clean up screen stream
          if (screenStreamRef.current) {
            screenStreamRef.current
              .getTracks()
              .forEach((track) => track.stop());
            screenStreamRef.current = null;
          }
          return;
        }

        await uploadRecording();
      };

      mediaRecorder.onerror = (event: any) => {
        console.error("❌ MediaRecorder error:", event);
        setError(`Recording error: ${event.error?.message || "Unknown error"}`);
        setIsRecording(false);
      };

      // Wait a bit to ensure stream is ready
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify combined stream is active
      if (!combinedStream || combinedStream.active === false) {
        throw new Error(
          "Screen capture stream is not active. Please try again."
        );
      }

      const activeVideoTracks = combinedStream
        .getVideoTracks()
        .filter((t) => t.enabled && t.readyState === "live");
      const activeAudioTracks = combinedStream
        .getAudioTracks()
        .filter((t) => t.enabled && t.readyState === "live");

      if (activeVideoTracks.length === 0) {
        throw new Error(
          "No video track available. Please ensure screen sharing is active."
        );
      }

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      console.log("🔴 Recording started with MediaRecorder", {
        state: mediaRecorder.state,
        streamActive: combinedStream.active,
        activeVideoTracks: activeVideoTracks.length,
        activeAudioTracks: activeAudioTracks.length,
      });

      // Monitor recording health - check every 5 seconds
      const recordingHealthCheck = setInterval(() => {
        if (!isRecording || !mediaRecorderRef.current) {
          clearInterval(recordingHealthCheck);
          return;
        }

        const currentChunks = recordedChunksRef.current.length;
        const currentSize = recordedChunksRef.current.reduce(
          (sum, chunk) => sum + chunk.size,
          0
        );

        console.log(
          `📊 Recording health: ${currentChunks} chunks, ${(
            currentSize / 1024
          ).toFixed(2)} KB`
        );

        // If after 10 seconds we have less than 10KB, something is wrong
        if (currentSize < 10 * 1024 && currentChunks > 10) {
          console.error(
            "❌ Recording appears to be producing very little data"
          );
          setError(
            "Recording may not be working properly. Please stop and try again."
          );
        }
      }, 5000);

      // Clean up health check when recording stops
      mediaRecorder.addEventListener("stop", () => {
        clearInterval(recordingHealthCheck);
      });
    } catch (error: any) {
      console.error("❌ Error starting recording:", error);

      // Cleanup on error
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setError(
          "Screen capture was denied. Please allow screen sharing to record the interview."
        );
      } else if (
        error.name === "NotFoundError" ||
        error.name === "NotReadableError"
      ) {
        setError(
          "Could not access screen. Please ensure no other application is using your screen."
        );
      } else {
        setError(`Failed to start recording: ${error.message}`);
      }
    }
  };

  const stopRecording = () => {
    // Immediately stop screen capture to remove the red indicator
    if (screenStreamRef.current) {
      console.log("🛑 Stopping screen capture immediately...");
      screenStreamRef.current.getTracks().forEach((track) => {
        if (track.readyState === "live") {
          track.stop();
          console.log(`✅ Stopped track: ${track.kind} (${track.label})`);
        }
      });
      // Don't set to null yet - let MediaRecorder finish first
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      const state = mediaRecorderRef.current.state;
      const chunksCount = recordedChunksRef.current.length;
      const totalSize = recordedChunksRef.current.reduce(
        (sum, chunk) => sum + chunk.size,
        0
      );

      console.log(
        `⏹️ Stopping MediaRecorder... State: ${state}, Chunks: ${chunksCount}, Size: ${(
          totalSize / 1024
        ).toFixed(2)} KB`
      );

      // Request final data before stopping
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.requestData();
      }

      // Small delay to ensure final data is captured
      setTimeout(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);

        // Clean up screen stream reference after MediaRecorder stops
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => {
            if (track.readyState === "live") {
              track.stop();
            }
          });
          screenStreamRef.current = null;
        }
      }, 200);
    } else {
      // If MediaRecorder is not active, just clean up
      setIsRecording(false);
      if (screenStreamRef.current) {
        screenStreamRef.current = null;
      }
    }
  };

  const uploadRecording = async () => {
    if (recordedChunksRef.current.length === 0) {
      console.error("❌ No recording data to upload");
      setError("No recording data available. Please record again.");
      setIsUploadingRecording(false);
      return;
    }

    try {
      setIsUploadingRecording(true);

      // Calculate total size
      const totalSize = recordedChunksRef.current.reduce(
        (sum, chunk) => sum + chunk.size,
        0
      );

      console.log(
        `📦 Preparing upload: ${recordedChunksRef.current.length} chunks, ${(
          totalSize /
          1024 /
          1024
        ).toFixed(2)} MB`
      );

      if (totalSize < 100 * 1024) {
        throw new Error(
          "Recording file is too small. Please ensure video and audio are enabled and try recording again."
        );
      }

      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });

      // Verify blob size matches
      if (blob.size !== totalSize) {
        console.warn(
          `⚠️ Blob size mismatch: blob=${blob.size}, calculated=${totalSize}`
        );
      }

      console.log(
        `📤 Uploading recording: ${(blob.size / 1024 / 1024).toFixed(2)} MB (${
          blob.size
        } bytes)`
      );

      // Step 1: Get presigned upload URL from backend
      console.log("🔑 Getting presigned upload URL...");
      const { uploadUrl, s3Key } = await interviewApi.getRecordingUploadUrl(
        interviewId
      );
      console.log(`✅ Got upload URL for key: ${s3Key}`);

      // Step 2: Upload directly to S3 using presigned URL
      console.log("☁️ Uploading to S3...");
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": "video/webm",
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(
          `S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`
        );
      }

      console.log("✅ Recording uploaded to S3 successfully");

      // Step 3: Notify backend to save the S3 key
      console.log("💾 Saving S3 key to database...");
      const saveResult = await interviewApi.saveRecordingKey(
        interviewId,
        s3Key
      );
      console.log("✅ Recording key saved:", saveResult);

      // Clear recorded chunks
      recordedChunksRef.current = [];
    } catch (error: any) {
      console.error("❌ Error uploading recording:", error);
      setError(`Failed to upload recording: ${error.message}`);
    } finally {
      setIsUploadingRecording(false);
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
                      : isAISpeaking
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
              ) : null}
              {isInterviewActive && (
                <div className="flex items-center justify-center min-h-[200px] px-4">
                  {isAISpeaking && lastAIMessage ? (
                    // AI is actively speaking - show last complete message
                    <div className="p-6 rounded-lg bg-purple-600/20 max-w-xl w-full">
                      <div className="text-xs text-purple-400 mb-2 font-semibold">
                        Speaking...
                      </div>
                      <div className="text-base leading-relaxed">
                        {lastAIMessage}
                      </div>
                    </div>
                  ) : lastAIMessage ? (
                    // Show last AI message when not speaking
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
                      key={`transcript-${index}-${
                        item.role
                      }-${item.content.slice(0, 10)}`}
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
                  )                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4 mt-6">
          <div className="flex items-center justify-center gap-4">
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
            <div className="relative group">
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isUploadingRecording || !mediaStreamRef.current}
                className={`rounded-full w-16 h-16 ${
                  isRecording ? "animate-pulse" : ""
                }`}
              >
                {isUploadingRecording ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isRecording ? (
                  <Square className="w-6 h-6" />
                ) : (
                  <Circle className="w-6 h-6 fill-red-500 text-red-500" />
                )}
              </Button>
              {!isRecording && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  <div className="font-semibold mb-1">💡 Screen Share Tip:</div>
                  <div>If current tab isn't listed,</div>
                  <div>select "Window" or "Entire screen"</div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              )}
            </div>
          </div>
          {!isRecording && (
            <div className="text-xs text-gray-400 text-center max-w-md space-y-2">
              <p>
                💡 <strong>Tip:</strong> The current tab should appear in the
                picker
              </p>
              <p>
                ✅ Select the <strong>"Interview Trix"</strong> tab
              </p>
              <p>
                🔊 Enable <strong>"Also share tab audio"</strong> to capture AI
                voice
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
