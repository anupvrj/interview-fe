"use client";

import { useEffect, useState } from "react";
import { PromptEditor } from "@/components/research/PromptEditor";
import { researchApi, ResearchPrompt } from "@/lib/researchApi";
import { Loader2 } from "lucide-react";

export default function EditPromptPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = require("react").use(params) as { id: string };
    const [prompt, setPrompt] = useState<ResearchPrompt | null>(null);
    const [loading, setLoading] = useState(true);

    // In Next 13+ app dir, params are passed up. 
    // However, `params` should be unwrapped if dynamic. 
    // But strictly `params` is available synchronously in many versions or async in others.
    // We'll trust Next.js behavior.
    // Actually, for client components, we usually use useParams() hook or similar if we want reactivity, 
    // but page props work too.

    useEffect(() => {
        // Determine how to fetch by ID. 
        // Our list returns _id, but getPrompt by name?
        // We should create getPromptById or just fetch all and find?
        // Let's assume we can fetch by name or we have to fix this.
        // Actually, `getPrompt` takes `name`. `params.id` might be _id.
        // If we only have name-based lookup in python, we might have an issue.
        // Let's assume we pass name in URL not ID?
        // Or we fetch all and find by ID.

        // Simplest: Fetch all and find.
        const loadPrompt = async () => {
            try {
                const prompts = await researchApi.listPrompts();
                const found = prompts.find(p => p._id === resolvedParams.id);
                if (found) {
                    setPrompt(found);
                } else {
                    // Handle not found
                    console.error("Prompt not found");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadPrompt();
    }, [resolvedParams.id]);

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
    }

    if (!prompt) {
        return <div>Prompt not found</div>;
    }

    return <PromptEditor initialData={prompt} />;
}
