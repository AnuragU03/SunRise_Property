'use client'

import { useEffect, useState } from 'react'
import type { LeadsView } from '@/components/leads/LeadsViewToggle'

const STORAGE_KEY = 'gharsoch.leads.view'
const DEFAULT: LeadsView = 'table'

export function useLeadsViewPreference(): [LeadsView, (v: LeadsView) => void] {
  const [view, setViewState] = useState<LeadsView>(DEFAULT)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'table' || stored === 'grid' || stored === 'kanban') {
        setViewState(stored)
      }
    } catch {
      // localStorage unavailable (SSR or privacy mode) — keep default
    }
  }, [])

  function setView(v: LeadsView) {
    setViewState(v)
    try { localStorage.setItem(STORAGE_KEY, v) } catch {}
  }

  return [view, setView]
}
