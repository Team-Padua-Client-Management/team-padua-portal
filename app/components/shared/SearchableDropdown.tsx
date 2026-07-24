'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DropdownOption {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: boolean;
  loading?: boolean;
  label?: string;
  id?: string;
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = 'Search...',
  disabled = false,
  error = false,
  loading = false,
  label,
  id
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Selected option label
  const selectedLabel = useMemo(() => {
    const found = options.find(opt => opt.value === value);
    return found ? found.label : '';
  }, [options, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.toLowerCase().trim();
    return options.filter(opt => opt.label.toLowerCase().includes(term));
  }, [options, search]);

  // Sliced options for performance (simple windowing/virtualization fallback)
  // Max 100 items prevents DOM bloat and keeps filtering instant
  const displayedOptions = useMemo(() => {
    return filteredOptions.slice(0, 100);
  }, [filteredOptions]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => {
          const next = prev + 1;
          if (next >= displayedOptions.length) return 0;
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => {
          const next = prev - 1;
          if (next < 0) return displayedOptions.length - 1;
          return next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < displayedOptions.length) {
          const selected = displayedOptions[activeIndex];
          onChange(selected.value);
          setIsOpen(false);
          setSearch('');
          setActiveIndex(-1);
          triggerRef.current?.focus();
        } else if (displayedOptions.length === 1) {
          // If only one option matches, select it on Enter
          onChange(displayedOptions[0].value);
          setIsOpen(false);
          setSearch('');
          setActiveIndex(-1);
          triggerRef.current?.focus();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearch('');
        setActiveIndex(-1);
        triggerRef.current?.focus();
        break;
      case 'Tab':
        // Let Tab key function normally to exit dropdown
        setIsOpen(false);
        setSearch('');
        setActiveIndex(-1);
        break;
    }
  };

  // Scroll active option into view inside dropdown
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        const container = listRef.current;
        const scrollBottom = container.clientHeight + container.scrollTop;
        const elementBottom = activeEl.offsetTop + activeEl.clientHeight;
        const elementTop = activeEl.offsetTop;

        if (elementBottom > scrollBottom) {
          container.scrollTop = elementBottom - container.clientHeight;
        } else if (elementTop < container.scrollTop) {
          container.scrollTop = elementTop;
        }
      }
    }
  }, [activeIndex]);

  const selectOption = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
    setSearch('');
    setActiveIndex(-1);
    triggerRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-1 w-full text-left" ref={containerRef}>
      {label && (
        <label 
          htmlFor={id} 
          className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5"
        >
          {label}
        </label>
      )}
      <div className="relative w-full">
        {/* Trigger Button */}
        <button
          id={id}
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          disabled={disabled}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              setSearch('');
              setActiveIndex(-1);
            } else {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className={`
            w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border text-left transition-all duration-200 outline-none
            ${disabled 
              ? 'bg-gray-100 dark:bg-gray-800/40 text-gray-400 border-gray-200 dark:border-gray-800/60 cursor-not-allowed'
              : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 cursor-pointer'
            }
            ${error 
              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
              : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500'
            }
          `}
        >
          <span className={`block truncate ${!selectedLabel ? 'text-gray-400 dark:text-gray-500' : ''}`}>
            {loading ? 'Loading...' : (selectedLabel || placeholder)}
          </span>
          <span className="flex items-center gap-1.5 ml-2 text-gray-400 dark:text-gray-500">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {/* Dropdown Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute z-50 w-full mt-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl outline-none overflow-hidden"
              role="presentation"
            >
              {/* Search Box */}
              <div className="flex items-center border-b border-gray-200 dark:border-gray-800 px-2.5 py-2">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setActiveIndex(-1);
                  }}
                  className="w-full bg-transparent border-0 p-0 text-sm focus:ring-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
                {search && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setSearch('');
                      setActiveIndex(-1);
                    }}
                    className="p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Options List */}
              <div
                ref={listRef}
                role="listbox"
                className="max-h-60 overflow-y-auto py-1 outline-none"
              >
                {displayedOptions.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                    No results found
                  </div>
                ) : (
                  displayedOptions.map((opt, index) => {
                    const isSelected = opt.value === value;
                    const isActive = index === activeIndex;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => selectOption(opt.value)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors duration-150 outline-none cursor-pointer
                          ${isSelected 
                            ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' 
                            : 'text-gray-700 dark:text-gray-300'
                          }
                          ${isActive 
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }
                        `}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-blue-500 flex-shrink-0 ml-2" />}
                      </button>
                    );
                  })
                )}
                {filteredOptions.length > displayedOptions.length && (
                  <div className="border-t border-gray-100 dark:border-gray-800/60 px-3 py-1.5 text-[10px] text-gray-400 dark:text-gray-500 italic text-center">
                    Showing top 100 results, type to refine
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
