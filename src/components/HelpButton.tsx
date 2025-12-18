import React from 'react';
import { MessageCircleQuestion } from 'lucide-react';

const WHATSAPP_LINK = 'https://wa.me/87477087007?text=';

export const HelpButton: React.FC = () => {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      title="По всем техническим вопросам писать сюда"
      className="fixed bottom-6 right-6 z-[9999] flex items-center justify-center w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
    >
      <MessageCircleQuestion className="h-7 w-7" />
      <span className="absolute right-16 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Техническая поддержка
      </span>
    </a>
  );
};
