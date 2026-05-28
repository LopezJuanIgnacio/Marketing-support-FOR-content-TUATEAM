"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PlayCircle, Save, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GenerateScriptSection({ 
  projectId, 
  initialScriptData 
}: { 
  projectId: string, 
  initialScriptData: any 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scriptData, setScriptData] = useState<any>(initialScriptData);
  const router = useRouter();

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/projects/${projectId}/generate-script`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate script");
      }

      const data = await res.json();
      setScriptData(data.script);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to generate script. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/projects/${projectId}/update-script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: scriptData }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save script");
      }

      alert("Script saved successfully!");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to save script. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateScene = (index: number, field: string, value: string) => {
    const updatedScenes = [...(scriptData.scenes || [])];
    updatedScenes[index] = { ...updatedScenes[index], [field]: value };
    setScriptData({ ...scriptData, scenes: updatedScenes });
  };

  const addScene = () => {
    const updatedScenes = [...(scriptData?.scenes || [])];
    updatedScenes.push({ sceneNumber: updatedScenes.length + 1, narration: "", textOnScreen: "", cta: "" });
    setScriptData({ ...scriptData, scenes: updatedScenes });
  };

  const removeScene = (index: number) => {
    const updatedScenes = [...(scriptData?.scenes || [])];
    updatedScenes.splice(index, 1);
    // Re-number scenes
    updatedScenes.forEach((scene, i) => scene.sceneNumber = i + 1);
    setScriptData({ ...scriptData, scenes: updatedScenes });
  };

  if (!scriptData) {
    return (
      <div className="p-4 rounded-md bg-brand-grey/5 border border-brand-grey/10 flex flex-col items-center justify-center space-y-4">
        <p className="text-sm text-brand-grey text-center">Generate a script based on the selected story and the PDF content.</p>
        <Button 
          onClick={handleGenerate} 
          disabled={isLoading}
          className="bg-brand-red hover:bg-brand-red/90 text-white w-full max-w-xs"
        >
              {isLoading ? (
            <>
              <div className="w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              GENERATE SCRIPT
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-md bg-brand-grey/5 border border-brand-grey/10">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-white">Script Editor</h4>
        <Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-brand-red hover:bg-brand-red/90 text-white">
          {isSaving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Script</>}
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-brand-grey uppercase mb-1">Video Title</label>
          <input 
            type="text" 
            value={scriptData.videoTitle || ""} 
            onChange={(e) => setScriptData({ ...scriptData, videoTitle: e.target.value })}
            className="w-full bg-[#111] border border-brand-grey/20 rounded-md p-2 text-sm text-white focus:outline-none focus:border-brand-red"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-grey uppercase mb-1">Hook</label>
          <textarea 
            value={scriptData.hook || ""} 
            onChange={(e) => setScriptData({ ...scriptData, hook: e.target.value })}
            rows={3}
            className="w-full bg-[#111] border border-brand-grey/20 rounded-md p-2 text-sm text-white focus:outline-none focus:border-brand-red resize-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-brand-grey uppercase">Scenes</label>
              <Button onClick={addScene} variant="outline" size="sm" className="h-7 text-xs border-brand-grey/20 text-brand-grey hover:text-white">
              <Plus className="mr-1 h-3 w-3" /> Add Scene
            </Button>
          </div>
          
          <div className="space-y-4 mt-2">
            {(scriptData.scenes || []).map((scene: any, index: number) => (
              <div key={index} className="p-3 rounded-md bg-[#111] border border-brand-grey/10 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-brand-red">Scene {scene.sceneNumber || index + 1}</span>
                  <button onClick={() => removeScene(index)} className="text-brand-grey hover:text-brand-red transition-colors" title="Delete scene">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-brand-grey mb-1">Narration</label>
                    <textarea 
                      value={scene.narration || ""} 
                      onChange={(e) => updateScene(index, "narration", e.target.value)}
                      rows={2}
                      className="w-full bg-[#0a0a0a] border border-brand-grey/20 rounded-md p-2 text-xs text-white focus:outline-none focus:border-brand-red resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-brand-grey mb-1">Text On Screen</label>
                    <input 
                      type="text" 
                      value={scene.textOnScreen || ""} 
                      onChange={(e) => updateScene(index, "textOnScreen", e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-brand-grey/20 rounded-md p-2 text-xs text-white focus:outline-none focus:border-brand-red"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-brand-grey mb-1">Call to Action (CTA)</label>
                    <input 
                      type="text" 
                      value={scene.cta || ""} 
                      onChange={(e) => updateScene(index, "cta", e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-brand-grey/20 rounded-md p-2 text-xs text-white focus:outline-none focus:border-brand-red"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
