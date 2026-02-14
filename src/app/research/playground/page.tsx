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

export default function PlaygroundPage() {
    const searchParams = useSearchParams();
    const promptId = searchParams?.get("promptId") || "default";

    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            // Call the Research Lab API
            const result = await researchApi.invokeAgent("mock-agent", input, {
                prompt_id: promptId
            });

            const assistantMsg: Message = {
                role: "assistant",
                content: result.output || "No response"
            };
            setMessages((prev) => [...prev, assistantMsg]);
        } catch (error) {
            console.error("Agent error:", error);
            const errorMsg: Message = {
                role: "system",
                content: "Error: Failed to get response from agent."
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setLoading(false);
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
                            <form
                                className="flex w-full gap-2"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSend();
                                }}
                            >
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    disabled={loading}
                                    className="flex-1"
                                />
                                <Button type="submit" disabled={loading || !input.trim()}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>
                </div>

                <div className="flex flex-col gap-4 overflow-y-auto">
                    <Card>
                        <CardHeader className="py-4 border-b">
                            <CardTitle className="text-base">Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Agent ID</label>
                                <Input value="mock-agent" disabled readOnly />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Active Prompt</label>
                                <div className="bg-slate-50 border rounded-md p-2 text-sm font-mono truncate">
                                    {promptId}
                                </div>
                            </div>

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
                                            const res = await researchApi.executeAgent(spec, { messages: [{ role: "user", content: "Hello Production" }] });
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
                </div>
            </div>
        </div>
    );
}
