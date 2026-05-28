import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateStories, detectLanguage } from "@/lib/openai/aiEngine";

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
      include: { documents: true, videoProject: true },
    });

    if (!project || project.userId !== session.user.id) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    if (!project.videoProject?.summary) {
      return NextResponse.json({ error: "Summary must be generated first" }, { status: 400 });
    }

    // Combine extracted text from all documents
    const extractedText = project.documents.map(doc => doc.extractedText).join("\n\n");

    if (!extractedText.trim()) {
       return NextResponse.json({ error: "No extracted text available to generate stories" }, { status: 400 });
    }

    const detected = await detectLanguage(extractedText);
    const language = detected.language || detected.code;
    // Call AI Engine with language to keep output in original PDF language
    const storiesData = await generateStories(extractedText, "", language);

    return NextResponse.json({ success: true, stories: storiesData.stories || [] });
  } catch (error) {
    console.error("Error generating stories:", error);
    return NextResponse.json(
      { error: "Failed to generate stories" },
      { status: 500 }
    );
  }
}
