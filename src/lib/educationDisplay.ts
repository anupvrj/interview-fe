/** Field abbreviations that already mean "Computer Science" on a degree line. */
const CS_FIELD_RE =
  /^(cse|cs|c\.s\.e?\.?|computer science(?:\s*(?:and|&)\s*engineering)?)$/i;
const CS_IN_DEGREE_RE = /computer\s+science|\bcse\b/;

export type EducationDegreeField = {
  degree?: string;
  field?: string;
};

/**
 * Move a leftover `field` (e.g. CSE) into `degree` so the Degree input
 * matches the preview and can be edited. Clears `field` after merging.
 */
export function flattenEducationFieldIntoDegree<T extends EducationDegreeField>(
  edu: T,
): T {
  const degree = (edu.degree || "").trim();
  const field = (edu.field || "").trim();
  if (!field) return { ...edu, field: "" };

  if (degree.toLowerCase().includes(field.toLowerCase())) {
    return { ...edu, degree, field: "" };
  }

  return {
    ...edu,
    degree: degree ? `${degree} in ${field}` : field,
    field: "",
  };
}

export function flattenEducationList<T extends EducationDegreeField>(
  education: T[] | undefined,
): { education: T[]; changed: boolean } {
  const list = Array.isArray(education) ? education : [];
  let changed = false;
  const next = list.map((edu) => {
    const flat = flattenEducationFieldIntoDegree(edu);
    if (
      (edu.degree || "").trim() !== (flat.degree || "") ||
      (edu.field || "").trim() !== (flat.field || "")
    ) {
      changed = true;
    }
    return flat;
  });
  return { education: next, changed };
}

/**
 * Whether the preview should add "in {field}" after the degree.
 * Degree already containing a major (or CS when field is CSE/CS) must not
 * get a second hardcoded suffix like "in Computer Science in CSE".
 */
export function shouldAppendEducationField(
  degree?: string,
  field?: string,
): boolean {
  const trimmedField = field?.trim();
  if (!trimmedField) return false;

  const trimmedDegree = (degree || "").trim();
  if (!trimmedDegree) return true;

  const degreeNorm = trimmedDegree.toLowerCase();
  const fieldNorm = trimmedField.toLowerCase();

  if (degreeNorm.includes(fieldNorm)) return false;
  if (/\bin\s+\S/i.test(trimmedDegree)) return false;
  if (CS_FIELD_RE.test(trimmedField) && CS_IN_DEGREE_RE.test(degreeNorm)) {
    return false;
  }

  return true;
}
