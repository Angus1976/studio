import * as React from 'react'

import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  showCount?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, showCount = false, maxLength, value, ...props }, ref) => {
    const charCount = value ? String(value).length : 0

    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            showCount && 'pr-12',
            className
          )}
          ref={ref}
          value={value}
          maxLength={maxLength}
          {...props}
        />
        {showCount && maxLength && (
          <div className="pointer-events-none absolute bottom-2 right-3 text-xs text-muted-foreground">
            {charCount} / {maxLength}
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
