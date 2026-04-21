import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { UploadCloud, FileText, Video, PlayCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import DeleteProjectButton from "@/components/DeleteProjectButton";
import DeleteDocumentButton from "@/components/DeleteDocumentButton";

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const project = await prisma.project.findUnique({
    where: {
      id: resolvedParams.id,
    },
    include: {
      documents: true,
      videoProject: true,
    },
  });

  if (!project || project.userId !== session.user.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{project.name}</h1>
          <p className="text-brand-grey flex items-center mt-2">
            Status: <span className="ml-2 px-2 py-0.5 rounded-full bg-brand-grey/10 text-xs text-white capitalize border border-brand-grey/20">{project.status}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <DeleteProjectButton projectId={project.id} />
          <Button variant="outline" size="sm" className="border-brand-red text-brand-red hover:bg-brand-red hover:text-white" asChild>
            <Link href={`/upload?projectId=${project.id}`}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload PDF
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-brand-grey/20 bg-[#0a0a0a]">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center">
              <FileText className="mr-2 h-5 w-5 text-brand-red" />
              Source Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-brand-grey/20 rounded-md">
                <p className="text-sm text-brand-grey mb-4">No PDFs uploaded yet.</p>
                <Button asChild size="sm">
                  <Link href={`/upload?projectId=${project.id}`}>
                    Upload First PDF
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {project.documents.map(doc => (
                  <li key={doc.id} className="flex items-center justify-between p-3 rounded-md bg-brand-grey/5 border border-brand-grey/10">
                    <div className="flex items-center flex-1 min-w-0 mr-4">
                      <FileText className="mr-2 h-4 w-4 text-brand-grey shrink-0" />
                      <span className="text-sm text-white truncate">
                        {doc.name || "Document"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-brand-grey whitespace-nowrap">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild title="Open document">
                        <a href={`/api/documents/${doc.id}/view`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 text-brand-red" />
                        </a>
                      </Button>
                      <DeleteDocumentButton documentId={doc.id} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-brand-grey/20 bg-[#0a0a0a]">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center">
              <Video className="mr-2 h-5 w-5 text-brand-red" />
              Video Generation Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.status === "draft" && project.documents.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-brand-grey mb-4 text-sm">Upload a PDF to begin the generation process.</p>
              </div>
            ) : project.status === "draft" && project.documents.length > 0 ? (
              <div className="py-8 text-center flex flex-col items-center">
                <p className="text-brand-grey mb-6 text-sm">PDF analyzed. Ready to generate video.</p>
                <Button className="bg-brand-red hover:bg-brand-red/90 text-white w-full">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start Generation flow
                </Button>
              </div>
            ) : project.status === "processing" ? (
              <div className="py-8 text-center flex flex-col items-center">
                <div className="w-8 h-8 rounded-full border-2 border-brand-red border-t-transparent animate-spin mb-4" />
                <p className="text-brand-grey text-sm">Generating your video... Please wait.</p>
              </div>
            ) : project.videoProject ? (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-brand-grey/5 border border-brand-grey/10">
                  <h4 className="font-medium text-white mb-2">Summary</h4>
                  <p className="text-sm text-brand-grey line-clamp-2">{project.videoProject.summary}</p>
                </div>
                <div className="p-4 rounded-md bg-brand-grey/5 border border-brand-grey/10 flex items-center justify-between">
                  <span className="text-sm text-white font-medium">Final Video</span>
                  <Button variant="outline" size="sm" asChild>
                    <a href={project.videoProject.videoUrl || "#"} target="_blank" rel="noopener noreferrer">Watch</a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-brand-grey mb-4 text-sm">Video generated.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
