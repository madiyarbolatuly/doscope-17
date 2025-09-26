// archiveService.ts
import axios from 'axios';
import { DOCUMENT_ENDPOINTS } from '@/config/api';

const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });
const pickError = (e: any) =>
  (typeof e?.response?.data === 'string' ? e.response.data : e?.response?.data?.detail) ||
  e?.message || 'Request failed';

// Архивировать по ИМЕНИ
export const archiveDocument = async (fileName: string, token: string) => {
  try {
    const { data } = await axios.post(DOCUMENT_ENDPOINTS.ARCHIVE(fileName), {}, auth(token));
    return data;
  } catch (e: any) { throw new Error(pickError(e)); }
};

// Разархивировать по ИМЕНИ
export const unarchiveDocument = async (fileName: string, token: string) => {
  try {
    const { data } = await axios.post(DOCUMENT_ENDPOINTS.UNARCHIVE(fileName), {}, auth(token));
    return data;
  } catch (e: any) { throw new Error(pickError(e)); }
};

// Список архивных
export const getArchivedDocuments = async (token: string) => {
  try {
    const { data } = await axios.get(DOCUMENT_ENDPOINTS.ARCHIVE_LIST, auth(token));
    return data;
  } catch (e: any) { throw new Error(pickError(e)); }
};

// Избранное (по ID)
export const toggleStar = async (documentId: string | number, token: string) => {
  try {
    const { data } = await axios.put(DOCUMENT_ENDPOINTS.STAR(documentId), {}, auth(token));
    return data;
  } catch (e: any) { throw new Error(pickError(e)); }
};

// Переименовать (по ID)
export const renameDocument = async (documentId: string | number, newName: string, token: string) => {
  try {
    const { data } = await axios.put(
      DOCUMENT_ENDPOINTS.RENAME(documentId),
      { name: newName },
      { ...auth(token), headers: { ...auth(token).headers, 'Content-Type': 'application/json' } }
    );
    return data;
  } catch (e: any) { throw new Error(pickError(e)); }
};

// Удалить (в корзину) по ID
export const deleteDocument = async (documentId: string | number, token: string) => {
  try {
    const { data } = await axios.delete(DOCUMENT_ENDPOINTS.DELETE_BY_ID(documentId), auth(token));
    return data;
  } catch (e: any) { throw new Error(pickError(e)); }
};