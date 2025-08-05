import axios from 'axios';
import { API_ROOT } from '@/config/api';

// Archive a document
export const archiveDocument = async (fileName: string, token: string) => {
  try {
    const response = await axios.post(
      `${API_ROOT}/metadata/archive/${encodeURIComponent(fileName)}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      throw new Error('Document is already archived');
    }
    throw new Error(error.response?.data?.detail || 'Failed to archive document');
  }
};

// Unarchive a document
export const unarchiveDocument = async (fileName: string, token: string) => {
  try {
    const response = await axios.post(
      `${API_ROOT}/metadata/un-archive/${encodeURIComponent(fileName)}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      throw new Error('Document is not archived');
    }
    throw new Error(error.response?.data?.detail || 'Failed to unarchive document');
  }
};

// Get archived documents list
export const getArchivedDocuments = async (token: string) => {
  try {
    const response = await axios.get(
      `${API_ROOT}/metadata/archive/list`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to get archived documents');
  }
};

// Toggle star/favorite status
export const toggleStar = async (documentName: string, token: string) => {
  try {
    const response = await axios.put(
      `${API_ROOT}/metadata/${encodeURIComponent(documentName)}/star`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to toggle star status');
  }
};

// Rename document
export const renameDocument = async (documentId: string, newName: string, token: string) => {
  try {
    const response = await axios.put(
      `${API_ROOT}/metadata/${documentId}/rename`,
      { name: newName },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to rename document');
  }
};

// Delete document
export const deleteDocument = async (documentId: string, token: string) => {
  try {
    const response = await axios.delete(
      `${API_ROOT}/metadata/${documentId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to delete document');
  }
}; 