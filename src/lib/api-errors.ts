/** Message from axios-style API error responses. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message ?? fallback;
}

export function isConflictError(err: unknown): boolean {
  return (err as { response?: { status?: number } })?.response?.status === 409;
}
