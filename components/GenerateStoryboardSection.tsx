"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PlayCircle, Save, Trash2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GenerateStoryboardSection({ 
  projectId, 
  initialStoryboardData 
}: { 
  projectId: string, 
  initialStoryboardData: any 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [storyboardData, setStoryboardData] = useState<any>(initialStoryboardData);
  const router = useRouter();

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/projects/${projectId}/generate-storyboard`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate storyboard");
      }

      const data = await res.json();
      setStoryboardData(data.storyboard);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to generate storyboard. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/projects/${projectId}/update-storyboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyboard: storyboardData }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save storyboard");
      }

      alert("Storyboard saved successfully!");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to save storyboard. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateScene = (index: number, field: string, value: string) => {
    const updatedScenes = [...(storyboardData.scenes || [])];
    updatedScenes[index] = { ...updatedScenes[index], [field]: value };
    setStoryboardData({ ...storyboardData, scenes: updatedScenes });
  };

  const addScene = () => {
    const updatedScenes = [...(storyboardData?.scenes || [])];
    updatedScenes.push({ 
      sceneNumber: updatedScenes.length + 1, 
      narration: "", 
      visualSuggestion: "",
      cameraType: "",
      transition: ""
    });
    setStoryboardData({ ...storyboardData, scenes: updatedScenes });
  };

  const removeScene = (index: number) => {
    const updatedScenes = [...(storyboardData?.scenes || [])];
    updatedScenes.splice(index, 1);
    updatedScenes.forEach((scene, i) => scene.sceneNumber = i + 1);
    setStoryboardData({ ...storyboardData, scenes: updatedScenes });
  };

    if (!storyboardData) {
    return (
      <div className="p-4 rounded-md bg-brand-grey/5 border border-brand-grey/10 flex flex-col items-center justify-center space-y-4 mt-4">
        <p className="text-sm text-brand-grey text-center">Convert the script into a detailed storyboard for visual generation.</p>
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
              STORYBOARD
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-md bg-brand-grey/5 border border-brand-grey/10 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-white">Storyboard</h4>
        <div className="space-x-2 flex">
          <Button onClick={handleGenerate} disabled={isLoading} variant="outline" size="sm" className="border-brand-grey/20 text-brand-grey hover:text-white">
            {isLoading ? "Generating..." : "Regenerate"}
          </Button>
          <Button onClick={addScene} variant="outline" size="sm" className="border-brand-grey/20 text-brand-grey hover:text-white">
            <Plus className="mr-2 h-4 w-4" /> Add Row
          </Button>
          <Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-brand-red hover:bg-brand-red/90 text-white">
            {isSaving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save</>}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-brand-grey">
          <thead className="text-xs text-white uppercase bg-[#111] border-b border-brand-grey/20">
            <tr>
              <th className="px-4 py-3 w-16">#</th>
              <th className="px-4 py-3 w-24">Duration</th>
              <th className="px-4 py-3 min-w-[200px]">Narración</th>
              <th className="px-4 py-3 min-w-[250px]">Sugerencia Visual</th>
              <th className="px-4 py-3 w-32">Tipo Cámara</th>
              <th className="px-4 py-3 w-32">Transición</th>
              <th className="px-4 py-3 w-16 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {(storyboardData.scenes || []).map((scene: any, index: number) => (
              <tr key={index} className="border-b border-brand-grey/10 hover:bg-brand-grey/5">
                <td className="px-4 py-3 font-medium text-white">
                  {scene.sceneNumber || index + 1}
                </td>
                <td className="px-4 py-3 text-white">
                  {scene.durationFromAudio ? scene.duration : "Auto"}
                </td>
                <td className="px-4 py-3">
                  <textarea 
                    value={scene.narration || ""} 
                    onChange={(e) => updateScene(index, "narration", e.target.value)}
                    rows={3}
                    className="w-full bg-transparent border border-brand-grey/20 rounded p-1 text-white focus:outline-none focus:border-brand-red resize-none text-sm"
                  />
                </td>
                <td className="px-4 py-3">
                  <textarea 
                    value={scene.visualSuggestion || ""} 
                    onChange={(e) => updateScene(index, "visualSuggestion", e.target.value)}
                    rows={3}
                    className="w-full bg-transparent border border-brand-grey/20 rounded p-1 text-white focus:outline-none focus:border-brand-red resize-none text-sm"
                  />
                </td>
                <td className="px-4 py-3">
                  <input 
                    type="text" 
                    value={scene.cameraType || ""} 
                    onChange={(e) => updateScene(index, "cameraType", e.target.value)}
                    className="w-full bg-transparent border border-brand-grey/20 rounded p-1 text-white focus:outline-none focus:border-brand-red text-sm"
                  />
                </td>
                <td className="px-4 py-3">
                  <input 
                    type="text" 
                    value={scene.transition || ""} 
                    onChange={(e) => updateScene(index, "transition", e.target.value)}
                    className="w-full bg-transparent border border-brand-grey/20 rounded p-1 text-white focus:outline-none focus:border-brand-red text-sm"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => removeScene(index)} className="text-brand-grey hover:text-brand-red transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
