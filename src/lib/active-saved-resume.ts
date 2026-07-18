import { resumeApi, type Resume, type User } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export type ActiveSavedResumeDisplay = {
  title: string;
  subtitle: string;
};

export function hasActiveSavedResume(
  profile: User | null,
  defaultDesignedResume: Resume | null,
): boolean {
  return Boolean(
    profile?.resume ||
    (defaultDesignedResume?.pdfS3Key && defaultDesignedResume.isDefault),
  );
}

export function getActiveSavedResumeDisplay(
  profile: User | null,
  defaultDesignedResume: Resume | null,
): ActiveSavedResumeDisplay | null {
  if (profile?.resume) {
    return {
      title: profile.resume.filename,
      subtitle: `Uploaded PDF · ${formatDate(profile.resume.uploadedAt)}`,
    };
  }

  if (defaultDesignedResume?.pdfS3Key && defaultDesignedResume.isDefault) {
    return {
      title: defaultDesignedResume.title?.trim() || "Designed resume",
      subtitle: `Designed resume · Updated ${formatDate(defaultDesignedResume.updatedAt)}`,
    };
  }

  return null;
}

export async function loadDefaultDesignedResume(
  userId: string,
): Promise<Resume | null> {
  const resumes = await resumeApi.list(userId);
  return resumes.find((resume) => resume.isDefault && resume.pdfS3Key) ?? null;
}
