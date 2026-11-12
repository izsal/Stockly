'use client'

import * as React from 'react'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SearchableSelectOption = {
  value: string
  label: string
  searchText?: string
  disabled?: boolean
}

interface SearchableSelectProps {
  id?: string
  name?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  options: readonly SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  required?: boolean
  ariaLabel?: string
  className?: string
}

export function SearchableSelect({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder = 'Pilih opsi…',
  searchPlaceholder = 'Ketik untuk mencari…',
  emptyMessage = 'Tidak ada opsi yang cocok.',
  disabled = false,
  required = false,
  ariaLabel,
  className,
}: SearchableSelectProps) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '')
  const currentValue = isControlled ? value : internalValue

  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [activeIndex, setActiveIndex] = React.useState(0)

  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.value === currentValue),
    [options, currentValue],
  )

  const filteredOptions = React.useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return options
    return options.filter((opt) => {
      const haystack = `${opt.label} ${opt.searchText ?? ''}`.toLowerCase()
      return haystack.includes(trimmed)
    })
  }, [options, query])

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      setQuery('')
      const selectedIdx = options.findIndex((opt) => opt.value === currentValue)
      setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0)
    }
  }

  function handleSelect(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue)
    }
    onValueChange?.(nextValue)
    setOpen(false)
    setQuery('')
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (filteredOptions.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((prev) => (prev + 1) % filteredOptions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const candidate = filteredOptions[activeIndex] ?? filteredOptions[0]
      if (candidate && !candidate.disabled) {
        handleSelect(candidate.value)
      }
    }
  }

  return (
    <div className={cn('relative w-full min-w-0', className)}>
      {name ? (
        <input
          type="hidden"
          name={name}
          value={currentValue}
          required={required}
          disabled={disabled}
        />
      ) : null}

      <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        <PopoverPrimitive.Trigger
          id={id}
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            'flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm shadow-xs transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50',
            selectedOption ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          <span className="min-w-0 flex-1 truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform duration-150',
              open && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Positioner
            sideOffset={6}
            align="start"
            className="z-50 outline-none"
          >
            <PopoverPrimitive.Popup className="w-(--anchor-width) min-w-[260px] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg outline-none transition-all duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
              <div className="relative mb-1.5">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setActiveIndex(0)
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  className="h-8 w-full rounded-lg border border-input bg-background pr-7 pl-8 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setActiveIndex(0)
                    }}
                    aria-label="Hapus pencarian"
                    className="absolute right-1.5 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>

              <div role="listbox" className="max-h-60 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <p className="px-2.5 py-4 text-center text-xs text-muted-foreground">
                    {emptyMessage}
                  </p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {filteredOptions.map((option, index) => {
                      const isSelected = option.value === currentValue
                      const isHighlighted = index === activeIndex
                      return (
                        <button
                          key={option.value || '__empty__'}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          disabled={option.disabled}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => handleSelect(option.value)}
                          className={cn(
                            'flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors outline-none disabled:pointer-events-none disabled:opacity-50',
                            isHighlighted
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-accent/60 hover:text-accent-foreground',
                            isSelected && 'font-medium',
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate">{option.label}</span>
                          {isSelected ? (
                            <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  )
}

