/** Enter used to commit an IME candidate must never submit the draft. */
export function shouldSubmit(event: { readonly key: string; readonly shiftKey: boolean; readonly isComposing: boolean; readonly keyCode: number }): boolean {
  return event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229
}

/** Preserve text the user entered while the previous message was in flight. */
export function draftAfterSend(current: string, submitted: string): string {
  return current === submitted ? '' : current
}
