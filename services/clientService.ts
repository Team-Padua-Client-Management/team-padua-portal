import { supabase } from "@/app/lib/supabase/client";
import { Database } from "@/lib/database.types";

export type ClientRow = Database['public']['Tables']['clients']['Row'];
export type ClientInsert = Database['public']['Tables']['clients']['Insert'];
export type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

export const clientService = {
  async getClients(page = 1, limit = 10): Promise<ServiceResult<ClientRow[]>> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) return { data: null, error: new Error(error.message) };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  async getClientById(id: string): Promise<ServiceResult<ClientRow>> {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return { data: null, error: new Error(error.message) };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  async createClient(client: ClientInsert): Promise<ServiceResult<ClientRow>> {
    try {
      const { data, error } = await supabase
        .from("clients")
        .insert([client])
        .select()
        .single();

      if (error) return { data: null, error: new Error(error.message) };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  async updateClient(id: string, updates: ClientUpdate): Promise<ServiceResult<ClientRow>> {
    try {
      const { data, error } = await supabase
        .from("clients")
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

  async deleteClient(id: string): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) return { data: null, error: new Error(error.message) };
      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  async searchClients(query: string, page = 1, limit = 10): Promise<ServiceResult<{ clients: ClientRow[]; count: number }>> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Supabase text search or OR filtering
      let builder = supabase
        .from("clients")
        .select("*", { count: "exact" });

      if (query.trim()) {
        builder = builder.or(
          `client_name.ilike.%${query}%,policy_number.ilike.%${query}%,email.ilike.%${query}%,mobile_number.ilike.%${query}%,advisor.ilike.%${query}%`
        );
      }

      const { data, error, count } = await builder
        .order("client_name", { ascending: true })
        .range(from, to);

      if (error) return { data: null, error: new Error(error.message) };
      return { data: { clients: data || [], count: count || 0 }, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }
};
