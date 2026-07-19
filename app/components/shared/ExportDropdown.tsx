'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, ChevronDown, FileSpreadsheet, FileText, File } from 'lucide-react';

interface ExportDropdownProps {
  onExport: (format: 'csv' | 'pdf' | 'word') => void;
}

export default function ExportDropdown({ onExport }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8, // align nicely below the button
        left: rect.right - 192 + window.scrollX, // align menu to the right side of the button
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const clickedInsideButton = dropdownRef.current && dropdownRef.current.contains(event.target as Node);
      const clickedInsideMenu = menuRef.current && menuRef.current.contains(event.target as Node);
      if (!clickedInsideButton && !clickedInsideMenu) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuContent = (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: '192px',
        zIndex: 99999,
      }}
      className="rounded-xl border border-border bg-card shadow-lg py-1.5 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <button
        onClick={() => {
          onExport('csv');
          setIsOpen(false);
        }}
        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-text-secondary hover:text-text hover:bg-surface-2 flex items-center gap-2.5 transition border-0 cursor-pointer bg-transparent"
      >
        <FileSpreadsheet size={14} className="text-emerald-500 shrink-0" />
        <span>Export CSV (.csv)</span>
      </button>
      
      <button
        onClick={() => {
          onExport('pdf');
          setIsOpen(false);
        }}
        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-text-secondary hover:text-text hover:bg-surface-2 flex items-center gap-2.5 transition border-0 cursor-pointer bg-transparent"
      >
        <FileText size={14} className="text-amber-500 shrink-0" />
        <span>Export PDF (.pdf)</span>
      </button>

      <button
        onClick={() => {
          onExport('word');
          setIsOpen(false);
        }}
        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-text-secondary hover:text-text hover:bg-surface-2 flex items-center gap-2.5 transition border-0 cursor-pointer bg-transparent"
      >
        <File size={14} className="text-blue-500 shrink-0" />
        <span>Export Word (.doc)</span>
      </button>
    </div>
  );

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4.5 py-2.5 bg-card border border-border text-text-secondary hover:text-text rounded-xl text-sm font-semibold hover:bg-surface-2 transition-all duration-200 select-none shadow-sm cursor-pointer"
      >
        <Download size={14} className="shrink-0" />
        <span>Export Data</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {mounted && isOpen ? createPortal(menuContent, document.body) : null}
    </div>
  );
}
