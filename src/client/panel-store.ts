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
