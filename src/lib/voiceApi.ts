import { apiClient } from "@/lib/api";
import type { VoiceProviderOption } from "@/lib/voiceProviders";

export const voiceApi = {
  listProviders: async (): Promise<{
    providers: VoiceProviderOption[];
    defaultProvider: string;
  }> => {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        providers: VoiceProviderOption[];
        defaultProvider: string;
      };
    }>("/voice/providers");
    return response.data.data;
  },
};
