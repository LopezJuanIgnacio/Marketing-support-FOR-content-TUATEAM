import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { project: true },
    });

    if (!document || document.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Download PDF
    const response = await fetch(document.fileUrl);
    if (!response.ok) {
      throw new Error("Failed to download PDF from storage");
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text using pdf-parse
    let extractedText = "";
    try {
      const pdf = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const data = await pdf(buffer);
      extractedText = data.text;
    } catch (pdfError) {
      console.error("Error parsing PDF:", pdfError);
      extractedText = "";
    }

    // Cleaning text
    const cleanText = extractedText
      .replace(/\r\n/g, "\n")
      .replace(/\n\s+\n/g, "\n\n")
      .replace(/[^\x20-\x7E\n\r\t]/g, "") // Remove non-printable characters
      .trim();

    // Update database
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        extractedText: cleanText || "No text could be extracted from this document.",
      },
    });

    // Update Project status if this is the first document or just to signify progress
    await prisma.project.update({
      where: { id: document.projectId },
      data: { status: "analyzed" },
    });

    return NextResponse.json({ 
      success: true, 
      text: cleanText,
      pages: cleanText.length > 0 ? "Analyzed" : "Scanned/Empty"
    });
  } catch (error: any) {
    console.error("Error in PDF extraction:", error);
    return NextResponse.json(
      { error: "Error extracting text from PDF" },
      { status: 500 }
    );
  }
}
