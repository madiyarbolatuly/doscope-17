import { useState } from 'react';
import { useShare } from '../hooks/useShare';
import { Document } from '@/types/document';

interface ShareModalProps {
  document: Document;
  onClose: () => void;
}

export function ShareModal({ document, onClose }: ShareModalProps) {
  const { createShareLink, shareWithUsers, loading, error } = useShare();
  const [visits, setVisits] = useState(1);
  const [emails, setEmails] = useState('');
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const handleGenerateLink = async () => {
    try {
      const { personal_url, share_this } = await createShareLink(document.id!, {
        visits,
        share_to: emails.split(',').map(e => e.trim()),
      });
      setLinkUrl(personal_url);
      setShareLink(typeof share_this === 'string' ? share_this : share_this?.shareable_link || null);
    } catch {
      // error state is in hook.error
    }
  };

  const handleShareUsers = async () => {
    try {
      await shareWithUsers(document.id!, {
        share_to: emails.split(',').map(e => e.trim()),
      });
      alert('Shared with users successfully');
    } catch {
      // error state is in hook.error
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center"
      onClick={e => e.currentTarget === e.target && onClose()}
    >
      <div className="bg-white rounded p-6 w-96">
        <h2 className="text-lg font-semibold mb-4">Поделиться “{document.name}”</h2>

        {/* Input: recipient emails */}
        <label className="block text-sm font-medium">Emails </label>
        <input
          type="text"
          value={emails}
          onChange={e => setEmails(e.target.value)}
          className="mt-1 mb-4 w-full border rounded px-2 py-1"
          placeholder="user1@mail.com, user2@mail.com"
        />

        {/* Time Limit */}
        <label className="block text-sm font-medium">Таймер (в час)</label>
        <input
          type="number"
          min={1}
          value={visits}
          onChange={e => setVisits(Number(e.target.value))}
          className="mt-1 mb-4 w-24 border rounded px-2 py-1"
          placeholder="e.g. 24"
        />

        {/* Actions */}
        <div className="flex justify-between">
          <button
            onClick={handleGenerateLink}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Создать ссылку  
          </button>
          <button
            onClick={handleShareUsers}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Поделиться 
            </button>
        </div>

        {/* Show generated link */}
        {linkUrl && (
          <div className="mt-4">
            <p className="text-sm">Персональная ссылка:</p>
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener"
              className="text-blue-600 underline break-all"
            >
              {linkUrl}
            </a>
          </div>
        )}
        {shareLink && (
          <div className="mt-2">
            <p className="text-sm">Общая ссылка для доступа:</p>
            <a
              href={shareLink}
              target="_blank"
              rel="noopener"
              className="text-blue-600 underline break-all"
            >
              {shareLink}
            </a>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600">Error: {error}</p>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
