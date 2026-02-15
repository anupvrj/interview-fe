"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { researchApi } from "@/lib/researchApi";
import { Loader2, Bot, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

// Default template for a new agent spec
const DEFAULT_SPEC = {
    id: "new_agent_v1",
    name: "New Agent",
    version: "1.0.0",
    description: "Describe your agent behavior here",
    stateSchema: {
        messages: "ChatMessage[]",
        // query: "string", // Example for tool
        // results: "any"
    },
    entryPoint: "start",
    steps: [
        {
            id: "start",
            type: "llm",
            promptId: "default",
            outputKey: "response",
            modelConfig: {
                model: "gpt-3.5-turbo",
                temperature: 0.7
            }
        },
        /* Example Tool Step:
        {
            id: "search_step",
            type: "tool",
            toolName: "search",
            inputMap: { "query": "response" }, // Map LLM response to tool input
            outputKey: "search_results"
        }
        */
    ],
    edges: []
};

// ... imports

import { Label } from "@/components/ui/label";
import { Plus, Code as CodeIcon, Layers } from "lucide-react";
import { StepEditor } from "@/components/research/AgentBuilder/StepEditor";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentGraph } from "@/components/research/AgentBuilder/AgentGraph";
import { TestRunner } from "@/components/research/AgentBuilder/TestRunner";

// ... DEFAULT_SPEC ...

export default function NewAgentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCodeView, setIsCodeView] = useState(false);
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        version: "v1",
        description: "",
        environment: "development",
        spec: JSON.stringify(DEFAULT_SPEC, null, 2)
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Helper to safely get parsed spec or null
    const getParsedSpec = () => {
        try {
            return JSON.parse(formData.spec);
        } catch (e) {
            return null;
        }
    };

    // Helper to auto-generate edges for simple linear flow
    const updateEdges = (steps: any[]) => {
        const edges = [];
        for (let i = 0; i < steps.length - 1; i++) {
            edges.push({
                from: steps[i].id,
                to: steps[i + 1].id
            });
        }
        return edges;
    };

    const handleStepChange = (index: number, updatedStep: any) => {
        const currentSpec = getParsedSpec();
        if (!currentSpec) return;

        const newSteps = [...currentSpec.steps];
        newSteps[index] = updatedStep;

        const newEdges = updateEdges(newSteps);

        const newSpec = { ...currentSpec, steps: newSteps, edges: newEdges };
        setFormData(prev => ({ ...prev, spec: JSON.stringify(newSpec, null, 2) }));
    };

    const handleDeleteStep = (index: number) => {
        const currentSpec = getParsedSpec();
        if (!currentSpec) return;

        const newSteps = currentSpec.steps.filter((_: any, i: number) => i !== index);
        const newEdges = updateEdges(newSteps);

        const newSpec = { ...currentSpec, steps: newSteps, edges: newEdges };
        setFormData(prev => ({ ...prev, spec: JSON.stringify(newSpec, null, 2) }));
    };

    const handleAddStep = () => {
        const currentSpec = getParsedSpec();
        if (!currentSpec) return;

        const newStep = {
            id: `step_${currentSpec.steps.length + 1}`,
            type: "llm",
            promptId: "default",
            outputKey: "response"
        };

        const newSteps = [...currentSpec.steps, newStep];
        const newEdges = updateEdges(newSteps);

        const newSpec = { ...currentSpec, steps: newSteps, edges: newEdges };
        setFormData(prev => ({ ...prev, spec: JSON.stringify(newSpec, null, 2) }));
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            setError("Name is required");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            let parsedSpec;
            try {
                parsedSpec = JSON.parse(formData.spec);
            } catch (e) {
                setError("Invalid JSON Spec");
                setLoading(false);
                return;
            }

            await researchApi.createAgent({
                ...formData,
                spec: parsedSpec
            });

            router.push("/research");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to create agent");
        } finally {
            setLoading(false);
        }
    };

    const parsedSpec = getParsedSpec();
    const isSpecValid = !!parsedSpec;

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
                        <h1 className="text-2xl font-bold tracking-tight">Create Agent</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Agent
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal">

                    {/* Left: Configuration Form */}
                    <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="border-r bg-slate-50 p-4 overflow-y-auto">
                        <div className="space-y-6">
                            <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Settings</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Name</label>
                                    <Input name="name" value={formData.name} onChange={handleChange} />
                                </div>
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
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Textarea name="description" value={formData.description} onChange={handleChange} className="h-24 resize-none" />
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Middle: Builder (List / Graph / Code) */}
                    <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col">
                        <Tabs defaultValue="visual" className="flex-1 flex flex-col w-full h-full">
                            <div className="border-b px-4 py-2 flex items-center justify-between bg-white">
                                <TabsList>
                                    <TabsTrigger value="visual">Visual Builder</TabsTrigger>
                                    <TabsTrigger value="code">Code (JSON)</TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-hidden bg-slate-100/50 relative">
                                <TabsContent value="visual" className="h-full m-0 data-[state=active]:block flex-1">
                                    {isSpecValid ? (
                                        <ResizablePanelGroup direction="horizontal">
                                            {/* Left: Graph */}
                                            <ResizablePanel defaultSize={60} minSize={30} className="border-r">
                                                <div className="h-full w-full bg-white">
                                                    <AgentGraph
                                                        spec={parsedSpec}
                                                        onAddStep={handleAddStep}
                                                        onNodeClick={(id) => {
                                                            setSelectedStepId(id);
                                                            // Optional: Scroll to step in list
                                                            const element = document.getElementById(`step-editor-${id}`);
                                                            if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                        }}
                                                    />
                                                </div>
                                            </ResizablePanel>

                                            <ResizableHandle withHandle />

                                            {/* Right: Steps List */}
                                            <ResizablePanel defaultSize={40} minSize={30} className="bg-slate-50">
                                                <div className="h-full overflow-y-auto p-6 scroll-smooth">
                                                    <div className="space-y-6 max-w-2xl mx-auto pb-20">
                                                        {parsedSpec.steps.map((step: any, index: number) => (
                                                            <div
                                                                key={index}
                                                                id={`step-editor-${step.id}`}
                                                                className={`transition-all duration-200 ${selectedStepId === step.id ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''}`}
                                                            >
                                                                <StepEditor
                                                                    step={step}
                                                                    index={index}
                                                                    onChange={(updated) => handleStepChange(index, updated)}
                                                                    onDelete={() => handleDeleteStep(index)}
                                                                />
                                                            </div>
                                                        ))}
                                                        <Button
                                                            variant="outline"
                                                            className="w-full border-dashed border-2 py-8 bg-white"
                                                            onClick={handleAddStep}
                                                        >
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Add Step
                                                        </Button>
                                                    </div>
                                                </div>
                                            </ResizablePanel>
                                        </ResizablePanelGroup>
                                    ) : (
                                        <div className="p-10 text-center">Fix JSON errors to view builder</div>
                                    )}
                                </TabsContent>

                                <TabsContent value="code" className="h-full m-0 data-[state=active]:block">
                                    <Textarea
                                        name="spec"
                                        className="font-mono text-xs h-full w-full border-0 rounded-none p-4 resize-none focus-visible:ring-0"
                                        value={formData.spec}
                                        onChange={handleChange}
                                        spellCheck={false}
                                    />
                                </TabsContent>
                            </div>
                        </Tabs>
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Right: Test Runner */}
                    <ResizablePanel defaultSize={30} minSize={20} className="border-l bg-white p-4">
                        <TestRunner spec={parsedSpec} />
                    </ResizablePanel>

                </ResizablePanelGroup>
            </div>
        </div>
    );
}
