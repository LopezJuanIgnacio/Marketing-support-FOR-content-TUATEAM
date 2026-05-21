import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { story } = await request.json();
    if (!story) {
      return NextResponse.json({ error: "Story is required" }, { status: 400 });
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

    if (!project.videoProject) {
      return NextResponse.json({ error: "VideoProject not initialized" }, { status: 400 });
    }

    const storyJsonString = JSON.stringify(story);

    const videoProject = await prisma.videoProject.update({
      where: { projectId: projectId },
      data: {
        story: storyJsonString,
      },
    });

    return NextResponse.json({ success: true, videoProject });
  } catch (error) {
    console.error("Error saving story:", error);
    return NextResponse.json(
      { error: "Failed to save story" },
      { status: 500 }
    );
  }
}
