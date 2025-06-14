import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { DOCUMENT_ENDPOINTS } from "@/config/api";

export type DocumentStatus = "public" | "private" | "shared" | "deleted" | "archived" | "pending" | "approved" | "rejected";

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

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  modified: string;
  owner: string;
  category: string;
  archived: boolean;
  starred: boolean;
}

export function useDocuments(category?: string, status?: string) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [totalCount, setTotalCount] = useState(0);


  const fetchDocuments = useCallback(async (limit = 10, offset = 0) => {
    setLoading(true);
    setError(undefined);

    try {
      let url = DOCUMENT_ENDPOINTS.METADATA;
      const params = new URLSearchParams();

      if (category) params.append('category', category);
      if (status) params.append('status', status);

      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      url = `${url}?${params.toString()}`;

      // Get the auth token from localStorage
      const token = localStorage.getItem('authToken');

      const response = await axios.get<Record<string, DocumentMeta[]>>(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      // Extract documents from the response
      const docsArray: DocumentMeta[] = [];
      let count = 0;

      Object.values(response.data).forEach(docArray => {
        if (Array.isArray(docArray)) {
          docsArray.push(...docArray);
          count += docArray.length;
        }
      });

      const transformedDocuments: Document[] = docsArray.map((doc: DocumentMeta) => ({
        id: doc.id,
        name: doc.name,
        type: doc.file_type || "unknown",
        size: doc.size ? `${doc.size} bytes` : "Unknown",
        modified: doc.created_at,
        owner: doc.owner_id,
        category: doc.categories?.[0] || "uncategorized",
        archived: doc.status === 'archived',
        starred: false, // or set your own logic here if needed
      }));

      setDocs(transformedDocuments);
      setTotalCount(count);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        console.error("Error fetching documents:", err);
      } else {
        setError("An unknown error occurred.");
        console.error("Error fetching documents:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [category, status]);

  useEffect(() => {
    fetchDocuments();
  }, [category, status, fetchDocuments]);

  return { docs, loading, error, totalCount, refetch: fetchDocuments };
}

// Hook for archived documents
export function useArchivedDocuments() {
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const fetchArchivedDocuments = async () => {
    setLoading(true);
    setError(undefined);
    
    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      const response = await axios.get(DOCUMENT_ENDPOINTS.ARCHIVE_LIST, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      setDocs(response.data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching archived documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedDocuments();
  }, []);

  return { docs, loading, error, refetch: fetchArchivedDocuments };
}

// Function to archive a document
export const archiveDocument = async (fileName: string) => {
  const token = localStorage.getItem('authToken');
  
  const response = await axios.post(
    DOCUMENT_ENDPOINTS.ARCHIVE(fileName),
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }
  );
  
  return response.data;
};

// Function to unarchive a document
export const unarchiveDocument = async (fileName: string) => {
  const token = localStorage.getItem('authToken');
  
  const response = await axios.post(
    DOCUMENT_ENDPOINTS.UNARCHIVE(fileName),
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }
  );
  
  return response.data;
};
