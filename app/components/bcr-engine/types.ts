export type BcrFieldType =
  | 'text'
  | 'date'
  | 'textarea'
  | 'radio'
  | 'checkbox'
  | 'signature'
  | 'select'
  | 'readonly';

export interface BcrFieldOption {
  label: string;
  value: any;
}

export interface BcrFieldDependency {
  key: string;
  value?: any;
  isTruthy?: boolean;
}

export interface BcrFieldConfig {
  key: string;
  label: string;
  type: BcrFieldType;
  page: number; // 1, 2, 3, 4
  x: number; // PDF points
  y: number; // PDF points (bottom-left origin)
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  placeholder?: string;
  options?: BcrFieldOption[];
  radioValue?: any;
  dependsOn?: BcrFieldDependency;
  sectionKey?: string;
  sectionTitle?: string;
  required?: boolean;
  readonly?: boolean;
  description?: string;
}

export interface BcrSectionConfig {
  key: string;
  letter: string;
  title: string;
  fieldKeys: string[];
}

export interface BcrFormConfig {
  id: string;
  title: string;
  subtitle?: string;
  pdfTemplateUrl: string;
  pageWidth: number; // 612
  pageHeight: number; // 792
  totalPages: number;
  sections: BcrSectionConfig[];
  fields: BcrFieldConfig[];
}

export type FieldValueMap = Record<string, any>;
export type ViewMode = 'edit' | 'preview';
