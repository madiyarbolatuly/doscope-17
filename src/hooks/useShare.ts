import { useState } from 'react';

interface CreateLinkParams {
  visits: number;
  share_to: string[];
}
interface ShareUsersParams {
  share_to: string[];
}

export function useShare() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Creates a shareable link for a document.
   * POST /v2/share-link/:document
   */
  async function createShareLink(
    docId: string,
    params: CreateLinkParams
  ): Promise<{ personal_url: string; share_this: any }> {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`http://localhost:8000/v2/share-link/${docId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Shares a document with specific users (sends as attachment).
   * POST /v2/share/:document?notify=true
   */
  async function shareWithUsers(
    docId: string,
    params: ShareUsersParams
  ): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`http://localhost:8000/v2/share/${docId}?notify=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { createShareLink, shareWithUsers, loading, error };
}
