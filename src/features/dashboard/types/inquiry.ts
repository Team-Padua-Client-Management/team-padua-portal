export interface ClientInquiry {
    id: string;
    user_id: string;
    processed_by?: string | null;

    cmgc_name?: string | null;

    inquiry_type?:
    | "Address Concern"
    | "Pending Response"
    | "Client Servicing"
    | string
    | null;

    inquiry_concern?: string | null;

    status?: "Pending" | "Done" | string | null;

    created_at?: string;
    updated_at?: string;
}