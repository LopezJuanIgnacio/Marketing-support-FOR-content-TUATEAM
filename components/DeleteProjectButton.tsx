"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        console.error("Failed to delete project");
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setIsOpen(true)}
        className="border-red-900/50 text-red-500 hover:bg-red-900/20 hover:text-red-400"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0a0a0a] border border-brand-grey/20 rounded-xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Delete Project?</h2>
            <p className="text-sm text-brand-grey mb-6">
              This action cannot be undone. This will permanently delete your project and all associated data.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleDelete}
                disabled={isLoading} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
