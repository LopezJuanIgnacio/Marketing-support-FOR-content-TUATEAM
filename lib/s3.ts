import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

export async function getPresignedUrl(s3Url: string | null | undefined): Promise<string | null> {
  if (!s3Url) return null;
  
  // If it's a local fallback URL or not an S3 URL, just return it
  if (s3Url.startsWith("/") || s3Url.startsWith("http://localhost") || !s3Url.includes("s3.") || !s3Url.includes("amazonaws.com")) {
    return s3Url;
  }

  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "pdfvideo-bucket";
    const url = new URL(s3Url);
    
    // Extract the object key. 
    // Usually AWS S3 URLs are https://bucket-name.s3.region.amazonaws.com/object-key
    // So url.pathname is /object-key
    const objectKey = url.pathname.slice(1);

    if (!objectKey) return s3Url;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: decodeURIComponent(objectKey),
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiration
  } catch (error) {
    console.error("Error generating presigned URL for", s3Url, ":", error);
    return s3Url; // Fallback to original URL
  }
}
