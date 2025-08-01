import { useState } from 'react';
import { useShare } from '../hooks/useShare';
import { Document } from '@/types/document';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, X, Users, Link as LinkIcon, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ShareModalProps {
  document: Document;
  onClose: () => void;
}

export function ShareModal({ document, onClose }: ShareModalProps) {
  const { createShareLink, shareWithUsers, loading, error } = useShare();
  const [visits, setVisits] = useState(1);
  const [emails, setEmails] = useState('');
  const [note, setNote] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'email' | 'link'>('email');

  const handleGenerateLink = async () => {
    try {
      const { personal_url, share_this } = await createShareLink(
        document.id!,
        {
          visits,
          share_to: [], // по нажатию на link‑табе не нужно передавать emails
        }
      );
      setLinkUrl(personal_url);
      setShareLink(
        typeof share_this === 'string'
          ? share_this
          : share_this?.shareable_link || null
      );
    } catch {
      // error уже в hook.error
    }
  };

  const handleShareUsers = async () => {
    try {
      await shareWithUsers(document.id!, {
        share_to: emails
          .split(',')
          .map((e) => e.trim())
          .filter((e) => e),
      });
      onClose();
    } catch {
      // error уже в hook.error
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[500px] max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Поделиться "{document.name}"
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('email')}
            className={cn(
              'flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'email'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <Mail className="h-4 w-4 inline mr-2" />
            Электронная почта
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={cn(
              'flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'link'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <LinkIcon className="h-4 w-4 inline mr-2" />
            Ссылки
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Инфо-блок всегда */}
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              Участники проекта с правами просмотра или выше для общих элементов
            </span>
          </div>

          {activeTab === 'email' && (
            <>
              {/* Email Recipients */}
              <div>
                <Label htmlFor="recipients" className="text-sm font-medium">
                  Получатели *
                </Label>
                <Input
                  id="recipients"
                  type="text"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="Email через запятую"
                  className="mt-1"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <Label className="text-sm font-medium">Доступ истекает</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal mt-1',
                        !expiryDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiryDate
                        ? format(expiryDate, 'PPP')
                        : 'Выберите дату'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expiryDate}
                      onSelect={setExpiryDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Note */}
              <div>
                <Label htmlFor="note" className="text-sm font-medium">
                  Заметка
                </Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Текст письма"
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </>
          )}

          {activeTab === 'link' && (
            <div className="space-y-4">
              <Button
                onClick={handleGenerateLink}
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Создание...' : 'Создать ссылку'}
              </Button>

              {linkUrl && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium">
                    Персональная ссылка
                  </Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    <a
                      href={linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline text-sm break-all"
                    >
                      {linkUrl}
                    </a>
                  </div>
                </div>
              )}

              {shareLink && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium">
                    Ссылка общего доступа
                  </Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    <a
                      href={shareLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline text-sm break-all"
                    >
                      {shareLink}
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              Ошибка: {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center p-4 border-t bg-gray-50 space-x-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Отмена
          </Button>

          {activeTab === 'email' ? (
            <Button
              onClick={handleShareUsers}
              disabled={loading || !emails.trim()}
            >
              {loading ? 'Отправка...' : 'Отправить'}
            </Button>
          ) : (
            <Button
              onClick={handleGenerateLink}
              disabled={loading}
            >
              {loading ? 'Создание...' : 'Создать ссылку'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
