import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SearchBarProps extends React.ComponentProps<"input"> {
  onClear?: () => void
  containerClassName?: string
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, value, onChange, onClear, placeholder = "Tìm kiếm bài học...", containerClassName, ...props }, ref) => {
    const hasValue = !!value

    return (
      <div className={cn("relative w-full max-w-md group", containerClassName)}>
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-navy/70 dark:text-light-blue/70">
          <Search className="size-5 transition-colors group-focus-within:text-primary" />
        </div>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "w-full pl-12 pr-10 py-3.5 rounded-2xl bg-gray-50/50 dark:bg-navy-blue border border-gray-200 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-gray-300 hover:dark:border-white/15 outline-none transition-all font-medium text-dark-blue dark:text-white placeholder:text-gray-navy/55 dark:placeholder:text-light-blue/50 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] text-sm",
            className
          )}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute inset-y-0 right-4 flex items-center text-gray-navy/60 dark:text-light-blue/60 hover:text-dark-blue dark:hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className="size-5" />
          </button>
        )}
      </div>
    )
  }
)

SearchBar.displayName = "SearchBar"

export { SearchBar }
