
import React, { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DocumentGrid } from '@/components/DocumentGrid';
import { Document } from '@/types/document';

const ArchivedPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [documents, setDocuments] = useState<Document[]>([]);
  
  return (
    <div className="p-6">
      <PageHeader 
        title="Архивированные документы"
        description="Документы, которые вы архивировали, будут отображаться здесь."
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      
      <div className="mt-4 animate-fade-in">
        <DocumentGrid 
          documents={documents} 
          onDocumentClick={() => {}}
          viewMode={viewMode}
          onDocumentSelect={() => {}}
        />
      </div>
    </div>
  );
};

export default ArchivedPage;
