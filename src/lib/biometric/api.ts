import { apiClient } from "@/lib/api";

export type BiometricCredentialStatus =
  | "pending"
  | "in-review"
  | "approved"
  | "human_verified"
  | "failed"
  | "failed_by_admin";

export type BiometricCredential = {
  userId: string;
  institutionId?: string | null;
  videoS3Key: string;
  idCardS3Key?: string | null;
  durationMs: number;
  status: BiometricCredentialStatus;
  lambdaResult?: {
    qualityOk?: boolean;
    failReasons?: string[];
    idAssistCosine?: number;
  } | null;
  reviewNote?: string | null;
  updatedAt?: string;
  usable: boolean;
  videoUrl?: string;
  idCardUrl?: string | null;
};

const PROCESSOR_FAIL_REASONS = new Set([
  "video_unavailable",
  "processor_error",
]);

export function isBiometricProcessorFailure(
  credential: Pick<BiometricCredential, "lambdaResult"> | null | undefined,
): boolean {
  return (credential?.lambdaResult?.failReasons ?? []).some((reason) =>
    PROCESSOR_FAIL_REASONS.has(reason),
  );
}

export function biometricFailedCopy(
  credential: Pick<BiometricCredential, "lambdaResult"> | null | undefined,
): { title: string; body: string } {
  if (isBiometricProcessorFailure(credential)) {
    return {
      title: "We could not process this clip",
      body: "The file uploaded, but the quality check did not run. Try again in a minute.",
    };
  }
  return {
    title: "Clip uploaded, but it did not pass",
    body: "Record a clearer 15 second clip with one face and a clear voice.",
  };
}

export const biometricApi = {
  getMine: async (): Promise<BiometricCredential | null> => {
    const response = await apiClient.get<{
      success: boolean;
      data: BiometricCredential | null;
    }>("/users/me/biometric");
    return response.data.data;
  },

  presign: async (body: {
    purpose: "credential" | "id_card" | "snapshot" | "voice_sample";
    contentType?: string;
    sessionKind?: "interview" | "system_design";
    sessionId?: string;
  }): Promise<{ uploadUrl: string; s3Key: string }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { uploadUrl: string; s3Key: string };
    }>("/users/me/biometric/presign", body);
    return response.data.data;
  },

  confirmCredential: async (body: {
    s3Key: string;
    durationMs: number;
    idCardS3Key?: string;
  }): Promise<BiometricCredential> => {
    const response = await apiClient.post<{
      success: boolean;
      data: BiometricCredential;
    }>("/users/me/biometric/credential", body);
    return response.data.data;
  },

  registerSnapshot: async (body: {
    sessionKind: "interview" | "system_design";
    sessionId: string;
    s3Key: string;
  }): Promise<{ count: number }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { count: number };
    }>("/users/me/biometric/snapshots", body);
    return response.data.data;
  },

  registerVoiceSample: async (body: {
    sessionKind: "interview" | "system_design";
    sessionId: string;
    s3Key: string;
  }): Promise<{ count: number }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { count: number };
    }>("/users/me/biometric/voice-samples", body);
    return response.data.data;
  },

  listInstitution: async (
    institutionId: string,
  ): Promise<BiometricCredential[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: BiometricCredential[];
    }>(`/admin/institutions/${institutionId}/biometric`);
    return response.data.data;
  },

  getInstitutionCredential: async (
    institutionId: string,
    userId: string,
  ): Promise<BiometricCredential> => {
    const response = await apiClient.get<{
      success: boolean;
      data: BiometricCredential;
    }>(`/admin/institutions/${institutionId}/biometric/${userId}`);
    return response.data.data;
  },

  reviewInstitutionCredential: async (
    institutionId: string,
    userId: string,
    decision: "approve" | "reject",
    note?: string,
  ): Promise<BiometricCredential> => {
    const response = await apiClient.patch<{
      success: boolean;
      data: BiometricCredential;
    }>(`/admin/institutions/${institutionId}/biometric/${userId}`, {
      decision,
      note,
    });
    return response.data.data;
  },
};
