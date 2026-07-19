import { supabase } from "@/app/lib/supabase/client";
import { Database } from "@/lib/database.types";
import { ServiceResult } from "./clientService";

export type ClientPolicyCardRow = Database['public']['Tables']['client_policy_cards']['Row'];
export type ClientPolicyCardInsert = Database['public']['Tables']['client_policy_cards']['Insert'];
export type ClientPolicyCardUpdate = Database['public']['Tables']['client_policy_cards']['Update'];

export const clientPolicyService = {
  async getPolicyCards(): Promise<ServiceResult<ClientPolicyCardRow[]>> {
    try {
      const { data, error } = await supabase
        .from("client_policy_cards")
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

  async getPolicyCardById(id: string): Promise<ServiceResult<ClientPolicyCardRow>> {
    try {
      const { data, error } = await supabase
        .from("client_policy_cards")
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

  async getPolicyCardByClientId(clientId: string): Promise<ServiceResult<ClientPolicyCardRow>> {
    try {
      const { data, error } = await supabase
        .from("client_policy_cards")
        .select("*")
        .eq("client_id", clientId)
        .single();

      if (error) return { data: null, error: new Error(error.message) };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  async createPolicyCard(card: ClientPolicyCardInsert): Promise<ServiceResult<ClientPolicyCardRow>> {
    try {
      const { data, error } = await supabase
        .from("client_policy_cards")
        .insert([card])
        .select()
        .single();

      if (error) return { data: null, error: new Error(error.message) };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  async updatePolicyCard(id: string, updates: ClientPolicyCardUpdate): Promise<ServiceResult<ClientPolicyCardRow>> {
    try {
      const { data, error } = await supabase
        .from("client_policy_cards")
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

  async deletePolicyCard(id: string): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase
        .from("client_policy_cards")
        .delete()
        .eq("id", id);

      if (error) return { data: null, error: new Error(error.message) };
      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }
};
