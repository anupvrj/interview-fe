"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Hardcoded for now, but could be fetched from API later
const AVAILABLE_TOOLS = [
    { name: "search", description: "Simulated Web Search" },
    { name: "calculator", description: "Basic Math Operations" },
    { name: "database_lookup", description: "Query User Database" }
];

interface ToolSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function ToolSelector({ value, onChange }: ToolSelectorProps) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a tool..." />
            </SelectTrigger>
            <SelectContent>
                {AVAILABLE_TOOLS.map((tool) => (
                    <SelectItem key={tool.name} value={tool.name}>
                        <span className="font-medium">{tool.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">- {tool.description}</span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
