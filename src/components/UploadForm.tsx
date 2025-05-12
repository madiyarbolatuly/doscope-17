
import React, { useState } from "react";
import axios from "axios";
import { DOCUMENT_ENDPOINTS } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";

interface UploadFormProps {
  onSuccess?: () => void;
}

export function UploadForm({ onSuccess }: UploadFormProps) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [folder, setFolder] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!files?.length) {
      return toast({
        title: "Error",
        description: "Please select at least one file",
        variant: "destructive"
      });
    }
    
    setIsUploading(true);
    const form = new FormData();
    Array.from(files).forEach(f => form.append("files", f));

    try {
      // Get the auth token for authorization
      const token = localStorage.getItem('authToken');
      
      // Send the API request with folder as query parameter
      let url = DOCUMENT_ENDPOINTS.UPLOAD;
      if (folder) {
        url = `${url}?folder=${encodeURIComponent(folder)}`;
      }
      
      const res = await axios.post(url, form, {
        headers: { 
          "Content-Type": "multipart/form-data",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });
      
      toast({
        title: "Success",
        description: `Successfully uploaded ${files.length} ${files.length === 1 ? 'file' : 'files'}`,
      });
      
      // Reset form
      setFiles(null);
      setFolder("");
      
      // Notify parent component
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.response?.data?.detail || err.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="files">Select Files</Label>
            <Input 
              id="files" 
              type="file" 
              multiple 
              onChange={e => setFiles(e.target.files)}
              disabled={isUploading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="folder">Folder (optional)</Label>
            <Input
              id="folder"
              type="text"
              placeholder="e.g., reports/2023"
              value={folder}
              onChange={e => setFolder(e.target.value)}
              disabled={isUploading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
