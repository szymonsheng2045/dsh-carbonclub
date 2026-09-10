const NAME_KEY = 'dsh-carbon-club.local-name.v1'
export const MAX_NAME_LENGTH = 48

export function normalizeName(value: string): string {
  const name = value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_NAME_LENGTH)
  // Keep the protocol's UTF-16 length bound without cutting an emoji in half.
  return name.replace(/[\uD800-\uDBFF]$/, '')
}

export function defaultName(peerId?: string): string {
  return `Carbon-${peerId?.slice(-6) ?? 'guest'}`
}

export function loadName(): string {
  try { return normalizeName(window.localStorage.getItem(NAME_KEY) ?? '') } catch { return '' }
}

export function saveName(value: string): void {
  try { window.localStorage.setItem(NAME_KEY, normalizeName(value)) } catch { /* Works in memory when storage is blocked. */ }
}
