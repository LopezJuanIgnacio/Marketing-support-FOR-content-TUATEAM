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
        "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors bg-slate-50",
        isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:bg-slate-100",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      {...props}
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <UploadCloud className="w-10 h-10 mb-3 text-slate-400" />
        <p className="mb-2 text-sm text-slate-500">
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-slate-500">PDF documents only (MAX. 10MB)</p>
      </div>
      <input type="file" className="hidden" accept=".pdf" onChange={(e) => {
        if (e.target.files && e.target.files.length > 0 && onFileSelect) {
          onFileSelect(e.target.files[0]);
        }
      }} />
    </div>
  )
}
