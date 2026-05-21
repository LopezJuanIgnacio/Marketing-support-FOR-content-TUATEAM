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

    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    const body = await request.json();
    const { storyboard } = body;

    if (!storyboard) {
      return NextResponse.json({ error: "Storyboard data is required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { videoProject: true },
    });

    if (!project || project.userId !== session.user.id) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const videoProject = await prisma.videoProject.update({
      where: { projectId: projectId },
      data: {
        storyboard: JSON.stringify(storyboard),
      },
    });

    return NextResponse.json({ success: true, videoProject });
  } catch (error) {
    console.error("Error updating storyboard:", error);
    return NextResponse.json(
      { error: "Failed to update storyboard" },
      { status: 500 }
    );
  }
}
