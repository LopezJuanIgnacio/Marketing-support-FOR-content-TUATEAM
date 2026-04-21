import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Create S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;

    if (!file || !projectId) {
      return NextResponse.json({ error: "File and projectId are required" }, { status: 400 });
    }

    // Check project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== session.user.id) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    // Prepare file for S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "pdfvideo-bucket";
    const objectKey = `uploads/${session.user.id}/${projectId}/${fileName}`;

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(uploadCommand);

    const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${objectKey}`;

    // Extract text automatically
    let extractedText = "";
    try {
      const pdf = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const data = await pdf(buffer);
      extractedText = data.text
        .replace(/\r\n/g, "\n")
        .replace(/\n\s+\n/g, "\n\n")
        .replace(/[^\x20-\x7E\n\r\t]/g, "")
        .trim();
    } catch (e) {
      console.error("Extraction error during upload:", e);
    }

    // Create Document record
    const document = await prisma.document.create({
      data: {
        projectId,
        fileUrl,
        name: file.name,
        extractedText: extractedText || "No text extracted",
      },
    });

    // Update Project status to analyzed
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "analyzed" },
    });

    return NextResponse.json({ success: true, document });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    
    // Check if error is AWS credentials related to provide better fallback
    if (error.name === 'CredentialsProviderError' || error.message?.includes('credentials')) {
      return NextResponse.json(
        { error: "AWS credentials not configured properly in .env" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Error uploading file to storage" },
      { status: 500 }
    );
  }
}
