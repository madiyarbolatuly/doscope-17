
import { useState, useEffect } from 'react';
import { Document, Role, DocumentType } from '@/types/document';
import { useToast } from '@/hooks/use-toast';

// For demo purposes - replace with your actual API URL
const API_URL = 'http://127.0.0.1:8000';

export function useRoleBasedDocuments() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch available roles from backend
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/roles`);
        if (!response.ok) {
          throw new Error('Failed to fetch roles');
        }
        const data = await response.json();
        
        // Convert backend roles to our Role interface
        const formattedRoles: Role[] = data.roles.map((role: string, index: number) => ({
          id: `role-${index}`,
          name: role
        }));
        
        setRoles(formattedRoles);
      } catch (err) {
        console.error('Error fetching roles:', err);
        setError('Failed to load roles');
        toast({
          title: "Error",
          description: "Failed to load roles. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // Fetch documents for the selected role
  const fetchDocumentsByRole = async (roleId: string) => {
    if (!roleId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/list/?role=${roleId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      const data = await response.json();
      
      // Convert backend files to our Document interface
      const formattedDocuments: Document[] = data.files.map((filename: string) => {
        const fileExtension = filename.split('.').pop()?.toLowerCase() || '';
        let type: DocumentType = 'folder';
        
        if (fileExtension === 'pdf') type = 'pdf';
        else if (['doc', 'docx'].includes(fileExtension)) type = 'doc';
        else if (['xls', 'xlsx'].includes(fileExtension)) type = 'xlsx';
        else if (['ppt', 'pptx'].includes(fileExtension)) type = 'ppt';
        else if (['png', 'jpg', 'jpeg', 'gif'].includes(fileExtension)) type = 'image';
        
        return {
          id: `${roleId}-${filename}`,
          name: filename,
          type,
          modified: new Date().toISOString(),
          owner: 'System',
          role: roleId,
          size: '0 KB' // We don't have size info from the backend
        };
      });
      
      setDocuments(formattedDocuments);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
      toast({
        title: "Error",
        description: "Failed to load documents. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle role selection
  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    if (roleId) {
      fetchDocumentsByRole(roleId);
    } else {
      setDocuments([]);
    }
  };

  // Upload file to selected role
  const uploadFile = async (file: File) => {
    if (!selectedRole || !file) {
      toast({
        title: "Cannot upload",
        description: "Please select a role and a file",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      setIsLoading(true);
      const response = await fetch(`${API_URL}/upload/?role=${selectedRole}`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      const data = await response.json();
      
      toast({
        title: "Success",
        description: data.message || "File uploaded successfully",
      });
      
      // Refresh document list
      fetchDocumentsByRole(selectedRole);
    } catch (err) {
      console.error('Error uploading file:', err);
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Download file from selected role
  const downloadFile = (filename: string) => {
    if (!selectedRole || !filename) return;
    window.open(`${API_URL}/download/?role=${selectedRole}&filename=${filename}`, '_blank');
  };

  // Delete file from selected role
  const deleteFile = async (filename: string) => {
    if (!selectedRole || !filename) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/delete/?role=${selectedRole}&filename=${filename}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
      
      const data = await response.json();
      
      toast({
        title: "File Deleted",
        description: data.message || "File deleted successfully",
      });
      
      // Refresh document list
      fetchDocumentsByRole(selectedRole);
    } catch (err) {
      console.error('Error deleting file:', err);
      toast({
        title: "Delete Failed",
        description: "Failed to delete file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    roles,
    selectedRole,
    documents,
    isLoading,
    error,
    handleRoleChange,
    uploadFile,
    downloadFile,
    deleteFile,
    fetchDocumentsByRole
  };
}
