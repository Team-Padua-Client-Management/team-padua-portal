export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          client_code: string | null;
          client_name: string;
          relationship: string | null;
          policy_number: string | null;
          product: string | null;
          advisor: string | null;
          approval_date: string | null;
          annual_premium: number;
          mobile_number: string | null;
          email: string | null;
          address: string | null;
          beneficiary: string | null;
          fund_allocation: string | null;
          mode_of_payment: string | null;
          status: string;
          birthday: string | null;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clients']['Row']>;
      };
      client_policy_cards: {
        Row: {
          id: string;
          client_id: string;
          date_processed: string | null;
          digital_basic_id: string | null;
          digital_premium_id: string | null;
          hard_copy_id: string | null;
          processed_by_id: string | null;
          comments: string | null;
          signature_data: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['client_policy_cards']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['client_policy_cards']['Row']>;
      };
      premium_payments: {
        Row: {
          id: string;
          client_id: string;
          date_processed: string | null;
          ready_send_date: string | null;
          status_id: string | null;
          updated_by_id: string | null;
          sent_by_id: string | null;
          comments: string | null;
          signature_data: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['premium_payments']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['premium_payments']['Row']>;
      };
      social_visibility_records: {
        Row: {
          id: string;
          client_id: string;
          facebook_profile: string | null;
          instagram_profile: string | null;
          linkedin_profile: string | null;
          last_activity: string | null;
          visibility_status: 'Visible' | 'Inactive' | 'Private';
          notes: string | null;
          signature_data: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['social_visibility_records']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['social_visibility_records']['Row']>;
      };
      advisor_change_requests: {
        Row: {
          id: string;
          client_id: string;
          date_processed: string | null;
          progress_id: string | null;
          processed_by_id: string | null;
          comments: string | null;
          agent_confirmation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['advisor_change_requests']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['advisor_change_requests']['Row']>;
      };
      // Placeholder tables in DB
      beneficiary_change_requests: {
        Row: {
          id: string;
          client_id: string;
          status: string;
          date_submitted: string | null;
          comments: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['beneficiary_change_requests']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['beneficiary_change_requests']['Row']>;
      };
      fund_switching_requests: {
        Row: {
          id: string;
          client_id: string;
          date_processed: string | null;
          progress_id: string | null;
          processed_by_id: string | null;
          comments: string | null;
          signature_data: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['fund_switching_requests']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['fund_switching_requests']['Row']>;
      };
      fund_withdrawal_requests: {
        Row: {
          id: string;
          client_id: string;
          status: string;
          date_submitted: string | null;
          amount: number | null;
          comments: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['fund_withdrawal_requests']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['fund_withdrawal_requests']['Row']>;
      };
      auto_change_arrangements: {
        Row: {
          id: string;
          client_id: string;
          status: string;
          date_submitted: string | null;
          comments: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['auto_change_arrangements']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['auto_change_arrangements']['Row']>;
      };
      reinstatement_sro_requests: {
        Row: {
          id: string;
          client_id: string;
          status: string;
          date_submitted: string | null;
          comments: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reinstatement_sro_requests']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reinstatement_sro_requests']['Row']>;
      };
      reinstatement_pdi_requests: {
        Row: {
          id: string;
          client_id: string;
          status: string;
          date_submitted: string | null;
          comments: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reinstatement_pdi_requests']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reinstatement_pdi_requests']['Row']>;
      };
      advisor_daily_activities: {
        Row: {
          id: string;
          client_id: string;
          activity_date: string;
          activity_type: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['advisor_daily_activities']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['advisor_daily_activities']['Row']>;
      };
    };
  };
}
