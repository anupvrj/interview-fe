/**
 * Wait until PaginatedPreview finishes remeasuring before PDF snapshot.
 * Avoids serializing stale page bands while debounced pagination is in flight.
 */
export async function waitForResumePaginationSettled(
  previewContainerId: string,
  options?: { maxMs?: number; pollMs?: number },
): Promise<void> {
  if (typeof document === "undefined") return;

  const maxMs = options?.maxMs ?? 8000;
  const pollMs = options?.pollMs ?? 100;
  const start = Date.now();

  while (Date.now() - start < maxMs) {
    const container = document.getElementById(previewContainerId);
    if (!container) return;

    const isOptimizing = Boolean(
      container.querySelector(".animate-pulse"),
    );

    if (!isOptimizing) {
      await new Promise((resolve) => setTimeout(resolve, pollMs + 50));
      const stillOptimizing = Boolean(
        document
          .getElementById(previewContainerId)
          ?.querySelector(".animate-pulse"),
      );
      if (!stillOptimizing) return;
    }

    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
}
