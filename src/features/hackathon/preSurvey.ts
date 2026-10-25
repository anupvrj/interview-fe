/**
 * Pre-sign-up quiz answers are saved as they're given, before the visitor has an account.
 * The server returns a random token; the browser keeps it here and sends it with the next
 * answer and, once signed in, to link the answers to the account. Nothing else is kept.
 * Failures never block the quiz or sign-in.
 */
import { hackathonApi } from "./api";

type TokenGetter = () => Promise<string | null>;
export type PreSurveyAnswer = { attended?: "yes" | "no"; ready?: "yes" | "nervous" };

const UTM_KEYS = ["source", "medium", "campaign", "content", "term"] as const;
const storageKey = (slug: string) => `hk-presurvey:${slug}`;

function readToken(slug: string): string | null {
  try {
    return window.localStorage.getItem(storageKey(slug));
  } catch {
    return null;
  }
}

function writeToken(slug: string, token: string | null) {
  try {
    if (token) window.localStorage.setItem(storageKey(slug), token);
    else window.localStorage.removeItem(storageKey(slug));
  } catch {
    /* private mode / blocked storage: the answer is still saved, just not linkable */
  }
}

/** utm_* from the ad link, as campaign tags (the server keeps only short plain values). */
function utmFromUrl(): Record<string, string> | undefined {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const value = params.get(`utm_${key}`)?.trim();
      if (value) utm[key] = value.slice(0, 100);
    }
    return Object.keys(utm).length ? utm : undefined;
  } catch {
    return undefined;
  }
}

export async function savePreSurveyAnswer(slug: string, getToken: TokenGetter, answer: PreSurveyAnswer): Promise<void> {
  try {
    const token = readToken(slug) ?? undefined;
    const result = await hackathonApi.preSurvey(slug, getToken, { ...answer, ...(token ? { token } : { utm: utmFromUrl() }) });
    writeToken(slug, result.linked ? null : result.token);
  } catch {
    /* not critical: analytics still records the step */
  }
}

/** After sign-in: link the answers given before, then forget the token. */
export async function claimSavedPreSurvey(slug: string, getToken: TokenGetter): Promise<void> {
  const token = readToken(slug);
  if (!token) return;
  try {
    await hackathonApi.claimPreSurvey(slug, getToken, token);
    writeToken(slug, null);
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    // A rejected token won't work later either; network errors are retried next visit.
    if (status === 400 || status === 404) writeToken(slug, null);
  }
}
