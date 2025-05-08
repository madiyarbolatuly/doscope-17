
import { useState, useEffect } from "react";
import axios from "axios";
import { API_ROOT } from "@/config/api";
import { Document } from "@/types/document";

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

  useEffect(() => {
    let url = `${API_ROOT}/docs`;
    const params = new URLSearchParams();
    
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    
    if (params.toString()) {
      url = `${url}?${params.toString()}`;
    }

    axios.get<{ response: DocumentMeta[] }>(url)
      .then(res => setDocs(res.data.response))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [category, status]);

  const refetch = () => {
    setLoading(true);
    let url = `${API_ROOT}/docs`;
    const params = new URLSearchParams();
    
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    
    if (params.toString()) {
      url = `${url}?${params.toString()}`;
    }

    axios.get<{ response: DocumentMeta[] }>(url)
      .then(res => setDocs(res.data.response))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  return { docs, loading, error, refetch };
}
