
import { useState, useEffect } from "react";
import axios from "axios";
import { DOCUMENT_ENDPOINTS } from "@/config/api";

export type DocumentStatus = "public" | "private" | "shared" | "deleted" | "archived";

export interface DocumentMeta {
  id: string;
  owner_id: string;
  name: string;
  file_path: string | null;
  created_at: string;
  size: number | null;
  file_type: string | null;
  tags: string[] | null;
  categories: string[] | null;
  status: DocumentStatus;
  file_hash: string | null;
  access_to: string[] | null;
}

export function useDocuments(category?: string, status?: string) {
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const fetchDocuments = async () => {
    setLoading(true);
    setError(undefined);
    
    try {
      let url = DOCUMENT_ENDPOINTS.METADATA;
      const params = new URLSearchParams();
      
      if (category) params.append('category', category);
      if (status) params.append('status', status);
      
      if (params.toString()) {
        url = `${url}?${params.toString()}`;
      }

      // Get the auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      const response = await axios.get<DocumentMeta[]>(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      setDocs(response.data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [category, status]);

  return { docs, loading, error, refetch: fetchDocuments };
}
