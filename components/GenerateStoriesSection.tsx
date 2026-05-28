"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { BookOpen, CheckCircle, Circle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GenerateStoriesSection({ projectId, hasStory }: { projectId: string, hasStory: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/projects/${projectId}/generate-stories`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate stories");
      }

      const data = await res.json();
      setStories(data.stories || []);
      setSelectedStoryIndex(null);
    } catch (error) {
      console.error(error);
      alert("Failed to generate stories. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (selectedStoryIndex === null) return;
    
    try {
      setIsSaving(true);
      const res = await fetch(`/api/projects/${projectId}/save-story`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ story: stories[selectedStoryIndex] }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save story");
      }

      setStories([]); // Clear the list
      router.refresh(); // Refresh to show the saved story in the page
    } catch (error) {
      console.error(error);
      alert("Failed to save story. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (hasStory) {
    return null; // Don't show the generate button if a story is already selected
  }

  return (
    <div className="mt-6">
      {stories.length === 0 ? (
        <Button 
          onClick={handleGenerate} 
          disabled={isLoading}
          className="bg-brand-red hover:bg-brand-red/90 text-white w-full"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Generating stories...
            </>
          ) : (
            <>
              <BookOpen className="mr-2 h-4 w-4" />
              STORIES
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white mb-2">Select a Story Angle:</h4>
          <div className="space-y-3">
            {stories.map((story, index) => (
              <div 
                key={index}
                onClick={() => setSelectedStoryIndex(index)}
                className={`p-4 rounded-md cursor-pointer border transition-colors ${
                  selectedStoryIndex === index 
                    ? "bg-brand-red/10 border-brand-red" 
                    : "bg-brand-grey/5 border-brand-grey/10 hover:border-brand-grey/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="pr-4">
                    <h5 className="text-sm font-bold text-white mb-1">{story.title}</h5>
                    <p className="text-xs text-brand-grey mb-2"><span className="font-semibold text-brand-grey/80">Angle:</span> {story.narrativeAngle}</p>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <span className="px-2 py-0.5 bg-black/40 text-brand-grey rounded-full border border-brand-grey/20">
                        Audience: {story.targetAudience}
                      </span>
                      <span className="px-2 py-0.5 bg-black/40 text-brand-grey rounded-full border border-brand-grey/20">
                        Tone: {story.recommendedTone}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 mt-1">
                    {selectedStoryIndex === index ? (
                      <CheckCircle className="h-5 w-5 text-brand-red" />
                    ) : (
                      <Circle className="h-5 w-5 text-brand-grey/40" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setStories([])}
              disabled={isSaving}
              className="text-brand-grey border-brand-grey/20"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={selectedStoryIndex === null || isSaving}
              className="bg-brand-red hover:bg-brand-red/90 text-white"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Selected Story"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
