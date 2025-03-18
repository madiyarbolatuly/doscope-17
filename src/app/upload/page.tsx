
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FileUploader } from '@/components/FileUploader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

export default function FileUpload() {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const router = useRouter();
  
  const handleUploadComplete = (fileNames: string[]) => {
    setUploadedFiles(fileNames);
    setActiveTab('metadata');
  };
  
  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Documents</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Upload Files</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="outline" size="sm" onClick={handleGoBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Upload Documents</h1>
        </div>
      </div>
      
      <div className="bg-card rounded-lg border p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="upload" disabled={uploadedFiles.length > 0}>Upload Files</TabsTrigger>
            <TabsTrigger value="metadata" disabled={uploadedFiles.length === 0}>Edit Metadata</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload">
            <div className="max-w-2xl mx-auto">
              <FileUploader onUploadComplete={handleUploadComplete} />
            </div>
          </TabsContent>
          
          <TabsContent value="metadata">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Edit Document Metadata</h2>
              
              {uploadedFiles.map((fileName, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-medium text-lg mb-3">{fileName}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`title-${index}`}>Document Title</Label>
                      <Input 
                        id={`title-${index}`}
                        defaultValue={fileName.split('.')[0]}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`category-${index}`}>Category</Label>
                      <select 
                        id={`category-${index}`}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                      >
                        <option value="reports">Reports</option>
                        <option value="contracts">Contracts</option>
                        <option value="invoices">Invoices</option>
                        <option value="presentations">Presentations</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor={`tags-${index}`}>Tags (comma separated)</Label>
                      <Input 
                        id={`tags-${index}`}
                        placeholder="annual, financial, 2023"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`description-${index}`}>Description</Label>
                      <Input 
                        id={`description-${index}`}
                        placeholder="Brief description of this document"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox id={`favorite-${index}`} />
                    <Label htmlFor={`favorite-${index}`}>Add to favorites</Label>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => {
                    // In a real app, you'd save the metadata here
                    router.push('/');
                  }}
                >
                  Save and Finish
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
