import { useEffect, useState } from 'react'
import type { Language } from './i18n.js'

const STORAGE_KEY = 'dsh-carbon-club.language.v1'
const LANGUAGE_EVENT = 'dsh-carbon-club:language'
let language: Language = 'zh'
let hydrated = false

function hydrate(): void {
  if (hydrated) return
  hydrated = true
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'zh' || saved === 'en') language = saved
  } catch {
    // Storage can be unavailable; Chinese remains the stable default.
  }
}

export function setLanguage(next: Language): void {
  if (next === language) return
  language = next
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Keep the in-memory preference when persistence is unavailable.
  }
  window.dispatchEvent(new CustomEvent<Language>(LANGUAGE_EVENT, { detail: next }))
}

export function useLanguage(): Language {
  const [value, setValue] = useState<Language>(language)
  useEffect(() => {
    hydrate()
    setValue(language)
    const update = (event: Event): void => {
      const next = (event as CustomEvent<Language>).detail
      if (next === 'zh' || next === 'en') {
        language = next
        setValue(next)
      }
    }
    window.addEventListener(LANGUAGE_EVENT, update)
    return () => { window.removeEventListener(LANGUAGE_EVENT, update) }
  }, [])
  return value
}
