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

export const biometricApi = {
  getMine: async (): Promise<BiometricCredential | null> => {
    const response = await apiClient.get<{
      success: boolean;
      data: BiometricCredential | null;
    }>("/users/me/biometric");
    return response.data.data;
  },

  presign: async (body: {
    purpose: "credential" | "id_card" | "snapshot";
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
