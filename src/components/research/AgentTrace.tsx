"use client";

import { CheckCircle2, Circle, Loader2, PlayCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface TraceStep {
    id: string;
    label: string;
    status: "pending" | "running" | "completed";
    output?: string;
}

interface AgentTraceProps {
    steps: TraceStep[];
    isRunning: boolean;
}

export function AgentTrace({ steps, isRunning }: AgentTraceProps) {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="py-3 border-b bg-slate-50">
                <CardTitle className="text-sm font-medium flex items-center">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Execution Trace
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
                <div className="divide-y">
                    {steps.map((step) => (
                        <div key={step.id} className="p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                    {step.status === "running" && (
                                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                    )}
                                    {step.status === "completed" && (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    )}
                                    {step.status === "pending" && (
                                        <Circle className="w-5 h-5 text-slate-300" />
                                    )}
                                </div>
                                <div className="space-y-1 flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${step.status === "running" ? "text-blue-600" :
                                            step.status === "completed" ? "text-slate-900" : "text-slate-500"
                                        }`}>
                                        {step.label}
                                    </p>
                                    {step.output && (
                                        <div className="text-xs text-slate-600 bg-slate-100 rounded p-2 mt-2 font-mono whitespace-pre-wrap">
                                            {step.output.length > 300
                                                ? step.output.substring(0, 300) + "..."
                                                : step.output}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {steps.length === 0 && !isRunning && (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            No trace data available. Run the agent to see execution steps.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
