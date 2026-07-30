export interface ACICRFormRecord {
  id: string;
  client_id: string;
  client?: { client_name: string; policy_number: string | null; birthdate: string | null };
  status: string;
  created_at?: string;

  // A. General Info
  policy_number: string;
  last_name: string;
  first_name: string;
  middle_initial: string;
  company_name: string;

  // B. Address and Contact Info
  permanent_address: string;
  permanent_zip_code: string;
  present_address: string;
  present_zip_code: string;
  same_as_permanent: boolean;
  work_address: string;
  work_zip_code: string;
  other_address: string;
  other_zip_code: string;
  
  preferred_mailing_address: 'Permanent Home Address' | 'Present Home Address' | 'Work Address' | 'Other Address' | '';
  update_all_policies: 'Yes' | 'No' | '';

  contact_change_policy: boolean;
  contact_change_group: boolean;
  contact_change_plan: boolean;
  contact_change_mutual_fund: boolean;
  contact_change_all: boolean;

  mobile_phone: string;
  home_phone: string;
  work_phone: string;
  email_address: string;

  billing_preference: 'SMS + Electronic Copy' | 'SMS + Printed Copy' | 'Printed Copy only' | '';

  // C. Compliance
  citizenship_change: 'None' | 'Resident' | 'Non-Resident' | '';
  citizenship_country: string;
  residence_country: string;

  // D. Consent
  receive_offers: 'Yes' | 'No' | '';
}

export type AcicrRecord = ACICRFormRecord;
