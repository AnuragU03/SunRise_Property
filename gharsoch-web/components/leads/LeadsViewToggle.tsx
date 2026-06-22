'use client'

import { Button } from '@/components/ui/button'
import { LayoutGrid, List, Columns3 } from 'lucide-react'

export type LeadsView = 'table' | 'grid' | 'kanban'

type Props = {
  value: LeadsView
  onChange: (view: LeadsView) => void
}

export function LeadsViewToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
      <Button
        type="button"
        variant={value === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('table')}
        className="h-7 px-2"
      >
        <List className="h-3.5 w-3.5 mr-1" />
        Table
      </Button>
      <Button
        type="button"
        variant={value === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('grid')}
        className="h-7 px-2"
        disabled
        title="Grid view coming in next commit"
      >
        <LayoutGrid className="h-3.5 w-3.5 mr-1" />
        Grid
      </Button>
      <Button
        type="button"
        variant={value === 'kanban' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('kanban')}
        className="h-7 px-2"
      >
        <Columns3 className="h-3.5 w-3.5 mr-1" />
        Kanban
      </Button>
    </div>
  )
}
