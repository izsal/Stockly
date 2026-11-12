'use client'

import * as React from 'react'
import { Select as SelectPrimitive } from '@base-ui/react/select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const EMPTY_VALUE_SENTINEL = '__stockly_empty__'

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

const Select = SelectPrimitive.Root

function SelectTrigger({
  className,
  children,
  ...props
}: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm text-foreground shadow-xs transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="shrink-0 text-muted-foreground">
        <ChevronDown className="size-4" aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectValue({
  className,
  ...props
}: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      className={cn('min-w-0 flex-1 truncate', className)}
      {...props}
    />
  )
}

function SelectContent({
  className,
  children,
  ...props
}: SelectPrimitive.Popup.Props) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        sideOffset={6}
        alignItemWithTrigger={false}
        className="z-50 outline-none"
      >
        <SelectPrimitive.Popup
          className={cn(
            'max-h-72 min-w-(--anchor-width) overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none transition-all duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0',
            className,
          )}
          {...props}
        >
          <SelectPrimitive.List className="flex flex-col gap-0.5">
            {children}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm text-popover-foreground outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-highlighted:text-accent-foreground data-selected:font-medium',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="min-w-0 flex-1 truncate">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="shrink-0 text-primary">
        <Check className="size-4" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function encodeValue(value: string): string {
  return value === '' ? EMPTY_VALUE_SENTINEL : value
}

function decodeValue(value: string): string {
  return value === EMPTY_VALUE_SENTINEL ? '' : value
}

interface ModernSelectProps {
  id?: string
  name?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  options: readonly SelectOption[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  ariaLabel?: string
  className?: string
}

function ModernSelect({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder = 'Pilih opsi…',
  disabled = false,
  required = false,
  ariaLabel,
  className,
}: ModernSelectProps) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '')
  const currentValue = isControlled ? value : internalValue

  const mappedItems = React.useMemo(
    () =>
      options.map((option) => ({
        value: encodeValue(option.value),
        label: option.label,
        disabled: option.disabled,
      })),
    [options],
  )

  const encodedValue = encodeValue(currentValue)
  const hasMatchingOption = mappedItems.some((item) => item.value === encodedValue)

  function handleChange(nextEncoded: string | null) {
    const nextValue = decodeValue(nextEncoded ?? '')
    if (!isControlled) {
      setInternalValue(nextValue)
    }
    onValueChange?.(nextValue)
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
      <Select
        items={mappedItems}
        value={hasMatchingOption ? encodedValue : null}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger id={id} aria-label={ariaLabel} className="w-full min-w-0">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {mappedItems.map((item) => (
            <SelectItem key={item.value} value={item.value} disabled={item.disabled}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export {
  ModernSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
}

