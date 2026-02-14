"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { researchApi, ResearchPrompt } from "@/lib/researchApi";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Code, Loader2, AlertCircle } from "lucide-react";

export default function ResearchDashboard() {
    const [prompts, setPrompts] = useState<ResearchPrompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPrompts();
    }, []);

    const fetchPrompts = async () => {
        try {
            setLoading(true);
            const data = await researchApi.listPrompts();
            setPrompts(data);
            setError(null);
        } catch (err: any) {
            console.error("Failed to fetch prompts:", err);
            setError("Failed to load prompts. Is the Research Lab (Python) service running?");
        } finally {
            setLoading(false);
        }
    };

    const getEnvironmentColor = (env: string) => {
        switch (env) {
            case "production":
                return "default"; // Primary color
            case "staging":
                return "secondary";
            case "development":
                return "outline";
            case "experiment":
                return "secondary"; // Or maybe a different variant if available
            default:
                return "outline";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Research Lab</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage prompts, run experiments, and test agents in real-time.
                    </p>
                </div>
                <Link href="/research/prompts/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Prompt
                    </Button>
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error}</p>
                    <Button variant="outline" size="sm" onClick={fetchPrompts} className="ml-auto bg-white hover:bg-red-50">
                        Retry
                    </Button>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {prompts.map((prompt) => (
                        <Card key={prompt._id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant={getEnvironmentColor(prompt.environment) as any}>
                                        {prompt.environment}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground font-mono">
                                        v{prompt.version}
                                    </span>
                                </div>
                                <CardTitle className="text-xl">{prompt.name}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {prompt.description || "No description provided"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {prompt.tags?.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Updated: {new Date(prompt.updatedAt).toLocaleDateString()}
                                </p>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <Link href={`/research/playground?promptId=${prompt._id}`} className="flex-1">
                                    <Button className="w-full">
                                        <Play className="mr-2 h-4 w-4" />
                                        Playground
                                    </Button>
                                </Link>
                                <Link href={`/research/prompts/${prompt._id}`}>
                                    <Button variant="outline" size="icon">
                                        <Code className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}

                    {prompts.length === 0 && !error && (
                        <div className="col-span-full text-center py-12 bg-slate-50 rounded-lg border border-dashed">
                            <p className="text-muted-foreground mb-4">No prompts found in the Research Lab.</p>
                            <Link href="/research/prompts/new">
                                <Button variant="outline">Create your first prompt</Button>
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
