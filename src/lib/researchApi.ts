import { apiClient } from "./api";

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
    }
};
