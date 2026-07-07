'use client';

/**
 * page.tsx
 *
 * Main component module in features path: app/(admin)/admin/cpst/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/admin/cpst/page.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Search, Filter, Edit2, Trash2, X,
  Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2,
  Eye, Download, ChevronDown, ChevronRight, Clock, Calendar,
  ArrowUpDown, Check, AlertTriangle, Users, Star, Target
} from 'lucide-react';
import Header from '@/app/components/admin/AdminHeader/page';
import Sidebar from '@/app/components/admin/AdminSidebar/page';

interface Client {
  id: string;
  name: string;
  relationship: string;
  birthdate: string;
  notes?: string;
  status: 'Prospect' | 'Serviced' | 'Lead';
  created_at?: string;
}

interface ImportRecord {
  name: string;
  relationship: string;
  birthdate: string;
  status: 'Prospect';
  notes: string;
}

interface InvalidImportRecord extends ImportRecord {
  rowNumber: number;
  reason: string;
  rawData: Record<string, any>;
}

interface ValidationResult {
  valid: ImportRecord[];
  duplicates: ImportRecord[];
  invalid: InvalidImportRecord[];
  total: number;
}

interface ImportState {
  phase: 'idle' | 'reading' | 'preview' | 'importing' | 'done' | 'error';
  fileName: string;
  validation: ValidationResult | null;
  importedCount: number;
  errorMessage: string;
}

interface ImportProgress {
  total: number;
  current: number;
  currentName: string;
  percent: number;
  elapsed: number;
  estimatedRemaining: number;
  logs: Array<{ type: 'success' | 'duplicate' | 'invalid'; name: string; message: string }>;
}

interface InvalidRecordsModalProps {
  invalidRecords: InvalidImportRecord[];
  onClose: () => void;
}

const monthsList = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

type SortOption = 'birthday-earliest' | 'birthday-latest' | 'name-asc' | 'name-desc' | 'newest' | 'oldest';

/**
 * Executes operations logic for calculateAge.
 *
 * @param birthdateStr: string
 * @returns State operations sequence.
 */
function calculateAge(birthdateStr: string): string {
  if (!birthdateStr) return 'N/A';
  const birthDate = new Date(birthdateStr);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthsDiff = today.getMonth() - birthDate.getMonth();
  const daysDiff = today.getDate() - birthDate.getDate();
  if (monthsDiff < 0 || (monthsDiff === 0 && daysDiff < 0)) years--;
  if (years > 0) return `${years} yrs`;
  let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + today.getMonth() - birthDate.getMonth();
  if (daysDiff < 0) months--;
  if (months > 0) return `${months} mos`;
  return 'Newborn';
}

/**
 * Executes operations logic for getBirthMonthName.
 *
 * @param birthdateStr: string
 * @returns State operations sequence.
 */
function getBirthMonthName(birthdateStr: string): string {
  if (!birthdateStr) return 'UNKNOWN';
  return monthsList[new Date(birthdateStr).getMonth()];
}

/**
 * Executes operations logic for formatDateDisplay.
 *
 * @param dateStr: string
 * @returns State operations sequence.
 */
function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Executes operations logic for parseDateFlexible.
 *
 * @param raw: string
 * @returns State operations sequence.
 */
function parseDateFlexible(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const mdy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;
  const dmy = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  const serial = Number(trimmed);
  if (!isNaN(serial) && serial > 10000) {
    const d = new Date((serial - 25569) * 86400 * 1000);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return '';
}

/**
 * Executes operations logic for getReasonColor.
 *
 * @param reason: string
 * @returns State operations sequence.
 */
function getReasonColor(reason: string): string {
  if (reason.includes('Name')) return 'text-red-600 dark:text-red-400';
  if (reason.includes('Birthdate')) return 'text-orange-600 dark:text-orange-400';
  if (reason.includes('Duplicate')) return 'text-yellow-600 dark:text-yellow-400';
  if (reason.includes('Format')) return 'text-blue-600 dark:text-blue-400';
  return 'text-muted-foreground';
}

/**
 * Executes operations logic for getReasonBadgeColor.
 *
 * @param reason: string
 * @returns State operations sequence.
 */
function getReasonBadgeColor(reason: string): string {
  if (reason.includes('Name')) return 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
  if (reason.includes('Birthdate')) return 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
  if (reason.includes('Duplicate')) return 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
  if (reason.includes('Format')) return 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
  return 'bg-muted/50 text-muted-foreground border-border';
}

/**
 * Executes operations logic for getSuggestedFix.
 *
 * @param reason: string
 * @returns State operations sequence.
 */
function getSuggestedFix(reason: string): string {
  if (reason.includes('Missing Client Name')) return 'Enter the client\'s full name in the Client Name column.';
  if (reason.includes('Missing or Invalid Birthdate')) return 'Enter a valid birthdate. Accepted formats: MM/DD/YYYY or YYYY-MM-DD';
  if (reason.includes('Invalid Date')) return 'Use MM/DD/YYYY or YYYY-MM-DD format for birthdates.';
  if (reason.includes('Duplicate')) return 'Remove the duplicate row or update the existing client record.';
  return 'Review the record and correct the data.';
}

const isHeaderOrMonth = (val: string): boolean => {
  if (!val) return false;
  const upper = val.toUpperCase().trim();
  if (monthsList.includes(upper)) return true;
  if (upper === 'DANIEL PADUA | CLIENTS & BENEFICIARIES') return true;
  if (upper === 'CLIENT NAME / BENEFICIARY NAME') return true;
  if (upper === 'CLIENT NAME') return true;
  if (upper === 'MONTH — BIRTHDATE') return true;
  return false;
};

const InvalidRecordsModal: React.FC<InvalidRecordsModalProps> = ({ invalidRecords, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [sortField, setSortField] = useState<'row' | 'name' | 'reason'>('row');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const getDisplayName = (record: InvalidImportRecord): string => {
    if (record.name && record.name.trim().length > 0) return record.name;
    if (record.rawData && typeof record.rawData === 'object') {
      const vals = Object.entries(record.rawData)
        .filter(([k]) => k.trim() !== '')
        .map(([, v]) => String(v).trim())
        .filter(v => v.length > 0);
      if (vals.length > 0) return vals[0];
    }
    return '(Empty Name)';
  };

  const getDisplayRelationship = (record: InvalidImportRecord): string => {
    if (record.relationship) return record.relationship;
    const rawValues = Object.values(record.rawData);
    for (const val of rawValues) {
      if (val && typeof val === 'string' && val.includes('(') && val.includes(')')) {
        const match = val.match(/\((.+)\)/);
        if (match) return match[1];
      }
    }
    return '';
  };

  const getRawClientValue = (record: InvalidImportRecord): string => {
    const keys = ['Client Name / Beneficiary Name', 'Client Name', 'Name', 'client', 'full name'];
    for (const key of keys) {
      if (record.rawData[key]) return record.rawData[key];
    }
    const values = Object.values(record.rawData);
    for (const val of values) {
      if (val && typeof val === 'string' && val.trim().length > 0) {
        return val;
      }
    }
    return '';
  };

  const searchInRawData = (record: InvalidImportRecord, term: string): boolean => {
    const searchStr = term.toLowerCase();
    if (record.name.toLowerCase().includes(searchStr)) return true;
    if (record.reason.toLowerCase().includes(searchStr)) return true;
    return Object.values(record.rawData).some(val =>
      val && typeof val === 'string' && val.toLowerCase().includes(searchStr)
    );
  };

  const filteredRecords = invalidRecords.filter(record =>
    searchInRawData(record, searchTerm)
  );

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'row':
        comparison = a.rowNumber - b.rowNumber;
        break;
      case 'name':
        comparison = getDisplayName(a).localeCompare(getDisplayName(b));
        break;
      case 'reason':
        comparison = a.reason.localeCompare(b.reason);
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  /**
 * Executes operations logic for handleSort.
 *
 * @param field: 'row' | 'name' | 'reason'
 * @returns State operations sequence.
 */
const handleSort = (field: 'row' | 'name' | 'reason') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  /**
 * Executes operations logic for downloadCSV.
 *
 * 
 * @returns State operations sequence.
 */
const downloadCSV = () => {
    const headers = ['Row', 'Client', 'Beneficiary', 'Birthdate', 'Reason'];
    const rows = invalidRecords.map(r => [
      r.rowNumber,
      getDisplayName(r),
      getDisplayRelationship(r),
      r.birthdate || '',
      r.reason
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Invalid_Records.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container_0}>
      <div className={styles.card_1}>
        <div className={styles.div_2}>
          <button
            onClick={onClose}
            className={styles.table_3}
          >
            <X size={16} />
          </button>
          <h2 className={styles.table_4}>Invalid Records</h2>
          <p className={styles.text_5}>
            {invalidRecords.length} records could not be imported. Required information is missing or invalid.
          </p>
        </div>

        <div className={styles.container_6}>
          <div className={styles.container_7}>
            <div className={styles.container_8}>
              <Search className={styles.text_9} />
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={styles.text_10}
              />
            </div>
            <button
              onClick={downloadCSV}
              className={styles.table_11}
            >
              <Download size={14} />
              Download Error Report
            </button>
          </div>

          <div className={styles.div_12}>
            <div className={styles.div_13}>
              <table className={styles.text_14}>
                <thead>
                  <tr className={styles.table_15}>
                    <th className={styles.table_16} onClick={() => handleSort('row')}>
                      Row {sortField === 'row' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className={styles.table_17} onClick={() => handleSort('name')}>
                      Client {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className={styles.div_18}>Beneficiary</th>
                    <th className={styles.div_19}>Birthdate</th>
                    <th className={styles.table_20} onClick={() => handleSort('reason')}>
                      Reason {sortField === 'reason' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className={styles.div_21}>Details</th>
                  </tr>
                </thead>
                <tbody className={styles.text_22}>
                  {sortedRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className={styles.text_23}>
                        No invalid records found matching the search criteria.
                      </td>
                    </tr>
                  )}
                  {sortedRecords.map((record) => {
                    const displayName = getDisplayName(record);
                    const displayRelationship = getDisplayRelationship(record);
                    const rawClientValue = getRawClientValue(record);
                    const isExpanded = expandedRow === record.rowNumber;

                    return (
                      <React.Fragment key={record.rowNumber}>
                        <tr
                          className={`${styles.table_24} group`}
                          onClick={() => setExpandedRow(isExpanded ? null : record.rowNumber)}
                        >
                          <td className={styles.text_25}>{record.rowNumber}</td>
                          <td className={styles.div_26}>
                            <span className={`${styles.text_224} ${displayName && displayName !== '(Empty Name)' && displayName !== '(Unknown)' ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {displayName}
                            </span>
                          </td>
                          <td className={styles.div_27}>
                            <span className={styles.text_28}>
                              {displayRelationship || '—'}
                            </span>
                          </td>
                          <td className={styles.div_29}>
                            <span className={styles.text_30}>
                              {record.birthdate || '(empty)'}
                            </span>
                          </td>
                          <td className={styles.div_31}>
                            <span className={`${styles.text_225} ${getReasonBadgeColor(record.reason)}`}>
                              {record.reason}
                            </span>
                          </td>
                          <td className={styles.div_32}>
                            <div className={styles.container_33}>
                              <span className={styles.text_34}>
                                {isExpanded ? 'Hide' : 'View'}
                              </span>
                              {isExpanded ? (
                                <ChevronDown size={12} className={styles.text_35} />
                              ) : (
                                <ChevronRight size={12} className={styles.text_36} />
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className={styles.div_37}>
                              <div className={styles.text_38}>
                                <div>
                                  <p className={styles.table_39}>Original Excel Data</p>
                                  <div className={styles.card_40}>
                                    {Object.entries(record.rawData)
                                      .filter(([key]) => key.trim() !== '')
                                      .slice(0, 4)
                                      .map(([key, value]) => (
                                        <div key={key} className={styles.div_41}>
                                          <p className={styles.table_42}>{key || 'Column'}</p>
                                          <p className={styles.text_43}>
                                            {value || '(empty)'}
                                          </p>
                                        </div>
                                      ))}
                                  </div>
                                </div>

                                <div className={styles.container_44}>
                                  <div className={styles.card_45}>
                                    <p className={styles.table_46}>Reason</p>
                                    <p className={`${styles.text_226} ${getReasonColor(record.reason)}`}>{record.reason}</p>
                                  </div>
                                  <div className={styles.card_47}>
                                    <p className={styles.table_48}>Suggested Fix</p>
                                    <p className={styles.text_49}>{getSuggestedFix(record.reason)}</p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.container_50}>
            <button
              onClick={onClose}
              className={styles.table_51}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Executes operations logic for parseExcelOrCSV.
 *
 * @param file: File, existingClients: Client[]
 * @returns State operations sequence.
 */
async function parseExcelOrCSV(file: File, existingClients: Client[]): Promise<ValidationResult> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: true, defval: '' });
  const existingNames = new Set(existingClients.map(c => c.name.toLowerCase().trim()));

  let headerIndex = 0;
  for (let i = 0; i < rows.length; i++) {
    const rowText = rows[i].join(" ").toLowerCase();
    if (rowText.includes("birthdate") && rowText.includes("client")) {
      headerIndex = i;
      break;
    }
  }

  const headerRow = (rows[headerIndex] as unknown[]) || [];
  const findCol = (keywords: string[]): number =>
    headerRow.findIndex((h) => keywords.some(kw => String(h).toLowerCase().includes(kw)));

  const nameCol = findCol(['client name', 'name', 'full name', 'client']);
  const dateCol = findCol(['birth', 'bday', 'birthday', 'birthdate', 'date']);

  const valid: ImportRecord[] = [];
  const duplicates: ImportRecord[] = [];
  const invalid: InvalidImportRecord[] = [];

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row || row.every((cell) => !String(cell).trim())) continue;

    const full = nameCol >= 0 ? String(row[nameCol] ?? '').trim() : '';
    const rawDate = dateCol >= 0 ? String(row[dateCol] ?? '').trim() : '';
    const birthdate = parseDateFlexible(rawDate);

    if (isHeaderOrMonth(full)) continue;

    let name = full;
    let relationship = "";
    const match = full.match(/^(.+?)\s*\((.+)\)$/);
    if (match) {
      name = match[1].trim();
      relationship = match[2].trim();
    }

    const rowNumber = i + 1;
    const rawData: Record<string, any> = {};
    headerRow.forEach((h, idx) => {
      rawData[String(h)] = row[idx] ?? '';
    });

    if (!name) {
      invalid.push({
        name: '',
        relationship,
        birthdate,
        status: 'Prospect',
        notes: 'Imported from file',
        rowNumber,
        reason: 'Missing Client Name',
        rawData
      });
      continue;
    }

    if (!birthdate) {
      invalid.push({
        name,
        relationship,
        birthdate: '',
        status: 'Prospect',
        notes: 'Imported from file',
        rowNumber,
        reason: 'Missing or Invalid Birthdate',
        rawData
      });
      continue;
    }

    const record: ImportRecord = { name, relationship, birthdate, status: 'Prospect', notes: 'Imported from file' };
    if (existingNames.has(name.toLowerCase())) {
      duplicates.push(record);
    } else {
      valid.push(record);
    }
  }

  return { valid, duplicates, invalid, total: valid.length + duplicates.length + invalid.length };
}

/**
 * Executes operations logic for parseDocx.
 *
 * @param file: File, existingClients: Client[]
 * @returns State operations sequence.
 */
async function parseDocx(file: File, existingClients: Client[]): Promise<ValidationResult> {
  const mammoth = await import('mammoth');
  const buffer = await file.arrayBuffer();
  const textResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
  const parser = new DOMParser();
  const doc = parser.parseFromString(textResult.value, 'text/html');
  const tables = doc.querySelectorAll('table');
  const existingNames = new Set(existingClients.map(c => c.name.toLowerCase().trim()));

  const valid: ImportRecord[] = [];
  const duplicates: ImportRecord[] = [];
  const invalid: InvalidImportRecord[] = [];

  tables.forEach(table => {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length < 2) return;
    const headers = Array.from(rows[0].querySelectorAll('th,td')).map(td => td.textContent?.toLowerCase().trim() || '');
    const nameIdx = headers.findIndex(h => h.includes('client') || h.includes('name'));
    const dateIdx = headers.findIndex(h => h.includes('birth') || h.includes('date'));

    for (let i = 1; i < rows.length; i++) {
      const cells = Array.from(rows[i].querySelectorAll('td')).map(td => td.textContent?.trim() || '');
      const full = nameIdx >= 0 ? cells[nameIdx] || '' : '';
      const birthdate = parseDateFlexible(dateIdx >= 0 ? cells[dateIdx] || '' : '');

      if (isHeaderOrMonth(full)) continue;

      let name = full;
      let relationship = "";
      const match = full.match(/^(.+?)\s*\((.+)\)$/);
      if (match) {
        name = match[1].trim();
        relationship = match[2].trim();
      }

      const rowNumber = i + 1;
      const rawData: Record<string, any> = {};
      headers.forEach((h, idx) => {
        rawData[h] = cells[idx] || '';
      });

      if (!name) {
        invalid.push({
          name: '',
          relationship,
          birthdate,
          status: 'Prospect',
          notes: 'Imported from Word',
          rowNumber,
          reason: 'Missing Client Name',
          rawData
        });
        continue;
      }

      if (!birthdate) {
        invalid.push({
          name,
          relationship,
          birthdate: '',
          status: 'Prospect',
          notes: 'Imported from Word',
          rowNumber,
          reason: 'Missing or Invalid Birthdate',
          rawData
        });
        continue;
      }

      const record: ImportRecord = { name, relationship, birthdate, status: 'Prospect', notes: 'Imported from Word' };
      if (existingNames.has(name.toLowerCase())) {
        duplicates.push(record);
      } else {
        valid.push(record);
      }
    }
  });

  return { valid, duplicates, invalid, total: valid.length + duplicates.length + invalid.length };
}

/**
 * Executes operations logic for parsePDF.
 *
 * @param file: File, existingClients: Client[]
 * @returns State operations sequence.
 */
async function parsePDF(file: File, existingClients: Client[]): Promise<ValidationResult> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const buffer = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;

  let allText = '';
  for (let p = 1; p <= pdfDoc.numPages; p++) {
    const page = await pdfDoc.getPage(p);
    const content = await page.getTextContent();
    allText += content.items.map((item) => ("str" in item ? item.str : "")).join(" ") + "\n";
  }

  const existingNames = new Set(existingClients.map(c => c.name.toLowerCase().trim()));
  const valid: ImportRecord[] = [];
  const duplicates: ImportRecord[] = [];
  const invalid: InvalidImportRecord[] = [];
  const datePattern = /\d{1,4}[-/]\d{1,2}[-/]\d{2,4}/;

  let rowNumber = 0;
  for (const line of allText.split('\n').map(l => l.trim()).filter(Boolean)) {
    rowNumber++;
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;
    const beforeDate = line.slice(0, line.indexOf(dateMatch[0])).trim();
    if (!beforeDate) continue;

    const birthdate = parseDateFlexible(dateMatch[0]);
    const full = beforeDate.replace(/[|,\t]+/g, ' ').trim();

    if (isHeaderOrMonth(full)) continue;

    let name = full;
    let relationship = "";
    const match = full.match(/^(.+?)\s*\((.+)\)$/);
    if (match) {
      name = match[1].trim();
      relationship = match[2].trim();
    }

    const rawData: Record<string, any> = { line };

    if (!name) {
      invalid.push({
        name: '',
        relationship: '',
        birthdate,
        status: 'Prospect',
        notes: 'Imported from PDF',
        rowNumber,
        reason: 'Missing Client Name',
        rawData
      });
      continue;
    }

    if (!birthdate) {
      invalid.push({
        name,
        relationship,
        birthdate: '',
        status: 'Prospect',
        notes: 'Imported from PDF',
        rowNumber,
        reason: 'Missing or Invalid Birthdate',
        rawData
      });
      continue;
    }

    const record: ImportRecord = { name, relationship, birthdate, status: 'Prospect', notes: 'Imported from PDF' };
    if (existingNames.has(name.toLowerCase())) {
      duplicates.push(record);
    } else {
      valid.push(record);
    }
  }

  return { valid, duplicates, invalid, total: valid.length + duplicates.length + invalid.length };
}

/**
 * CPSTOverviewPage
 *
 * Renders the CPSTOverviewPage interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for CPSTOverviewPage.
 *
 * 
 * @returns State operations sequence.
 */
export default function CPSTOverviewPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('birthday-earliest');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {}
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showInvalidModal, setShowInvalidModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    birthdate: '',
    status: 'Prospect' as Client['status'],
    notes: '',
  });

  const [importState, setImportState] = useState<ImportState>({
    phase: 'idle',
    fileName: '',
    validation: null,
    importedCount: 0,
    errorMessage: '',
  });

  const [importProgress, setImportProgress] = useState<ImportProgress>({
    total: 0,
    current: 0,
    currentName: '',
    percent: 0,
    elapsed: 0,
    estimatedRemaining: 0,
    logs: [],
  });

  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importStartTime = useRef<number>(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const refreshClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) return;
      const data = await res.json();
      setClients(data as Client[]);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    refreshClients();
  }, [refreshClients]);

  useEffect(() => {
    if (importState.phase === 'importing') {
      importStartTime.current = Date.now();
      progressInterval.current = setInterval(() => {
        setImportProgress(prev => {
          const elapsed = (Date.now() - importStartTime.current) / 1000;
          const avgTimePerRecord = prev.current > 0 ? elapsed / prev.current : 0;
          const remaining = (prev.total - prev.current) * avgTimePerRecord;
          return {
            ...prev,
            elapsed: Math.round(elapsed),
            estimatedRemaining: Math.round(remaining)
          };
        });
      }, 1000);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    }
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, [importState.phase]);

  /**
 * Executes operations logic for handleOpenAddModal.
 *
 * 
 * @returns State operations sequence.
 */
const handleOpenAddModal = () => {
    setEditingClient(null);
    setFormData({ name: '', relationship: '', birthdate: '', status: 'Prospect', notes: '' });
    setIsModalOpen(true);
  };

  /**
 * Executes operations logic for handleOpenEditModal.
 *
 * @param client: Client
 * @returns State operations sequence.
 */
const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      relationship: client.relationship,
      birthdate: client.birthdate,
      status: client.status,
      notes: client.notes || '',
    });
    setIsModalOpen(true);
  };

  /**
 * Executes operations logic for handleOpenImportModal.
 *
 * 
 * @returns State operations sequence.
 */
const handleOpenImportModal = () => {
    setImportState({ phase: 'idle', fileName: '', validation: null, importedCount: 0, errorMessage: '' });
    setImportProgress({ total: 0, current: 0, currentName: '', percent: 0, elapsed: 0, estimatedRemaining: 0, logs: [] });
    setShowPreview(false);
    setShowInvalidModal(false);
    setIsImportModalOpen(true);
  };

  /**
 * Executes operations logic for showConfirm.
 *
 * @param message: string, onConfirm: (
 * @returns State operations sequence.
 */
const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      message,
      onConfirm
    });
  };

  /**
 * Executes operations logic for handleDelete.
 *
 * @param id: string
 * @returns State operations sequence.
 */
const handleDelete = (id: string) => {
    showConfirm('Remove this client from the registry?', async () => {
      try {
        await fetch(`/api/clients?id=${id}`, { method: 'DELETE' });
        setSelectedClientIds(prev => prev.filter(item => item !== id));
      } catch (err) {
        console.error(err);
      }
      await refreshClients();
    });
  };

  /**
 * Executes operations logic for handleBulkDelete.
 *
 * 
 * @returns State operations sequence.
 */
const handleBulkDelete = () => {
    if (selectedClientIds.length === 0) return;
    showConfirm(`Are you sure you want to delete ${selectedClientIds.length} selected client(s)?`, async () => {
      try {
        await fetch('/api/clients', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedClientIds })
        });
        setSelectedClientIds([]);
        await refreshClients();
      } catch (err) {
        console.error(err);
      }
    });
  };

  /**
 * Executes operations logic for handleSubmit.
 *
 * @param e: React.FormEvent
 * @returns State operations sequence.
 */
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.birthdate) return;
    try {
      if (editingClient) {
        await fetch('/api/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingClient.id, ...formData }),
        });
      } else {
        await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
    } catch (err) {
      console.error(err);
    }
    await refreshClients();
    setIsModalOpen(false);
  };

  /**
 * Executes operations logic for processFile.
 *
 * @param file: File
 * @returns State operations sequence.
 */
const processFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['xlsx', 'xls', 'csv', 'docx', 'pdf'];

    if (!ext || !allowed.includes(ext)) {
      setImportState(prev => ({ ...prev, phase: 'error', errorMessage: 'Unsupported file type.' }));
      return;
    }

    setImportState({ phase: 'reading', fileName: file.name, validation: null, importedCount: 0, errorMessage: '' });
    setShowPreview(false);

    try {
      let result: ValidationResult;
      if (['xlsx', 'xls', 'csv'].includes(ext)) {
        result = await parseExcelOrCSV(file, clients);
      } else if (ext === 'docx') {
        result = await parseDocx(file, clients);
      } else {
        result = await parsePDF(file, clients);
      }
      setImportState(prev => ({ ...prev, phase: 'preview', validation: result }));
    } catch (err) {
      console.error(err);
      setImportState(prev => ({
        ...prev,
        phase: 'error',
        errorMessage: 'Could not read file.',
      }));
    }
  };

  /**
 * Executes operations logic for handleFileChange.
 *
 * @param e: React.ChangeEvent<HTMLInputElement>
 * @returns State operations sequence.
 */
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [clients]);

  /**
 * Executes operations logic for handleImportAll.
 *
 * 
 * @returns State operations sequence.
 */
const handleImportAll = async () => {
    if (!importState.validation?.valid.length) return;
    setImportState(prev => ({ ...prev, phase: 'importing' }));

    const validRecords = importState.validation.valid;
    const total = validRecords.length;
    let current = 0;
    const logs: Array<{ type: 'success' | 'duplicate' | 'invalid'; name: string; message: string }> = [];

    setImportProgress({
      total,
      current: 0,
      currentName: '',
      percent: 0,
      elapsed: 0,
      estimatedRemaining: 0,
      logs: [],
    });

    for (const record of validRecords) {
      current++;
      setImportProgress(prev => ({
        ...prev,
        current,
        currentName: record.name,
        percent: Math.round((current / total) * 100),
      }));

      try {
        await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
        });
        logs.push({ type: 'success', name: record.name, message: 'Imported successfully' });
      } catch {
        logs.push({ type: 'invalid', name: record.name, message: 'Failed to import' });
      }

      setImportProgress(prev => ({
        ...prev,
        logs: [...prev.logs, logs[logs.length - 1]]
      }));
    }

    await refreshClients();
    setImportState(prev => ({ ...prev, phase: 'done', importedCount: current }));
  };

  /**
 * Executes operations logic for handleResetImport.
 *
 * 
 * @returns State operations sequence.
 */
const handleResetImport = () => {
    setImportState({ phase: 'idle', fileName: '', validation: null, importedCount: 0, errorMessage: '' });
    setImportProgress({ total: 0, current: 0, currentName: '', percent: 0, elapsed: 0, estimatedRemaining: 0, logs: [] });
    setShowPreview(false);
    setShowInvalidModal(false);
  };

  const getFilteredClients = useCallback(() => {
    let filtered = clients.filter(client => {
      const nameMatch =
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.relationship.toLowerCase().includes(search.toLowerCase()) ||
        (client.notes && client.notes.toLowerCase().includes(search.toLowerCase()));
      const monthMatch = selectedMonth === 'ALL' || getBirthMonthName(client.birthdate) === selectedMonth;
      const statusMatch = selectedStatus === 'ALL' || client.status === selectedStatus;
      return nameMatch && monthMatch && statusMatch;
    });

    switch (sortOption) {
      case 'birthday-earliest':
        filtered.sort((a, b) => {
          const dateA = new Date(a.birthdate);
          const dateB = new Date(b.birthdate);
          if (dateA.getDate() !== dateB.getDate()) return dateA.getDate() - dateB.getDate();
          return a.name.localeCompare(b.name);
        });
        break;
      case 'birthday-latest':
        filtered.sort((a, b) => {
          const dateA = new Date(a.birthdate);
          const dateB = new Date(b.birthdate);
          if (dateA.getDate() !== dateB.getDate()) return dateB.getDate() - dateA.getDate();
          return a.name.localeCompare(b.name);
        });
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
        filtered.sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return 0;
        });
        break;
      case 'oldest':
        filtered.sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          }
          return 0;
        });
        break;
    }

    return filtered;
  }, [clients, search, selectedMonth, selectedStatus, sortOption]);

  const filteredClients = getFilteredClients();

  const groupedClients: Record<string, Client[]> = {};
  monthsList.forEach(m => { groupedClients[m] = []; });
  filteredClients.forEach(client => {
    const m = getBirthMonthName(client.birthdate);
    if (groupedClients[m]) groupedClients[m].push(client);
  });

  monthsList.forEach(month => {
    groupedClients[month].sort((a, b) => {
      const dateA = new Date(a.birthdate);
      const dateB = new Date(b.birthdate);
      if (dateA.getDate() !== dateB.getDate()) return dateA.getDate() - dateB.getDate();
      return a.name.localeCompare(b.name);
    });
  });

  const renderedClients: Client[] = [];
  monthsList.forEach(month => {
    const monthClients = groupedClients[month] || [];
    renderedClients.push(...monthClients);
  });

  const totalCount = filteredClients.length;
  const servicedCount = filteredClients.filter(c => c.status === 'Serviced').length;
  const leadCount = filteredClients.filter(c => c.status === 'Lead').length;
  const prospectCount = filteredClients.filter(c => c.status === 'Prospect').length;

  const { phase, validation } = importState;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds} sec`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const allFilteredSelected = filteredClients.length > 0 && filteredClients.every(c => selectedClientIds.includes(c.id));
  const someFilteredSelected = filteredClients.length > 0 && filteredClients.some(c => selectedClientIds.includes(c.id)) && !allFilteredSelected;

  /**
 * Executes operations logic for handleSelectAllToggle.
 *
 * 
 * @returns State operations sequence.
 */
const handleSelectAllToggle = () => {
    if (allFilteredSelected) {
      const filteredIds = filteredClients.map(c => c.id);
      setSelectedClientIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const filteredIds = filteredClients.map(c => c.id);
      setSelectedClientIds(prev => {
        const newSelection = [...prev];
        filteredIds.forEach(id => {
          if (!newSelection.includes(id)) newSelection.push(id);
        });
        return newSelection;
      });
    }
  };

  /**
 * Executes operations logic for handleSelectClientToggle.
 *
 * @param id: string
 * @returns State operations sequence.
 */
const handleSelectClientToggle = (id: string) => {
    setSelectedClientIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className={styles.text_52}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.container_53}>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className={styles.div_54}>
          <div className={styles.container_55}>
            <div>
              <h1 className={styles.text_56}>CPST Master Registry</h1>
              <p className={styles.table_57}>
                Daniel Padua | Client & Beneficiary Prospect Servicing Tracker
              </p>
            </div>
            <div className={styles.container_58}>
              {selectedClientIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className={styles.table_59}
                >
                  <Trash2 size={13} />
                  Delete Selected ({selectedClientIds.length})
                </button>
              )}
              <button
                onClick={handleOpenAddModal}
                className={styles.table_60}
              >
                <Plus size={14} />
                Register Client
              </button>
            </div>
          </div>

          <div className={styles.container_61}>
            <div className={styles.container_62}>
              {[
                { label: 'TOTAL TRACKED', count: totalCount, link: 'TOTAL', color: 'text-foreground', icon: Users, isYellowBorder: true },
                { label: 'SERVICED CLIENTS', count: servicedCount, link: 'SERVICED ↗', color: 'text-green-600 dark:text-green-400', icon: CheckCircle2 },
                { label: 'HOT LEADS', count: leadCount, link: 'HOT ↗', color: 'text-[#A97800] dark:text-[#F4C542]', icon: Star },
                { label: 'PROSPECTS', count: prospectCount, link: 'PROSPECTS ↗', color: 'text-blue-500 dark:text-blue-400', icon: Target },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={i}
                    className={`${styles.card_227} ${
                      stat.isYellowBorder ? 'border-[#F4C542]/40 ring-1 ring-[#F4C542]/10' : 'border-border'
                    } flex flex-col justify-between`}
                  >
                    <div className={styles.table_63}>
                      <span>{stat.label}</span>
                      <Icon size={12} className={styles.text_64} />
                    </div>
                    <div className={styles.container_65}>
                      <span className={styles.text_66}>{stat.count}</span>
                      <span className={`${styles.table_228} ${
                        stat.link.includes('↗') ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                      }`}>{stat.link}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.card_67}>
              <div>
                <div className={styles.container_68}>
                  <FileSpreadsheet size={15} className={styles.text_69} />
                  <h3 className={styles.table_70}>Client Import</h3>
                </div>
                <p className={styles.text_71}>
                  Upload Excel, CSV, PDF or DOCX files to automatically register multiple clients at once.
                </p>
              </div>
              <button
                onClick={handleOpenImportModal}
                className={styles.table_72}
              >
                <Upload size={14} />
                Upload Files
              </button>
            </div>
          </div>

          <div className={styles.card_73}>
            <div className={styles.container_74}>
              <Search className={styles.text_75} />
              <input
                type="text"
                placeholder="Search by name, relation or annotation..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={styles.text_76}
              />
            </div>
            <div className={styles.container_77}>
              <div className={styles.container_78}>
                <Filter size={13} className={styles.text_79} />
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className={styles.card_80}
                >
                  <option value="ALL">All Months</option>
                  {monthsList.map(m => (
                    <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className={styles.card_81}
              >
                <option value="ALL">All Statuses</option>
                <option value="Prospect">Prospect</option>
                <option value="Serviced">Serviced</option>
                <option value="Lead">Lead</option>
              </select>
              <div className={styles.container_82}>
                <ArrowUpDown size={13} className={styles.text_83} />
                <select
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value as SortOption)}
                  className={styles.card_84}
                >
                  <option value="birthday-earliest">Birthday (Earliest)</option>
                  <option value="birthday-latest">Birthday (Latest)</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="newest">Newest Added</option>
                  <option value="oldest">Oldest Added</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.card_85}>
            <div className={styles.div_86}>
              <table className={styles.text_87}>
                <thead>
                  <tr className={styles.table_88}>
                    <th className={styles.text_89}>#</th>
                    <th className={styles.text_90}>
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        ref={el => {
                          if (el) el.indeterminate = someFilteredSelected;
                        }}
                        onChange={handleSelectAllToggle}
                        className={styles.text_91}
                      />
                    </th>
                    <th className={styles.div_92}>Client Name / Beneficiary Name</th>
                    <th className={styles.text_93}>Month — Birthdate</th>
                    <th className={styles.text_94}>Age</th>
                    <th className={styles.text_95}>Actions</th>
                  </tr>
                </thead>
                <tbody className={styles.div_96}>
                  {monthsList.map(month => {
                    const monthClients = groupedClients[month] || [];
                    if (monthClients.length === 0) return null;
                    return (
                      <React.Fragment key={month}>
                        <tr className={styles.text_97}>
                          <td colSpan={6} className={styles.table_98}>
                            {month}
                          </td>
                        </tr>
                        {monthClients.map(client => {
                          const ageStr = calculateAge(client.birthdate);
                          const isSpecialAge = ageStr.includes('mos') || ageStr === 'Newborn';
                          const isClientSelected = selectedClientIds.includes(client.id);
                          const clientNumber = renderedClients.findIndex(c => c.id === client.id) + 1;
                          return (
                            <tr key={client.id} className={`${styles.table_99} group`}>
                              <td className={styles.text_100}>
                                {clientNumber}
                              </td>
                              <td className={styles.text_101}>
                                <input
                                  type="checkbox"
                                  checked={isClientSelected}
                                  onChange={() => handleSelectClientToggle(client.id)}
                                  className={styles.text_102}
                                />
                              </td>
                              <td className={styles.div_103}>
                                <div className={styles.container_104}>
                                  <span
                                    className={`${styles.div_229} ${client.status === 'Serviced' ? 'bg-green-500' : client.status === 'Lead' ? 'bg-[#F4C542]' : 'bg-blue-500'
                                      }`}
                                    title={client.status}
                                  />
                                  <span className={styles.text_105}>{client.name}</span>
                                  {client.relationship && (
                                    <span className={styles.text_106}>
                                      {client.relationship}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className={styles.text_107}>
                                {formatDateDisplay(client.birthdate)}
                              </td>
                              <td className={styles.text_108}>
                                <span className={isSpecialAge ? 'text-[#A97800] dark:text-[#F4C542]' : ''}>{ageStr}</span>
                              </td>
                              <td className={styles.text_109}>
                                <div className={`${styles.table_110} group`}>
                                  <button
                                    onClick={() => handleOpenEditModal(client)}
                                    className={styles.table_111}
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(client.id)}
                                    className={styles.table_112}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                  {filteredClients.length === 0 && (
                    <tr>
                      <td colSpan={6} className={styles.text_113}>
                        No clients found matching the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className={styles.container_114}>
          <div className={styles.card_115}>
            <div className={styles.container_116}>
              <button
                onClick={() => setIsModalOpen(false)}
                className={styles.table_117}
              >
                <X size={16} />
              </button>
              <div className={styles.div_118}>
                <h2 className={styles.text_119}>
                  {editingClient ? 'Edit Client Details' : 'Register New Client'}
                </h2>
                <p className={styles.text_120}>
                  {editingClient ? 'Modify registry data parameters' : 'Onboard client into the prospect directory'}
                </p>
              </div>
              <form id="client-form" onSubmit={handleSubmit} className={styles.div_121}>
                <div>
                  <label className={styles.table_122}>Client Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Maria Jenny De Leon Teves"
                    required
                    className={styles.text_123}
                  />
                </div>
                <div>
                  <label className={styles.table_124}>Beneficiary Name / Relation</label>
                  <input
                    type="text"
                    value={formData.relationship}
                    onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                    placeholder="e.g. Jhon Michael Teves' Mother"
                    className={styles.text_125}
                  />
                </div>
                <div className={styles.container_126}>
                  <div>
                    <label className={styles.table_127}>Birth Date *</label>
                    <input
                      type="date"
                      value={formData.birthdate}
                      onChange={e => setFormData({ ...formData, birthdate: e.target.value })}
                      required
                      className={styles.text_128}
                    />
                  </div>
                  <div>
                    <label className={styles.table_129}>Status *</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as Client['status'] })}
                      className={styles.text_130}
                    >
                      <option value="Prospect">Prospect</option>
                      <option value="Lead">Hot Lead</option>
                      <option value="Serviced">Serviced</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={styles.table_131}>Annotation Description</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add operational notes or additional metadata..."
                    rows={4}
                    className={styles.text_132}
                  />
                </div>
              </form>
            </div>
            <div className={styles.container_133}>
              <button
                type="submit"
                form="client-form"
                className={styles.table_134}
              >
                {editingClient ? 'Save Changes' : 'Confirm Registration'}
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={styles.table_135}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className={styles.container_136}>
          <div className={styles.card_137}>
            <div className={styles.div_138}>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setShowInvalidModal(false);
                }}
                className={styles.table_139}
              >
                <X size={16} />
              </button>
              <div className={styles.div_140}>
                <h2 className={styles.text_141}>Import Client Records</h2>
                <p className={styles.text_142}>
                  Import multiple clients using Excel, CSV, Word or PDF.
                </p>
              </div>

              {phase === 'idle' && (
                <div className={styles.div_143}>
                  <div className={styles.container_144}>
                    {[
                      { ext: '.xlsx', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60' },
                      { ext: '.xls', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60' },
                      { ext: '.csv', color: 'text-[#A97800] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60' },
                      { ext: '.pdf', color: 'text-red-700 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60' },
                      { ext: '.docx', color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60' }
                    ].map(item => (
                      <span key={item.ext} className={`${styles.text_230} ${item.color}`}>
                        {item.ext}
                      </span>
                    ))}
                  </div>
                  <div
                    onDrop={handleDrop}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`${styles.table_231} ${isDragging ? 'border-[#F4C542] bg-[#F4C542]/5' : 'border-[#F4C542]/30 bg-[#FAF9F5]/30 dark:bg-muted/5 hover:border-[#F4C542] hover:bg-[#FAF9F5]/70 dark:hover:bg-muted/10'}`}
                  >
                    <Upload size={28} className={styles.text_145} />
                    <p className={styles.text_146}>Choose file or drag & drop</p>
                    <p className={styles.text_147}>Excel, CSV, Word, or PDF</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,.docx,.pdf"
                      onChange={handleFileChange}
                      className={styles.div_148}
                    />
                  </div>
                </div>
              )}

              {phase === 'reading' && (
                <div className={styles.text_149}>
                  <Loader2 size={32} className={styles.text_150} />
                  <span className={styles.text_151}>Reading {importState.fileName}…</span>
                </div>
              )}

              {phase === 'preview' && validation && (
                <div className={styles.div_152}>
                  <div className={styles.container_153}>
                    <FileSpreadsheet size={16} className={styles.text_154} />
                    <div className={styles.div_155}>
                      <p className={styles.table_156}>{importState.fileName}</p>
                      <p className={styles.text_157}>{validation.total} records detected</p>
                    </div>
                  </div>

                  <div className={styles.container_158}>
                    <div className={styles.text_159}>
                      <p className={styles.text_160}>{validation.valid.length}</p>
                      <p className={styles.table_161}>Valid</p>
                    </div>
                    <div className={styles.text_162}>
                      <p className={styles.text_163}>{validation.duplicates.length}</p>
                      <p className={styles.table_164}>Duplicate</p>
                    </div>
                    <button
                      onClick={() => validation.invalid.length > 0 && setShowInvalidModal(true)}
                      className={`${styles.table_232} ${validation.invalid.length > 0 ? 'border-red-500/20 hover:bg-red-500/20 cursor-pointer' : 'border-red-500/5 opacity-60'}`}
                    >
                      <p className={styles.text_165}>{validation.invalid.length}</p>
                      <p className={styles.table_166}>Invalid</p>
                      {validation.invalid.length > 0 && (
                        <p className={styles.text_167}>View Details →</p>
                      )}
                    </button>
                  </div>

                  {showPreview && validation.valid.length > 0 && (
                    <div className={styles.div_168}>
                      <div className={styles.div_169}>
                        <p className={styles.table_170}>Preview — First 5 Records</p>
                      </div>
                      <div className={styles.div_171}>
                        {validation.valid.slice(0, 5).map((r, i) => (
                          <div key={i} className={styles.div_172}>
                            <p className={styles.table_173}>{r.name}</p>
                            <p className={styles.text_174}>{r.relationship || '—'} · {formatDateDisplay(r.birthdate)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={styles.container_175}>
                    {validation.valid.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowPreview(v => !v)}
                        className={styles.table_176}
                      >
                        <Eye size={14} />
                        {showPreview ? 'Hide' : 'Preview'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleResetImport}
                      className={styles.table_177}
                    >
                      Change File
                    </button>
                    {validation.valid.length > 0 && (
                      <button
                        type="button"
                        onClick={handleImportAll}
                        className={styles.table_178}
                      >
                        Import {validation.valid.length} Records
                      </button>
                    )}
                  </div>
                </div>
              )}

              {phase === 'importing' && (
                <div className={styles.div_179}>
                  <div className={styles.container_180}>
                    <Loader2 size={16} className={styles.text_181} />
                    <div className={styles.div_182}>
                      <p className={styles.text_183}>Importing Client Records</p>
                      <p className={styles.text_184}>{importProgress.current} / {importProgress.total} records</p>
                    </div>
                  </div>

                  <div className={styles.div_185}>
                    <div className={styles.text_186}>
                      <span>{importProgress.percent}%</span>
                      <span>{formatTime(importProgress.elapsed)} elapsed</span>
                      <span>{formatTime(importProgress.estimatedRemaining)} remaining</span>
                    </div>
                    <div className={styles.div_187}>
                      <div
                        className={styles.table_188}
                        style={{ width: `${importProgress.percent}%` }}
                      />
                    </div>
                  </div>

                  <div className={styles.card_189}>
                    <p className={styles.table_190}>Currently Importing</p>
                    <p className={styles.text_191}>{importProgress.currentName || 'Preparing...'}</p>
                  </div>

                  <div className={styles.div_192}>
                    <p className={styles.table_193}>Activity Log</p>
                    <div className={styles.text_194}>
                      {importProgress.logs.slice(-10).map((log, idx) => (
                        <div key={idx} className={styles.container_195}>
                          {log.type === 'success' && <Check size={12} className={styles.text_196} />}
                          {log.type === 'duplicate' && <AlertTriangle size={12} className={styles.text_197} />}
                          {log.type === 'invalid' && <X size={12} className={styles.text_198} />}
                          <span className={log.type === 'success' ? 'text-green-600 dark:text-green-400' :
                            log.type === 'duplicate' ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-red-600 dark:text-red-400 font-semibold'}>
                            {log.name}
                          </span>
                          <span className={styles.text_199}>—</span>
                          <span className={styles.text_200}>{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {phase === 'done' && validation && (
                <div className={styles.div_201}>
                  <div className={styles.container_202}>
                    <CheckCircle2 size={16} className={styles.text_203} />
                    <div>
                      <p className={styles.text_204}>Import Completed</p>
                      <p className={styles.text_205}>
                        {importState.importedCount} imported · {validation.duplicates.length} duplicates skipped · {validation.invalid.length} invalid skipped
                      </p>
                      <p className={styles.text_206}>
                        Time: {formatTime(importProgress.elapsed)}
                      </p>
                    </div>
                  </div>
                  <div className={styles.container_207}>
                    {validation.invalid.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowInvalidModal(true)}
                        className={styles.table_208}
                      >
                        <AlertCircle size={14} />
                        View Invalid Records
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleResetImport}
                      className={styles.table_209}
                    >
                      Import Another File
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsImportModalOpen(false)}
                      className={styles.table_210}
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              )}

              {phase === 'error' && (
                <div className={styles.div_211}>
                  <div className={styles.container_212}>
                    <AlertCircle size={16} className={styles.text_213} />
                    <div>
                      <p className={styles.text_214}>Failed to Read File</p>
                      <p className={styles.text_215}>{importState.errorMessage}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetImport}
                    className={styles.table_216}
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showInvalidModal && validation && (
        <InvalidRecordsModal
          invalidRecords={validation.invalid}
          onClose={() => setShowInvalidModal(false)}
        />
      )}

      {confirmModal.isOpen && (
        <div className={styles.container_217}>
          <div className={styles.text_218}>
            <h2 className={styles.table_219}>
              Confirm Action
            </h2>
            <p className={styles.text_220}>
              {confirmModal.message}
            </p>
            <div className={styles.container_221}>
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className={styles.table_222}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className={styles.table_223}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
