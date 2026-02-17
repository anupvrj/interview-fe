"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { researchApi, ResearchPrompt } from "@/lib/researchApi";
import { Loader2, Save, ArrowLeft } from "lucide-react";

interface PromptEditorProps {
    initialData?: ResearchPrompt;
    isNew?: boolean;
}

export function PromptEditor({ initialData, isNew = false }: PromptEditorProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<ResearchPrompt>>({
        name: initialData?.name || "",
        version: initialData?.version || "1.0.0",
        description: initialData?.description || "",
        content: initialData?.content || "",
        environment: initialData?.environment || "development",
        tags: initialData?.tags || [],
        inputVariables: initialData?.inputVariables || [],
    });

    const handleChange = (field: keyof ResearchPrompt, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const tags = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
        handleChange("tags", tags);
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            // Validate required fields
            if (!formData.name || !formData.version || !formData.content) {
                alert("Please fill in Name, Version, and Content");
                return;
            }

            // Call API
            await researchApi.savePrompt(formData);

            // Use sonner toast in real app, simple alert for now
            // alert("Prompt saved successfully!");

            // Redirect to list
            router.push("/research");
            router.refresh(); // Refresh server components/cache if needed

        } catch (error: any) {
            console.error("Failed to save:", error);
            alert(`Failed to save prompt: ${error.response?.data?.detail || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">
                    {isNew ? "Create New Prompt" : `Edit Prompt: ${formData.name}`}
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Content</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>System Prompt Template</Label>
                                <Textarea
                                    className="min-h-[400px] font-mono text-sm"
                                    value={formData.content}
                                    onChange={(e) => handleChange("content", e.target.value)}
                                    placeholder="You are a helpful assistant..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    Use {'${variableName}'} for dynamic variables.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    placeholder="e.g. interviewer-persona"
                                    disabled={!isNew} // Name usually immutable after creation
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Version</Label>
                                <Input
                                    value={formData.version}
                                    onChange={(e) => handleChange("version", e.target.value)}
                                    placeholder="1.0.0"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Environment</Label>
                                <Select
                                    value={formData.environment}
                                    onValueChange={(val) => handleChange("environment", val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="development">Development</SelectItem>
                                        <SelectItem value="staging">Staging</SelectItem>
                                        <SelectItem value="production">Production</SelectItem>
                                        <SelectItem value="experiment">Experiment</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Tags (comma separated)</Label>
                                <Input
                                    value={formData.tags?.join(", ")}
                                    onChange={handleTagsChange}
                                    placeholder="interview, technical, react"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                    placeholder="Brief description of what this prompt does."
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={handleSave} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Save Prompt
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
