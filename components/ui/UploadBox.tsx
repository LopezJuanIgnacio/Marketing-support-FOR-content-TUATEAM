"use client";

import * as React from "react"
import { cn } from "@/lib/utils"
import { UploadCloud } from "lucide-react"

export interface UploadBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  onFileSelect?: (file: File) => void;
}

export function UploadBox({ className, onFileSelect, ...props }: UploadBoxProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (onFileSelect) {
        onFileSelect(e.dataTransfer.files[0]);
      }
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors bg-brand-grey/5",
        isDragging ? "border-brand-red bg-brand-red/5" : "border-brand-grey/20 hover:bg-brand-grey/10",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      {...props}
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <UploadCloud className="w-10 h-10 mb-3 text-brand-grey" />
        <p className="mb-2 text-sm text-brand-grey">
          <span className="font-semibold text-white">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-brand-grey">PDF documents only (MAX. 10MB)</p>
      </div>
      <input type="file" className="hidden" accept=".pdf" onChange={(e) => {
        if (e.target.files && e.target.files.length > 0 && onFileSelect) {
          onFileSelect(e.target.files[0]);
        }
      }} />
    </div>
  )
}
