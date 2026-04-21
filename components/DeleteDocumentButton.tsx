"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface DeleteDocumentButtonProps {
  documentId: string;
}

export default function DeleteDocumentButton({ documentId }: DeleteDocumentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete document");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-brand-grey hover:text-red-500 hover:bg-brand-red/10"
      onClick={handleDelete}
      disabled={isLoading}
      title="Delete document"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
