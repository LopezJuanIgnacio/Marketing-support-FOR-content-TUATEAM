"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Mic, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GenerateAudioSection({ 
  projectId, 
  initialAudioUrl 
}: { 
  projectId: string, 
  initialAudioUrl: string | null 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl);
  const [voiceType, setVoiceType] = useState<"male" | "female">("male");
  const [tone, setTone] = useState<"professional" | "casual">("professional");
  const router = useRouter();

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/projects/${projectId}/generate-audio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voiceType, tone }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate audio");
      }

      const data = await res.json();
      setAudioUrl(data.audioUrl);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to generate audio. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-md bg-brand-grey/5 border border-brand-grey/10 mt-4">
      <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-white flex items-center">
          <Mic className="mr-2 h-4 w-4 text-brand-red" />
          VoiceOver (AI)
        </h4>
      </div>

      <div className="space-y-4">
        {!audioUrl ? (
          <div className="bg-[#111] border border-brand-grey/20 rounded-md p-4">
              <p className="text-sm text-brand-grey mb-4">
              Generate narration for all storyboard scenes using ElevenLabs-powered voices.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                  <label className="block text-xs font-semibold text-brand-grey uppercase mb-2">Voice Type</label>
                <select 
                  value={voiceType}
                  onChange={(e) => setVoiceType(e.target.value as "male" | "female")}
                  className="w-full bg-[#0a0a0a] border border-brand-grey/20 rounded-md p-2 text-sm text-white focus:outline-none focus:border-brand-red"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              
              <div>
                  <label className="block text-xs font-semibold text-brand-grey uppercase mb-2">Tone</label>
                <select 
                  value={tone}
                  onChange={(e) => setTone(e.target.value as "professional" | "casual")}
                  className="w-full bg-[#0a0a0a] border border-brand-grey/20 rounded-md p-2 text-sm text-white focus:outline-none focus:border-brand-red"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                </select>
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
                  Generating Audio...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  GENERATE AUDIO
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="bg-[#111] border border-brand-grey/20 rounded-md p-4">
            <h5 className="text-xs font-semibold text-brand-grey uppercase mb-3">Final Audio</h5>
            <audio controls src={audioUrl} className="w-full mb-4 outline-none" />
            
            <div className="pt-3 border-t border-brand-grey/20">
                <Button 
                onClick={handleGenerate} 
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="w-full border-brand-grey/20 text-brand-grey hover:text-white"
              >
                {isLoading ? "Regenerating..." : "Regenerate Audio (Will cost credits)"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
