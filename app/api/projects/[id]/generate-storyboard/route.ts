import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateStoryboard } from "@/lib/openai/aiEngine";

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
      include: { videoProject: true },
    });

    if (!project || project.userId !== session.user.id) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    if (!project.videoProject || !project.videoProject.script) {
      return NextResponse.json({ error: "No script generated yet" }, { status: 400 });
    }

    // Call AI Engine using the script
    const storyboardData = await generateStoryboard(project.videoProject.script);

    // Clean up potentially empty scenes hallucinated by AI
    if (storyboardData.scenes && Array.isArray(storyboardData.scenes)) {
      storyboardData.scenes = storyboardData.scenes.filter((scene: any) => {
        return scene && typeof scene === 'object' && Object.keys(scene).length > 0;
      });
      // Renumber scenes sequentially
      storyboardData.scenes.forEach((scene: any, i: number) => {
        scene.sceneNumber = i + 1;
      });
    }

    const storyboardJsonString = JSON.stringify(storyboardData);

    const videoProject = await prisma.videoProject.update({
      where: { projectId: projectId },
      data: {
        storyboard: storyboardJsonString,
      },
    });

    return NextResponse.json({ success: true, storyboard: storyboardData, videoProject });
  } catch (error) {
    console.error("Error generating storyboard:", error);
    return NextResponse.json(
      { error: "Failed to generate storyboard" },
      { status: 500 }
    );
  }
}
