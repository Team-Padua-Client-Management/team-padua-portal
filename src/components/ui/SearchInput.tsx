import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@src/lib/utils";

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  iconClassName?: string;
  iconSize?: number;
  onClear?: () => void;
  showClear?: boolean;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      containerClassName,
      iconClassName,
      iconSize = 16,
      value,
      onChange,
      onClear,
      showClear = false,
      ...props
    },
    ref
  ) => {
    const hasValue = value !== undefined && value !== null && value !== "";

    return (
      <div className={cn("relative flex-1 w-full group", containerClassName)}>
        <Search
          size={iconSize}
          className={cn(
            "absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors duration-200",
            iconClassName
          )}
        />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          className={cn(
            "w-full bg-card border border-border rounded-full h-11 pl-11 pr-4 text-sm text-text transition duration-200 focus:outline-none focus:border-[#F4C542] focus:ring-4 focus:ring-[#F4C542]/10",
            showClear && hasValue && "pr-10",
            className
          )}
          {...props}
        />
        {showClear && hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text rounded-full transition-colors cursor-pointer"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
