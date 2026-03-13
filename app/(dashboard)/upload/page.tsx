"use client";

import { UploadBox } from "@/components/ui/UploadBox";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = () => {
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      alert("PDF processing simulated based on architecture.");
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Upload PDF</h1>
        <p className="text-brand-grey flex items-center">
          Upload a document to generate your AI video project.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!file ? (
            <UploadBox onFileSelect={(f) => setFile(f)} />
          ) : (
            <div className="p-4 border border-brand-grey/20 rounded-lg flex items-center justify-between bg-brand-grey/5">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-brand-red" />
                <div>
                  <p className="font-medium text-sm text-white">{file.name}</p>
                  <p className="text-xs text-brand-grey">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                Remove
              </Button>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button 
              disabled={!file || isProcessing} 
              onClick={handleProcess}
              className="w-full sm:w-auto"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessing ? "Processing..." : "Generate Video"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
