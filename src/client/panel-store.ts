import { useSyncExternalStore } from 'react'

export interface PanelSnapshot {
  readonly open: boolean
  readonly width: number
}

const listeners = new Set<() => void>()
let snapshot: PanelSnapshot = { open: false, width: 392 }

function emit(): void {
  for (const listener of listeners) listener()
}

function update(next: PanelSnapshot): void {
  if (next.open === snapshot.open && next.width === snapshot.width) return
  snapshot = next
  emit()
}

export function setPanelOpen(open: boolean): void {
  update({ ...snapshot, open })
}

export function togglePanel(): void {
  setPanelOpen(!snapshot.open)
}

export function setPanelWidth(width: number): void {
  update({ ...snapshot, width: Math.min(520, Math.max(300, Math.round(width))) })
}

export function usePanelSnapshot(): PanelSnapshot {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    () => snapshot,
    () => snapshot,
  )
}

/**
 * Whether the session-header entry is on screen. The header only exists while a
 * conversation is rendered, and `useSessions().current` is already defined on the
 * new-session landing screen (DSH 0.1.5), so the overlay cannot infer the entry
 * point from session state — it fell back to nothing at all there. The overlay now
 * renders the floating pill whenever the header action is not mounted; the two live
 * in the same corner of the frame, so exactly one of them is ever on screen.
 */
let headerEntryMounted = false
const entryListeners = new Set<() => void>()

export function setHeaderEntryMounted(mounted: boolean): void {
  if (mounted === headerEntryMounted) return
  headerEntryMounted = mounted
  for (const listener of entryListeners) listener()
}

export function useHeaderEntryMounted(): boolean {
  return useSyncExternalStore(
    listener => {
      entryListeners.add(listener)
      return () => { entryListeners.delete(listener) }
    },
    () => headerEntryMounted,
    () => headerEntryMounted,
  )
}
