
import axios from 'axios';
import { Document, CategoryType } from '@/types/document';
import { DOCUMENT_ENDPOINTS, API_ROOT } from '@/config/api';

export class DocumentApiService {
  private token: string | null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  private get headers() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async fetchDocuments(params?: { limit?: number; offset?: number; folderId?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());
    if (params?.folderId) queryParams.set('folder_id', params.folderId);

    const response = await fetch(`${DOCUMENT_ENDPOINTS.METADATA}?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    return response.json();
  }

  async uploadFiles(files: File[], folderId?: string) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file, file.name);
    });
    
    if (folderId) {
      formData.append('folder_id', folderId);
    }

    return axios.post(DOCUMENT_ENDPOINTS.UPLOAD, formData, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  async previewDocument(fileName: string) {
    const encoded = encodeURIComponent(fileName);
    const response = await fetch(DOCUMENT_ENDPOINTS.PREVIEW(encoded), {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    if (!response.ok) {
      throw new Error('Preview fetch failed');
    }

    return response.blob();
  }

  async downloadDocument(fileName: string) {
    const response = await fetch(DOCUMENT_ENDPOINTS.DOWNLOAD(fileName), {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  }

  async deleteDocument(fileName: string) {
    return axios.delete(DOCUMENT_ENDPOINTS.DELETE(fileName), {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
  }

  async updateMetadata(documentId: string, data: { name: string; tags?: string[]; categories?: string[] }) {
    return axios.put(`${API_ROOT}/metadata/${documentId}`, data, {
      headers: this.headers
    });
  }

  async toggleStar(documentId: string) {
    return fetch(`${API_ROOT}/metadata/${documentId}/star?repo_cls=document`, {
      method: 'PUT',
      headers: this.headers
    });
  }

  async archiveDocument(fileName: string) {
    return fetch(DOCUMENT_ENDPOINTS.ARCHIVE(fileName), {
      method: 'PUT',
      headers: this.headers
    });
  }

  async createFolder(name: string, parentId?: string) {
    return axios.post(`${API_ROOT}/folders`, {
      name,
      parent_id: parentId
    }, {
      headers: this.headers
    });
  }
}

export const documentApiService = new DocumentApiService();
