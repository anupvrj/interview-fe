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
import { Plus, Play, Code, Loader2, AlertCircle, Bot, Trash2, Mic } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ResearchDashboard() {
    const [prompts, setPrompts] = useState<ResearchPrompt[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [voiceAgents, setVoiceAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Deletion State
    const [deleteItem, setDeleteItem] = useState<{ id: string, type: 'agent' | 'prompt' | 'voiceAgent', name: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [promptsData, agentsData, voiceAgentsData] = await Promise.all([
                researchApi.listPrompts(),
                researchApi.listAgents(),
                researchApi.listVoiceAgents().catch(() => []) // Catch if backend route isn't ready
            ]);
            setPrompts(promptsData);
            setAgents(agentsData);
            setVoiceAgents(voiceAgentsData);
            setError(null);
        } catch (err: any) {
            console.error("Failed to fetch data:", err);
            setError("Failed to load research data. Is the Research Lab (Python) service running?");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteItem) return;

        try {
            if (deleteItem.type === 'agent') {
                await researchApi.deleteAgent(deleteItem.id);
            } else if (deleteItem.type === 'voiceAgent') {
                await researchApi.deleteVoiceAgent(deleteItem.id);
            } else {
                await researchApi.deletePrompt(deleteItem.id);
            }
            // Refresh
            await fetchData();
            setDeleteItem(null);
        } catch (err: any) {
            alert(err.response?.data?.message || err.message || "Failed to delete");
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
                <div className="flex gap-2">
                    <Link href="/research/prompts/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Prompt
                        </Button>
                    </Link>
                    <Link href="/research/agents/new">
                        <Button variant="outline">
                            <Bot className="mr-2 h-4 w-4" />
                            New Agent
                        </Button>
                    </Link>
                    <Link href="/research/voice-agents/new">
                        <Button variant="outline">
                            <Mic className="mr-2 h-4 w-4" />
                            New Voice Agent
                        </Button>
                    </Link>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error}</p>
                    <Button variant="outline" size="sm" onClick={fetchData} className="ml-auto bg-white hover:bg-red-50">
                        Retry
                    </Button>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="space-y-10">
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Bot className="w-5 h-5" /> Available Agents
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {agents.map((agent) => (
                                <Card key={agent.id} className="flex flex-col bg-slate-50 border-indigo-100">
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                                                {agent.type}
                                            </Badge>
                                            {/* Only show delete for custom agents (assumed via ID format or type) */}
                                            {agent.type === 'custom-dsl' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-red-600"
                                                    onClick={() => setDeleteItem({ id: agent.id, type: 'agent', name: agent.name })}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {agent.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardFooter className="mt-auto pt-4">
                                        <Link href={`/research/playground?agentId=${agent.id}`} className="w-full">
                                            <Button className="w-full bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                                                <Play className="mr-2 h-4 w-4" />
                                                Chat with Agent
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Code className="w-5 h-5" /> Prompts
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {prompts.map((prompt) => (
                                <Card key={prompt._id} className="flex flex-col">
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant={getEnvironmentColor(prompt.environment) as any}>
                                                {prompt.environment}
                                            </Badge>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-muted-foreground font-mono mr-2">
                                                    v{prompt.version}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-red-600"
                                                    onClick={() => setDeleteItem({ id: prompt._id, type: 'prompt', name: prompt.name })}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
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
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Mic className="w-5 h-5" /> Voice Agents
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {voiceAgents.map((agent) => (
                                <Card key={agent._id} className="flex flex-col bg-green-50/30 border-green-100">
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant={getEnvironmentColor(agent.environment) as any}>
                                                {agent.environment}
                                            </Badge>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-muted-foreground font-mono mr-2">
                                                    v{agent.version}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-red-600"
                                                    onClick={() => setDeleteItem({ id: agent._id, type: 'voiceAgent', name: agent.name })}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                                        <CardDescription className="line-clamp-1">
                                            Voice: {agent.voice} | Temp: {agent.temperature}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardFooter className="mt-auto pt-4 flex gap-2">
                                        <Link href={`/research/voice-agents/tester?agentId=${agent._id}`} className="flex-1">
                                            <Button className="w-full bg-white text-green-700 border border-green-200 hover:bg-green-50 hover:text-green-800">
                                                <Mic className="mr-2 h-4 w-4" />
                                                Test Voice
                                            </Button>
                                        </Link>
                                        <Link href={`/research/voice-agents/${agent._id}`}>
                                            <Button variant="outline" size="icon">
                                                <Code className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            ))}

                            {voiceAgents.length === 0 && !error && (
                                <div className="col-span-full text-center py-12 bg-green-50/20 rounded-lg border border-dashed border-green-100">
                                    <p className="text-muted-foreground mb-4">No Voice Agents found.</p>
                                    <Link href="/research/voice-agents/new">
                                        <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">Create your first Voice Agent</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}

            <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the {deleteItem?.type} "{deleteItem?.name}".
                            {/* Production warning is handled by backend, but we could add visual cue here too */}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
