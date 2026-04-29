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
    console.log("Generating signed URL for:", document.fileUrl);
    const url = new URL(document.fileUrl);
    
    // Support both bucket.s3... and s3.../bucket/ formats
    let bucketName = "";
    let objectKey = "";

    if (url.hostname.includes(".s3.")) {
      // Format: bucket.s3.region.amazonaws.com/key
      bucketName = url.hostname.split(".")[0];
      objectKey = decodeURIComponent(url.pathname.substring(1));
    } else {
      // Fallback or other formats (e.g. s3.amazonaws.com/bucket/key)
      const parts = url.pathname.substring(1).split("/");
      bucketName = parts[0];
      objectKey = decodeURIComponent(parts.slice(1).join("/"));
    }

    console.log("S3 Access - Bucket:", bucketName, "Key:", objectKey);

    if (!bucketName || !objectKey) {
      throw new Error(`Could not extract S3 bucket or key from URL: ${document.fileUrl}`);
    }

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
