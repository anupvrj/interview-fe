"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Play } from "lucide-react";
import { researchApi } from "@/lib/researchApi";

interface TestRunnerProps {
    spec: any;
}

export function TestRunner({ spec }: TestRunnerProps) {
    const [input, setInput] = useState('{\n  "query": "test"\n}');
    const [output, setOutput] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRun = async () => {
        try {
            setLoading(true);
            setError(null);
            setOutput(null);

            let parsedInput;
            try {
                parsedInput = JSON.parse(input);
            } catch (e) {
                setError("Invalid JSON Input");
                return;
            }

            // Call Runtime
            const result = await researchApi.executeAgent(spec, parsedInput);
            setOutput(result);

        } catch (err: any) {
            console.error("Execution failed", err);
            setError(err.message || "Execution failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-sm font-medium">Test Runner</CardTitle>
            </CardHeader>
            <CardContent className="px-0 flex-1 flex flex-col space-y-4 overflow-hidden">
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Input (JSON)</label>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="font-mono text-xs h-24"
                    />
                </div>

                <Button
                    size="sm"
                    onClick={handleRun}
                    disabled={loading}
                    className="w-full"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    Run Spec
                </Button>

                <div className="flex-1 flex flex-col min-h-0 space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Output</label>
                    <div className="flex-1 rounded-md border bg-slate-950 text-slate-50 p-3 font-mono text-xs overflow-auto">
                        {error ? (
                            <span className="text-red-400">{error}</span>
                        ) : output ? (
                            <pre>{JSON.stringify(output, null, 2)}</pre>
                        ) : (
                            <span className="text-slate-500 italic">No output yet...</span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
