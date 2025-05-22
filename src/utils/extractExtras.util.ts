export function extractExtras(extras?: string): Record<string, string> {
  const params = new URLSearchParams(extras || '')
  return Object.fromEntries(params.entries())
}
