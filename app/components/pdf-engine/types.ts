export type PdfFieldType =
  | 'text'
  | 'date'
  | 'textarea'
  | 'radio'
  | 'checkbox'
  | 'signature'
  | 'readonly';

export interface PdfFieldOption {
  label: string;
  value: any;
}

export interface FieldDependency {
  key: string;
  value?: any;
  isTruthy?: boolean;
}

export interface PdfFieldConfig {
  key: string;
  label: string;
  type: PdfFieldType;
  page: number; // 1-indexed (1, 2, ...)
  x: number; // PDF points (0..612 for US Letter)
  y: number; // PDF points (0..792 for US Letter, bottom-left origin)
  width: number; // PDF points
  height: number; // PDF points
  fontSize?: number;
  fontFamily?: string;
  placeholder?: string;
  options?: PdfFieldOption[];
  radioValue?: any; // value when this specific radio spot is checked
  dependsOn?: FieldDependency;
  sectionKey?: string;
  sectionTitle?: string;
  required?: boolean;
  readonly?: boolean;
  description?: string;
  mappedDbField?: string;
}

export interface FormSectionConfig {
  key: string;
  letter: string;
  title: string;
  fieldKeys: string[];
}

export interface PdfFormConfig {
  id: string;
  title: string;
  subtitle?: string;
  pdfTemplateUrl: string;
  pageWidth: number; // e.g. 612
  pageHeight: number; // e.g. 792
  totalPages: number;
  sections: FormSectionConfig[];
  fields: PdfFieldConfig[];
}

export type FieldValueMap = Record<string, any>;

export interface FieldInspectorData {
  field: PdfFieldConfig;
  value: any;
}

export type ViewMode = 'edit' | 'preview' | 'compare';
export type ThemeMode = 'light' | 'dark';

export interface ValidationItem {
  key: string;
  label: string;
  isValid: boolean;
  message?: string;
  sectionKey?: string;
}

