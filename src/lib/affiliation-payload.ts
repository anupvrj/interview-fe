export type AffiliationValue = {
  affiliationInstitutionId: string | null;
  affiliationInstitutionName: string;
};

/** Keys omitted when nothing set (backend keeps existing onboarding fields). */
export function toOnboardingAffiliationPayload(aff: AffiliationValue) {
  const name = aff.affiliationInstitutionName.trim();
  if (aff.affiliationInstitutionId) {
    return {
      affiliationInstitutionId: aff.affiliationInstitutionId,
      affiliationInstitutionName: name || null,
    };
  }
  if (name) {
    return {
      affiliationInstitutionId: null as string | null,
      affiliationInstitutionName: name,
    };
  }
  return {};
}

/** Always sends keys so clearing both fields persists. */
export function toProfileAffiliationPayload(aff: AffiliationValue): {
  affiliationInstitutionId: string | null;
  affiliationInstitutionName: string | null;
} {
  const name = aff.affiliationInstitutionName.trim();
  if (aff.affiliationInstitutionId) {
    return {
      affiliationInstitutionId: aff.affiliationInstitutionId,
      affiliationInstitutionName: name || null,
    };
  }
  if (name) {
    return {
      affiliationInstitutionId: null,
      affiliationInstitutionName: name,
    };
  }
  return {
    affiliationInstitutionId: null,
    affiliationInstitutionName: null,
  };
}

export function affiliationFromUser(user: {
  affiliationInstitutionId?: string | null;
  affiliationInstitutionName?: string;
}): AffiliationValue {
  return {
    affiliationInstitutionId: user.affiliationInstitutionId ?? null,
    affiliationInstitutionName: user.affiliationInstitutionName ?? "",
  };
}
