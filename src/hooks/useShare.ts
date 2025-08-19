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

  async function createShareLink(
    docId: string,
    params: CreateLinkParams
  ): Promise<{ personal_url: string; share_this: any }> {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/v2/share-link/${docId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err: any) {
      console.error('createShareLink error:', err);
      setError(err.message);
      // Return dummy successful response
      return {
        personal_url: '',
        share_this: null,
      };
    } finally {
      setLoading(false);
    }
  }

  async function shareWithUsers(
    docId: string,
    params: ShareUsersParams
  ): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/v2/sharing/share-link/${docId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err: any) {
      console.error('shareWithUsers error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  return { createShareLink, shareWithUsers, loading, error };
}
