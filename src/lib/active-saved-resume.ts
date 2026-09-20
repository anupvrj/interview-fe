import { resumeApi, type Resume, type User } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export type ActiveSavedResumeDisplay = {
  title: string;
  subtitle: string;
};

export type DesignedResumeSummary = Pick<
  Resume,
  "isDefault" | "title" | "updatedAt"
> & {
  pdfS3Key?: string;
};

function hasUploadedProfileResume(profile: User | null): boolean {
  return Boolean(profile?.resume?.s3Key);
}

/** Designed resume marked default on the profile page, even if PDF is still generating. */
export function isDefaultDesignedResume(
  resume: DesignedResumeSummary | null | undefined,
): resume is DesignedResumeSummary {
  return Boolean(resume?.isDefault);
}

export function hasActiveSavedResume(
  profile: User | null,
  defaultDesignedResume: DesignedResumeSummary | null,
): boolean {
  return (
    hasUploadedProfileResume(profile) ||
    Boolean(defaultDesignedResume && isDefaultDesignedResume(defaultDesignedResume))
  );
}

export function getActiveSavedResumeDisplay(
  profile: User | null,
  defaultDesignedResume: DesignedResumeSummary | null,
): ActiveSavedResumeDisplay | null {
  if (hasUploadedProfileResume(profile) && profile?.resume) {
    return {
      title: profile.resume.filename,
      subtitle: `Uploaded PDF · ${formatDate(profile.resume.uploadedAt)}`,
    };
  }

  if (isDefaultDesignedResume(defaultDesignedResume)) {
    return {
      title: defaultDesignedResume.title?.trim() || "Designed resume",
      subtitle: `Default resume · Updated ${formatDate(defaultDesignedResume.updatedAt)}`,
    };
  }

  return null;
}

export async function loadDefaultDesignedResume(
  userId: string,
): Promise<Resume | null> {
  return resumeApi.getDefault(userId);
}
