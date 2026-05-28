"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Film, PlayCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GenerateVideoSection({ 
  projectId, 
  initialVideoUrl 
}: { 
  projectId: string, 
  initialVideoUrl: string | null 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideoUrl);
  const router = useRouter();

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/projects/${projectId}/generate-video`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate video");
      }

      const data = await res.json();
      setVideoUrl(data.videoUrl);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to generate video. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-md bg-brand-grey/5 border border-brand-grey/10 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-white flex items-center">
          <Film className="mr-2 h-4 w-4 text-brand-red" />
          Final Video
        </h4>
      </div>

      <div className="space-y-4">
        {!videoUrl ? (
          <div className="bg-[#111] border border-brand-grey/20 rounded-md p-4">
            <p className="text-sm text-brand-grey mb-4">
              Generate the final video file by combining visual assets (AI), on-screen text, and synchronized narration.
            </p>
            
            <div className="bg-brand-red/10 border border-brand-red/20 rounded-md p-3 mb-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
              <div className="text-xs text-brand-grey leading-relaxed">
                <strong className="text-white block mb-1">Processing Time Notice</strong>
                Video rendering takes time. This process will generate images with the image API, compose clips with FFmpeg, and upload the result to S3. Please be patient and do not close the page.
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isLoading}
              className="bg-brand-red hover:bg-brand-red/90 text-white w-full"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Rendering Video (This may take several minutes)...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  GENERATE MP4 VIDEO
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="bg-[#111] border border-brand-grey/20 rounded-md p-4">
            <h5 className="text-xs font-semibold text-brand-grey uppercase mb-3">Your Finished Video</h5>
            <div className="aspect-video bg-black rounded-md overflow-hidden mb-4 border border-brand-grey/20">
              <video 
                controls 
                src={videoUrl} 
                className="w-full h-full object-contain"
                poster="/video-placeholder.jpg" // Optional: You could generate a poster frame
              >
                Your browser does not support video playback.
              </video>
            </div>
            
            <div className="flex gap-2">
              <Button asChild className="flex-1 bg-brand-red hover:bg-brand-red/90 text-white">
                <a href={videoUrl} target="_blank" rel="noopener noreferrer" download>
                  Download Video
                </a>
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={isLoading}
                variant="outline"
                className="flex-1 border-brand-grey/20 text-brand-grey hover:text-white"
              >
                {isLoading ? "Regenerating..." : "Regenerate (Will cost credits)"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
