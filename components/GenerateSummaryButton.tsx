"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GenerateSummaryButton({ projectId }: { projectId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/projects/${projectId}/generate-summary`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate summary");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleGenerate} 
      disabled={isLoading}
      className="bg-brand-red hover:bg-brand-red/90 text-white w-full"
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <PlayCircle className="mr-2 h-4 w-4" />
          RESUMEN
        </>
      )}
    </Button>
  );
}
