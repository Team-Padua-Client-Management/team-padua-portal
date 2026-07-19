import { supabase } from "@/app/lib/supabase/client";
import { Database } from "@/lib/database.types";
import { ServiceResult } from "./clientService";

export type PremiumPaymentRow = Database['public']['Tables']['premium_payments']['Row'];
export type PremiumPaymentInsert = Database['public']['Tables']['premium_payments']['Insert'];
export type PremiumPaymentUpdate = Database['public']['Tables']['premium_payments']['Update'];

export const paymentService = {
  async getPayments(): Promise<ServiceResult<PremiumPaymentRow[]>> {
    try {
      const { data, error } = await supabase
        .from("premium_payments")
        .select(`
          *,
          client:clients(*)
        `)
        .order("created_at", { ascending: false });

      if (error) return { data: null, error: new Error(error.message) };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  async getPaymentById(id: string): Promise<ServiceResult<PremiumPaymentRow>> {
    try {
      const { data, error } = await supabase
        .from("premium_payments")
        .select(`
          *,
          client:clients(*)
        `)
        .eq("id", id)
        .single();

      if (error) return { data: null, error: new Error(error.message) };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  async createPayment(payment: PremiumPaymentInsert): Promise<ServiceResult<PremiumPaymentRow>> {
    try {
      const { data, error } = await supabase
        .from("premium_payments")
        .insert([payment])
        .select()
        .single();

      if (error) return { data: null, error: new Error(error.message) };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  async updatePayment(id: string, updates: PremiumPaymentUpdate): Promise<ServiceResult<PremiumPaymentRow>> {
    try {
      const { data, error } = await supabase
        .from("premium_payments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) return { data: null, error: new Error(error.message) };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  async deletePayment(id: string): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase
        .from("premium_payments")
        .delete()
        .eq("id", id);

      if (error) return { data: null, error: new Error(error.message) };
      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }
};
