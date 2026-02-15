import { apiClient } from "./api";

export interface ResearchAgentInfo {
    id: string;
    name: string;
    description: string;
    type: string;
}

export interface ResearchPrompt {
    _id: string;
    name: string;
    version: string;
    content: string;
    inputVariables: string[];
    tags: string[];
    description?: string;
    modelConfig?: Record<string, any>;
    environment: string; // 'production', 'development', etc.
    createdAt: string;
    updatedAt: string;
}

export const researchApi = {
    // Get all agents
    listAgents: async (): Promise<ResearchAgentInfo[]> => {
        // We use the proxy route which forwards to python /agents
        const response = await apiClient.get<ResearchAgentInfo[]>("/internal/research/agents");
        return response.data;
    },

    // Create a new agent
    createAgent: async (agent: any): Promise<any> => {
        const response = await apiClient.post("/internal/research/agents", agent);
        return response.data;
    },

    deleteAgent: async (id: string): Promise<any> => {
        const response = await apiClient.delete(`/internal/research/agents/${id}`);
        return response.data;
    },

    deletePrompt: async (id: string): Promise<any> => {
        const response = await apiClient.delete(`/internal/research/prompts/${id}`);
        return response.data;
    },

    // Get all prompts
    listPrompts: async (): Promise<ResearchPrompt[]> => {
        // We need an endpoint in python to list prompts.
        // Currently server.py only has /invoke-agent and /health.
        // We should probably add /prompts to server.py later.
        // For now, let's assume we will add it.
        const response = await apiClient.get<ResearchPrompt[]>("/internal/research/prompts");
        return response.data;
    },

    // Get a specific prompt
    getPrompt: async (name: string, version?: string): Promise<ResearchPrompt> => {
        const params = new URLSearchParams();
        if (version) params.append("version", version);
        const response = await apiClient.get<ResearchPrompt>(`/internal/research/prompts/${name}?${params.toString()}`);
        return response.data;
    },

    // Invoke an agent
    invokeAgent: async (agentId: string, input: any, promptConfig?: any) => {
        const response = await apiClient.post("/internal/research/invoke-agent", {
            agent_id: agentId,
            input,
            prompt_config: promptConfig
        });
        return response.data;
    },

    // Save/Update a prompt
    savePrompt: async (prompt: Partial<ResearchPrompt>): Promise<any> => {
        const response = await apiClient.post("/internal/research/prompts", prompt);
        return response.data;
    },

    // Execute an AgentSpec (Production Runtime)
    executeAgent: async (spec: any, input: any): Promise<any> => {
        const response = await apiClient.post("/internal/research/execute", {
            spec,
            input
        });
        return response.data;
    },

    // Stream an Agent (Research Lab)
    streamAgent: async (agentId: string, input: string, onChunk: (chunk: any) => void) => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";
        const url = `${API_URL}/internal/research/stream-agent`;
        console.log("Streaming from:", url);

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    agent_id: agentId,
                    input: input
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }


            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split("\n\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6);
                        if (data === "[DONE]") return;
                        try {
                            onChunk(JSON.parse(data));
                        } catch (e) {
                            console.error("Error parsing SSE chunk", e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Stream Agent Error:", error);
            throw error;
        }
    }
};
