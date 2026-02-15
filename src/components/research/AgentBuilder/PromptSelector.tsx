"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { researchApi, ResearchPrompt } from "@/lib/researchApi";

interface PromptSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function PromptSelector({ value, onChange }: PromptSelectorProps) {
    const [prompts, setPrompts] = useState<ResearchPrompt[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrompts = async () => {
            try {
                const data = await researchApi.listPrompts();
                setPrompts(data);
            } catch (e) {
                console.error("Failed to load prompts", e);
            } finally {
                setLoading(false);
            }
        };
        fetchPrompts();
    }, []);

    return (
        <Select value={value} onValueChange={onChange} disabled={loading}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder={loading ? "Loading prompts..." : "Select a prompt..."} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="default">
                    <span className="font-medium">default</span>
                    <span className="ml-2 text-xs text-muted-foreground">- Built-in System Prompt</span>
                </SelectItem>
                {prompts.map((prompt) => (
                    <SelectItem key={prompt._id} value={prompt._id}>
                        <span className="font-medium">{prompt.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">v{prompt.version} ({prompt.environment})</span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
