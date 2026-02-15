"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { PromptSelector } from "./PromptSelector";
import { ToolSelector } from "./ToolSelector";

interface StepEditorProps {
    step: any;
    index: number;
    onChange: (updatedStep: any) => void;
    onDelete: () => void;
}

export function StepEditor({ step, index, onChange, onDelete }: StepEditorProps) {

    const handleChange = (field: string, value: any) => {
        const updated = { ...step, [field]: value };

        // Clean up fields when switching types
        if (field === 'type') {
            if (value === 'llm') {
                delete updated.toolName;
                delete updated.inputMap;
                updated.promptId = "default";
                updated.modelConfig = { model: "gpt-3.5-turbo" };
            } else if (value === 'tool') {
                delete updated.promptId;
                delete updated.modelConfig;
                updated.toolName = "";
                updated.inputMap = {};
            }
        }

        onChange(updated);
    };

    return (
        <Card className="relative group">
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onDelete}
            >
                <Trash2 className="h-4 w-4" />
            </Button>

            <CardHeader className="py-3 px-4 bg-slate-50 border-b">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span className="bg-slate-200 text-slate-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        {index + 1}
                    </span>
                    {step.id}
                    <span className="text-xs font-normal text-muted-foreground ml-auto pr-8">
                        Type: {step.type}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Step ID</Label>
                        <Input
                            value={step.id}
                            onChange={(e) => handleChange("id", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={step.type} onValueChange={(val) => handleChange("type", val)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="llm">LLM (Chat)</SelectItem>
                                <SelectItem value="tool">Tool (Action)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {step.type === 'llm' && (
                    <div className="space-y-4 pt-2 border-t">
                        <div className="space-y-2">
                            <Label>Prompt</Label>
                            <PromptSelector
                                value={step.promptId || "default"}
                                onChange={(val) => handleChange("promptId", val)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Output Key (State Variable)</Label>
                            <Input
                                value={step.outputKey}
                                onChange={(e) => handleChange("outputKey", e.target.value)}
                                placeholder="e.g. response"
                            />
                        </div>
                    </div>
                )}

                {step.type === 'tool' && (
                    <div className="space-y-4 pt-2 border-t">
                        <div className="space-y-2">
                            <Label>Tool</Label>
                            <ToolSelector
                                value={step.toolName || ""}
                                onChange={(val) => handleChange("toolName", val)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Input Map (JSON)</Label>
                            <Input
                                value={JSON.stringify(step.inputMap || {})}
                                onChange={(e) => {
                                    try {
                                        const parsed = JSON.parse(e.target.value);
                                        handleChange("inputMap", parsed);
                                    } catch (err) {
                                        // Allow editing invalid JSON, handle validation on save if needed
                                        // For now, simple text input might be better for key-value pairs
                                        // Or we can just store string and parse later
                                    }
                                }}
                                placeholder='{ "arg": "state_key" }'
                                className="font-mono text-xs"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Map tool arguments to state keys. E.g. <code>{`{ "query": "user_message" }`}</code>
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Output Key (State Variable)</Label>
                            <Input
                                value={step.outputKey}
                                onChange={(e) => handleChange("outputKey", e.target.value)}
                                placeholder="e.g. search_results"
                            />
                        </div>
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
