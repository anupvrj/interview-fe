"use client";

import { AgentRunner } from "@/components/research/AgentRunner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AgentRunnerPage() {
    // Hardcoded for testing, or we can use a query param
    // Using the ID from our integration test or a known safe ID
    const defaultAgentId = "integration-test-agent";

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Agent Runtime Debugger</h1>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Manual Execution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-muted/20 rounded-lg mb-4 text-sm">
                            <p><strong>Note:</strong> This interface connects directly to the <code>llm-service/runtime</code> via the backend proxy.</p>
                        </div>
                        <AgentRunner
                            agentId={defaultAgentId}
                            agentName="Test Agent"
                            initialInput={JSON.stringify({ messages: [{ role: "user", content: "Hello from frontend!" }] }, null, 2)}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
