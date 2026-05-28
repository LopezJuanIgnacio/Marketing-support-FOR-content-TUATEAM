import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateSummary, detectLanguage } from "@/lib/openai/aiEngine";

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
      include: { documents: true },
    });

    if (!project || project.userId !== session.user.id) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    if (project.documents.length === 0) {
      return NextResponse.json({ error: "No documents found for this project" }, { status: 400 });
    }

    // Combine extracted text from all documents
    const extractedText = project.documents.map(doc => doc.extractedText).join("\n\n");

    if (!extractedText.trim()) {
       return NextResponse.json({ error: "No extracted text available to generate summary" }, { status: 400 });
    }

    // Detect language and call AI Engine to respect original language
    const detected = await detectLanguage(extractedText);
    const language = detected.language || detected.code;
    const summaryData = await generateSummary(extractedText, "", language);

    // Store in VideoProject.summary
    const summaryJsonString = JSON.stringify(summaryData);

    const videoProject = await prisma.videoProject.upsert({
      where: { projectId: projectId },
      create: {
        projectId: projectId,
        summary: summaryJsonString,
        story: "",
        script: "",
        storyboard: "",
      },
      update: {
        summary: summaryJsonString,
      },
    });

    // Update project status if needed, though status is 'analyzed' currently, maybe to 'processing' or something, but we'll leave it or set it to 'processing'
    // The user didn't specify changing project status.

    return NextResponse.json({ success: true, summary: summaryData, videoProject });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
