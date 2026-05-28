import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateScript, detectLanguage } from "@/lib/openai/aiEngine";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { 
        documents: true,
        videoProject: true
      },
    });

    if (!project || project.userId !== session.user.id) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    if (!project.videoProject || !project.videoProject.story) {
      return NextResponse.json({ error: "No story selected yet" }, { status: 400 });
    }

    if (project.documents.length === 0) {
      return NextResponse.json({ error: "No documents found for this project" }, { status: 400 });
    }

    // Combine extracted text from all documents
    const extractedText = project.documents.map(doc => doc.extractedText).join("\n\n");

    if (!extractedText.trim()) {
       return NextResponse.json({ error: "No extracted text available" }, { status: 400 });
    }

    const detected = await detectLanguage(extractedText);
    const language = detected.language || detected.code;
    // Call AI Engine using the text and the selected story as context, preserving language
    const scriptData = await generateScript(extractedText, project.videoProject.story, language);

    // Clean up potentially empty scenes hallucinated by AI
    if (scriptData.scenes && Array.isArray(scriptData.scenes)) {
      scriptData.scenes = scriptData.scenes.filter((scene: any) => {
        return scene && (scene.narration?.trim() || scene.textOnScreen?.trim() || scene.cta?.trim());
      });
      // Renumber scenes sequentially
      scriptData.scenes.forEach((scene: any, i: number) => {
        scene.sceneNumber = i + 1;
      });
    }

    const scriptJsonString = JSON.stringify(scriptData);

    const videoProject = await prisma.videoProject.update({
      where: { projectId: projectId },
      data: {
        script: scriptJsonString,
      },
    });

    return NextResponse.json({ success: true, script: scriptData, videoProject });
  } catch (error) {
    console.error("Error generating script:", error);
    return NextResponse.json(
      { error: "Failed to generate script" },
      { status: 500 }
    );
  }
}
