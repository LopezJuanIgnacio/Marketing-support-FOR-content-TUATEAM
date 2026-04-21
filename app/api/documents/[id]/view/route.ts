import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch document and check ownership
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
    // URL format: https://bucket.s3.region.amazonaws.com/uploads/user/project/file.pdf
    const url = new URL(document.fileUrl);
    const bucketName = url.hostname.split(".")[0];
    const objectKey = url.pathname.substring(1); // Remove leading slash

    // Generate signed URL
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    return NextResponse.redirect(signedUrl);
  } catch (error: any) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: "Error generating access link" },
      { status: 500 }
    );
  }
}
