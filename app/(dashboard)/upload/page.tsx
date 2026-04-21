"use client";

import { UploadBox } from "@/components/ui/UploadBox";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useState, Suspense } from "react";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function UploadContent() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("projectId");

  const handleUpload = async () => {
    if (!file || !projectId) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/projects/${projectId}`);
        router.refresh();
      } else {
        setError(data.error || "Failed to upload file");
        setIsUploading(false);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred during upload");
      setIsUploading(false);
    }
  };

  if (!projectId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="rounded-full bg-brand-red/10 p-3">
            <AlertCircle className="h-6 w-6 text-brand-red" />
          </div>
          <h2 className="text-xl font-semibold text-white">No Project Selected</h2>
          <p className="text-brand-grey text-sm max-w-sm">
            Please select or create a project first before uploading a document.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Document</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
            {error}
          </div>
        )}

        {!file ? (
          <UploadBox onFileSelect={(f) => setFile(f)} isUploading={false} />
        ) : (
          <div className="p-4 border border-brand-grey/20 rounded-lg flex items-center justify-between bg-brand-grey/5">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-brand-red" />
              <div>
                <p className="font-medium text-sm text-white">{file.name}</p>
                <p className="text-xs text-brand-grey">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFile(null)}
              disabled={isUploading}
            >
              Remove
            </Button>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button 
            disabled={!file || isUploading} 
            onClick={handleUpload}
            className="w-full sm:w-auto bg-brand-red hover:bg-brand-red/90 text-white"
          >
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? "Uploading to secure storage..." : "Upload & Analyze PDF"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UploadPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Upload PDF</h1>
        <p className="text-brand-grey flex items-center">
          Upload a document to generate your AI video project.
        </p>
      </div>

      <Suspense fallback={
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-red" />
        </div>
      }>
        <UploadContent />
      </Suspense>
    </div>
  );
}
