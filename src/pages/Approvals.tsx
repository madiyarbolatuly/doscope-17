
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/SearchBar';
import { Document } from '@/types/document';
import { useNavigate } from 'react-router-dom';
import { DocumentGrid } from '@/components/DocumentGrid';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock approval requests
const MOCK_APPROVALS: (Document & { status: 'pending' | 'approved' | 'rejected', requestDate: string })[] = [
  {
    id: '1',
    name: 'Annual Report 2023.pdf',
    type: 'pdf',
    size: '4.2 MB',
    modified: new Date(Date.now() - 3600000).toISOString(),
    owner: 'Alex Johnson',
    category: 'reports',
    status: 'pending',
    requestDate: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: '2',
    name: 'Project Proposal.doc',
    type: 'doc',
    size: '2.7 MB',
    modified: new Date(Date.now() - 86400000).toISOString(),
    owner: 'Sarah Miller',
    category: 'projects',
    status: 'pending',
    requestDate: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: '3',
    name: 'Financial Analysis.xlsx',
    type: 'xlsx',
    size: '1.8 MB',
    modified: new Date(Date.now() - 172800000).toISOString(),
    owner: 'David Chen',
    category: 'finance',
    status: 'approved',
    requestDate: new Date(Date.now() - 72 * 3600000).toISOString(),
  },
  {
    id: '4',
    name: 'Marketing Presentation.ppt',
    type: 'ppt',
    size: '5.3 MB',
    modified: new Date(Date.now() - 259200000).toISOString(),
    owner: 'Emily Wang',
    category: 'marketing',
    shared: true,
    status: 'rejected',
    requestDate: new Date(Date.now() - 96 * 3600000).toISOString(),
  },
];

const Approvals = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [viewMode] = useState<'grid' | 'list'>('list');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const navigate = useNavigate();

  const filteredApprovals = MOCK_APPROVALS.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = activeTab === 'all' || doc.status === activeTab;
    return matchesSearch && matchesStatus;
  });

  const handleDocumentClick = (document: Document) => {
    navigate(`/document/${document.id}`);
  };

  const handleApprove = (id: string) => {
    // In a real application, call API to approve the document
    console.log('Approving document:', id);
  };

  const handleReject = (id: string) => {
    // In a real application, call API to reject the document
    console.log('Rejecting document:', id);
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Утверждения документов</h1>
          <div className="w-1/3">
            <SearchBar query={searchQuery} setQuery={setSearchQuery} />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Ожидающие
              <Badge variant="secondary" className="ml-2">{MOCK_APPROVALS.filter(a => a.status === 'pending').length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved">Утвержденные</TabsTrigger>
            <TabsTrigger value="rejected">Отклоненные</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Ожидающие утверждения</CardTitle>
                <CardDescription>Документы, требующие вашего рассмотрения</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredApprovals.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border-b last:border-0">
                    <div className="flex-1 cursor-pointer" onClick={() => handleDocumentClick(doc)}>
                      <h3 className="font-medium">{doc.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Запрошено: {new Date(doc.requestDate).toLocaleDateString()} от {doc.owner}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-green-600" 
                        onClick={() => handleApprove(doc.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Утвердить
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600" 
                        onClick={() => handleReject(doc.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Отклонить
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredApprovals.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    Нет ожидающих документов
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Утвержденные документы</CardTitle>
                <CardDescription>Документы, которые вы утвердили</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentGrid 
                  documents={filteredApprovals} 
                  onDocumentClick={handleDocumentClick}
                  viewMode={viewMode}
                  selectedDocument={selectedDocument}
                  onDocumentSelect={setSelectedDocument}
                />
                {filteredApprovals.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    Нет утвержденных документов
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Отклоненные документы</CardTitle>
                <CardDescription>Документы, которые вы отклонили</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentGrid 
                  documents={filteredApprovals} 
                  onDocumentClick={handleDocumentClick}
                  viewMode={viewMode}
                  selectedDocument={selectedDocument}
                  onDocumentSelect={setSelectedDocument}
                />
                {filteredApprovals.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    Нет отклоненных документов
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Approvals;
