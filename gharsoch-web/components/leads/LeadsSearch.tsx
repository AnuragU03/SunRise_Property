'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

type Props = {
  value: string
  onChange: (v: string) => void
  debounceMs?: number
}

export function LeadsSearch({ value, onChange, debounceMs = 300 }: Props) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local)
    }, debounceMs)
    return () => clearTimeout(t)
  }, [local, value, onChange, debounceMs])

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder="Search by name, phone, email, city..."
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="pl-8 h-9"
      />
    </div>
  )
}
