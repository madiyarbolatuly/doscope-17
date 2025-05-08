
import { useState, useEffect } from "react";
import axios from "axios";
import { API_ROOT } from "@/config/api";

export interface DocumentMeta {
  id: string;
  name: string;
  file_path: string;
  uploaded_at: string;
  size: number;
  file_type: string;
  owner?: string;
  category?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export function useDocuments(category?: string, status?: string) {
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const fetchDocuments = async () => {
    setLoading(true);
    setError(undefined);
    
    try {
      let url = `${API_ROOT}/docs`;
      const params = new URLSearchParams();
      
      if (category) params.append('category', category);
      if (status) params.append('status', status);
      
      if (params.toString()) {
        url = `${url}?${params.toString()}`;
      }

      const response = await axios.get<{ response: DocumentMeta[] }>(url);
      setDocs(response.data.response);
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
