
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/SearchBar';
import { useNavigate } from 'react-router-dom';
import { Check, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { API_ROOT } from '@/config/api';
import axios from 'axios';
import { DocumentList } from '@/components/DocumentList';
import { useDocuments, DocumentMeta } from '@/hooks/useDocuments';

const Approvals = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({});
  
  // Get docs of appropriate status
  const { docs, loading, error, refetch } = useDocuments(undefined, activeTab === 'all' ? undefined : activeTab);

  const filteredApprovals = docs.filter(doc => {
    return doc.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Type guard helpers
  const getStatus = (doc: any) => doc.status ?? "pending";
  const getCreatedAt = (doc: any) => doc.created_at || doc.modified || '';
  const getOwner = (doc: any) => doc.owner_id || doc.owner || "-";

  const handleDocumentClick = (document: DocumentMeta) => {
    // This expects an `id` to exist
    navigate(`/document/${document.id}`);
  };

  const handleApprove = async (id: string) => {
    setProcessingIds(prev => ({ ...prev, [id]: true }));
    try {
      await axios.post(`${API_ROOT}/docs/${id}/approve`);
      toast({
        title: "Document approved",
        description: "The document has been successfully approved",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve document",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id: string) => {
    setProcessingIds(prev => ({ ...prev, [id]: true }));
    try {
      await axios.post(`${API_ROOT}/docs/${id}/reject`);
      toast({
        title: "Document rejected",
        description: "The document has been rejected",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject document",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => ({ ...prev, [id]: false }));
    }
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
              <Badge variant="secondary" className="ml-2">
                {docs.filter(a => (a.status ?? 'pending') === "pending").length}
              </Badge>
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
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredApprovals.length > 0 ? (
                  filteredApprovals
                    .filter(doc => (doc.status ?? 'pending') === "pending")
                    .map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border-b last:border-0">
                        <div className="flex-1 cursor-pointer" onClick={() => handleDocumentClick(doc)}>
                          <h3 className="font-medium">{doc.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Запрошено: {new Date(getCreatedAt(doc)).toLocaleDateString()} от {getOwner(doc)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600" 
                            onClick={() => handleApprove(doc.id)}
                            disabled={processingIds[doc.id]}
                          >
                            {processingIds[doc.id] ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            Утвердить
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600" 
                            onClick={() => handleReject(doc.id)}
                            disabled={processingIds[doc.id]}
                          >
                            {processingIds[doc.id] ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <X className="h-4 w-4 mr-1" />
                            )}
                            Отклонить
                          </Button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    {error ? `Error: ${error}` : "Нет ожидающих документов"}
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
                {/* DocumentList expects props matching DocumentMeta structure */}
                <DocumentList status="approved" />
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
                <DocumentList status="rejected" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Approvals;
