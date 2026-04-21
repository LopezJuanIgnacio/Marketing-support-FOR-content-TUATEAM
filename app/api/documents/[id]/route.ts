import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch document to get S3 key and check ownership
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!document || document.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Extract bucket and key from fileUrl
    const url = new URL(document.fileUrl);
    const bucketName = url.hostname.split(".")[0];
    const objectKey = url.pathname.substring(1);

    // Delete from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    await s3Client.send(deleteCommand);

    // Delete from Database
    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Error deleting document" },
      { status: 500 }
    );
  }
}
