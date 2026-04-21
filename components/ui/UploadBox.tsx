"use client";

import * as React from "react"
import { cn } from "@/lib/utils"
import { UploadCloud } from "lucide-react"
import { useDropzone } from "react-dropzone"

export interface UploadBoxProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrop'> {
  onFileSelect?: (file: File) => void;
  isUploading?: boolean;
}

export function UploadBox({ className, onFileSelect, isUploading = false, ...props }: UploadBoxProps) {
  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && onFileSelect) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg transition-colors bg-brand-grey/5 relative overflow-hidden",
        isDragActive ? "border-brand-red bg-brand-red/5" : "border-brand-grey/20 hover:bg-brand-grey/10",
        isDragReject ? "border-red-500 bg-red-500/10" : "",
        isUploading ? "cursor-not-allowed opacity-70" : "cursor-pointer",
        className
      )}
      {...props}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
        {isUploading ? (
          <>
            <div className="w-10 h-10 mb-4 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
            <p className="mb-2 text-sm text-brand-grey">
              <span className="font-semibold text-white">Uploading document securely...</span>
            </p>
          </>
        ) : (
          <>
            <UploadCloud className={cn("w-10 h-10 mb-3", isDragReject ? "text-red-500" : "text-brand-grey")} />
            <p className="mb-2 text-sm text-brand-grey">
              <span className="font-semibold text-white">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-brand-grey">PDF documents only (MAX. 10MB)</p>
            {isDragReject && (
              <p className="text-sm font-semibold text-red-500 mt-2">File type not supported</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

