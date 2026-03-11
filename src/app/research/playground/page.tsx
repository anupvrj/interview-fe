"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { researchApi } from "@/lib/researchApi";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
    role: "user" | "assistant" | "system";
    content: string;
}

import { AgentTrace, TraceStep } from "@/components/research/AgentTrace";

export default function PlaygroundPage() {
    const searchParams = useSearchParams();
    const promptId = searchParams?.get("promptId") || "default";
    const agentId = searchParams?.get("agentId") || "mock-agent";

    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [provider, setProvider] = useState<"openai" | "gemini">("gemini");

    // Trace State
    const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
    const [isDeepResearch, setIsDeepResearch] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        console.log("Sending...", { input, agentId });

        const userMsg: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            if (agentId === "deep-researcher") {
                // Use Streaming Flow for Deep Researcher
                setIsDeepResearch(true);
                setTraceSteps([]);

                await researchApi.streamAgent("deep-researcher", userMsg.content, (chunk) => {
                    const { type, node, output, msg } = chunk;

                    if (type === "start") {
                        // Workflow started
                    } else if (type === "node_start") {
                        setTraceSteps(prev => [...prev, {
                            id: Date.now().toString(),
                            label: `Running ${node}...`,
                            status: "running"
                        }]);
                    } else if (type === "node_end") {
                        setTraceSteps(prev => {
                            const newSteps = [...prev];
                            const lastStep = newSteps[newSteps.length - 1];
                            if (lastStep && lastStep.status === "running") {
                                lastStep.status = "completed";
                                lastStep.output = typeof output === "object" ? JSON.stringify(output) : output;
                                if (output && output.plan) lastStep.output = output.plan;
                                if (output && output.draft) lastStep.output = output.draft;
                                if (output && output.critique) lastStep.output = output.critique;
                            }
                            return newSteps;
                        });
                    } else if (type === "end") {
                        let finalContent = "Workflow Completed.";
                        if (typeof output === "object" && output !== null) {
                            if (output.reviser?.draft) {
                                finalContent = `**Final Draft**\n\n${output.reviser.draft}\n\n---\n*Revision cycles: ${output.reviser.revision_count}*`;
                            } else if (output.draft) {
                                finalContent = `**Draft**\n\n${output.draft}`;
                            } else if (output.plan) {
                                finalContent = `**Plan**\n\n${output.plan}`;
                            } else {
                                finalContent = JSON.stringify(output, null, 2);
                            }
                        } else if (output) {
                            finalContent = output;
                        }

                        const assistantMsg: Message = {
                            role: "assistant",
                            content: finalContent
                        };
                        setMessages((prev) => [...prev, assistantMsg]);
                    }
                }, provider);
            } else {
                // Use Standard Invoke Flow
                const result = await researchApi.invokeAgent(agentId, input, {
                    prompt_id: promptId
                }, provider);

                const assistantMsg: Message = {
                    role: "assistant",
                    content: result.output || "No response"
                };
                setMessages((prev) => [...prev, assistantMsg]);
            }
        } catch (error) {
            console.error("Agent error:", error);
            const errorMsg: Message = {
                role: "system",
                content: "Error: Failed to get response from agent."
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setLoading(false);
            if (agentId === "deep-researcher") {
                setIsDeepResearch(false);
            }
        }
    };



    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <h1 className="text-3xl font-bold tracking-tight">Agent Playground</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                <div className="lg:col-span-2 flex flex-col min-h-0">
                    <Card className="flex flex-col flex-1 min-h-0">
                        <CardHeader className="py-4 border-b">
                            <CardTitle className="text-base flex items-center">
                                <Bot className="w-4 h-4 mr-2 text-blue-500" />
                                Chat Session
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                            {messages.length === 0 && (
                                <div className="text-center text-muted-foreground mt-10">
                                    <Bot className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>Start a conversation with the agent.</p>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : msg.role === 'system'
                                            ? 'bg-red-50 text-red-600 border border-red-200'
                                            : 'bg-slate-100 text-slate-800'
                                        }`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-100 rounded-lg px-4 py-2 flex items-center">
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        <span className="text-sm text-slate-500">Thinking...</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="p-4 border-t bg-white">
                            <div className="w-full flex gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    disabled={loading}
                                    className="flex-1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                />
                                <Button onClick={handleSend} disabled={loading || !input.trim()}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>

                <div className="flex flex-col gap-4 overflow-y-auto min-h-0">
                    {/* Trace UI takes precedence if active or has data */}
                    {(isDeepResearch || traceSteps.length > 0) ? (
                        <div className="flex-1 min-h-0">
                            <AgentTrace steps={traceSteps} isRunning={isDeepResearch} />
                        </div>
                    ) : (
                        <Card>
                            <CardHeader className="py-4 border-b">
                                <CardTitle className="text-base">Configuration</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Active Prompt</label>
                                    <div className="bg-slate-50 border rounded-md p-2 text-sm font-mono truncate">
                                        {promptId}
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <label className="text-sm font-medium mb-1.5 block">LLM Provider</label>
                                    <select
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                        value={provider}
                                        onChange={(e) => setProvider(e.target.value as any)}
                                    >
                                        <option value="openai">OpenAI (Default)</option>
                                        <option value="gemini">Google Gemini</option>
                                    </select>
                                    <p className="text-[10px] text-muted-foreground mt-1.5 italic">
                                        Affects both logic and voice generation.
                                    </p>
                                </div>

                                {agentId === "deep-researcher" && (
                                    <div className="pt-4 border-t space-y-2">
                                        <div className="bg-indigo-50 text-indigo-700 p-3 rounded-md text-xs text-center border border-indigo-100">
                                            <p className="font-medium mb-1">Deep Research Mode Active</p>
                                            <p>Just type your topic in the chat to start the workflow.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-center"
                                        onClick={async () => {
                                            // Hardcoded spec for demo
                                            const spec = {
                                                id: "research_agent_v1",
                                                entryPoint: "plan",
                                                stateSchema: { messages: "array" },
                                                steps: [
                                                    {
                                                        id: "plan",
                                                        type: "llm",
                                                        promptId: "planner_v1",
                                                        outputKey: "plan",
                                                        modelConfig: { model: "gpt-3.5-turbo" }
                                                    }
                                                ],
                                                edges: []
                                            };
                                            try {
                                                alert("Running Agent in Production Runtime...");
                                                const res = await researchApi.executeAgent(spec, { messages: [{ role: "user", content: "Hello Production" }] }, provider);
                                                alert("Result: " + JSON.stringify(res, null, 2));
                                            } catch (e: any) {
                                                alert("Error: " + e.message);
                                            }
                                        }}
                                    >
                                        <Bot className="w-4 h-4 mr-2" />
                                        Run in Production
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-2 text-center">
                                        Executes defined spec via Runtime Service
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div >
        </div >
    );
}
