export function reportRuntimeError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error('[NeuroTwin Error Logger]', error, context);
}
