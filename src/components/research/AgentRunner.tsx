"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { researchApi } from "@/lib/researchApi";
import { toast } from "sonner";
import { Loader2, Play, Square, Terminal } from "lucide-react";

interface AgentRunnerProps {
    agentId: string;
    agentName?: string;
    initialInput?: string;
}

interface StreamEvent {
    type: "start" | "step_start" | "token" | "step_end" | "end" | "error";
    [key: string]: any;
}

export const AgentRunner: React.FC<AgentRunnerProps> = ({
    agentId,
    agentName = "Agent",
    initialInput = "",
}) => {
    const [input, setInput] = useState(initialInput);
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<StreamEvent[]>([]);
    const [output, setOutput] = useState("");
    const [stats, setStats] = useState({ cost: 0, tokens: 0 });

    const abortControllerRef = useRef<AbortController | null>(null);

    const handleRun = async () => {
        if (!input.trim()) {
            toast.error("Please provide input");
            return;
        }

        setIsRunning(true);
        setLogs([]);
        setOutput("");
        setStats({ cost: 0, tokens: 0 });

        try {
            // Parse input as JSON if possible, otherwise string
            let parsedInput: any = input;
            try {
                parsedInput = JSON.parse(input);
            } catch (e) {
                // It's a string
            }

            await researchApi.streamAgent(agentId, parsedInput, (event) => {
                setLogs((prev) => [...prev, event]);

                switch (event.type) {
                    case "token":
                        if (event.content) {
                            setOutput((prev) => prev + event.content);
                        }
                        break;
                    case "step_end":
                        if (event.usage) {
                            setStats((prev) => ({
                                ...prev,
                                tokens: prev.tokens + (event.usage.total_tokens || 0),
                                cost: prev.cost + (event.cost || 0)
                            }));
                        }
                        break;
                    case "end":
                        if (event.cost) {
                            // Update final cost if provided
                            setStats((prev) => ({ ...prev, cost: event.cost }));
                        }
                        setIsRunning(false);
                        toast.success("Agent execution completed");
                        break;
                    case "error":
                        toast.error(`Error: ${event.error}`);
                        setIsRunning(false);
                        break;
                }
            });

        } catch (error: any) {
            toast.error(`Execution failed: ${error.message}`);
            setIsRunning(false);
        }
    };

    const handleStop = () => {
        // TODO: Implement cancellation logic in API
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsRunning(false);
        toast.info("Execution stopped (Client-side only for now)");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[600px]">
            {/* Input Section */}
            <Card className="flex flex-col h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between items-center">
                        <span>{agentName} Input</span>
                        <div className="flex gap-2">
                            {!isRunning ? (
                                <Button size="sm" onClick={handleRun} disabled={!agentId}>
                                    <Play className="w-4 h-4 mr-2" />
                                    Run
                                </Button>
                            ) : (
                                <Button size="sm" variant="destructive" onClick={handleStop}>
                                    <Square className="w-4 h-4 mr-2" />
                                    Stop
                                </Button>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-2">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter prompt or JSON input..."
                        className="flex-1 font-mono text-sm resize-none"
                        disabled={isRunning}
                    />
                </CardContent>
            </Card>

            {/* Output Section */}
            <Card className="flex flex-col h-full">
                <CardHeader className="pb-2 border-b">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg flex items-center">
                            <Terminal className="w-4 h-4 mr-2" />
                            Output
                        </CardTitle>
                        <div className="flex gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center">
                                Cost: <Badge variant="outline" className="ml-1">${stats.cost.toFixed(6)}</Badge>
                            </span>
                            <span className="flex items-center">
                                Tokens: <Badge variant="outline" className="ml-1">{stats.tokens}</Badge>
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 relative">
                    <div className="h-[500px] w-full p-4 overflow-y-auto">
                        <div className="whitespace-pre-wrap font-mono text-sm">
                            {output || (isRunning ? <span className="animate-pulse">Waiting for output...</span> : <span className="text-muted-foreground italic">No output yet.</span>)}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logs/Trace Section (Optional expansion) */}
        </div>
    );
};
