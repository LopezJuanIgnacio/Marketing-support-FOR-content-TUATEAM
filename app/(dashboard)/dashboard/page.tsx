import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Video, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CreateProjectButton from "@/components/CreateProjectButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  let projects: any[] = [];
  let totalDocuments = 0;
  let totalVideos = 0;

  if (session?.user?.id) {
    projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { documents: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    const counts = await prisma.document.count({
      where: { project: { userId: session.user.id } }
    });
    totalDocuments = counts;

    const videoCounts = await prisma.project.count({
      where: { 
        userId: session.user.id,
        status: "completed" // Assuming "completed" means video is rendered
      }
    });
    totalVideos = videoCounts;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <CreateProjectButton />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Video className="h-4 w-4 text-brand-grey" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{projects.length}</div>
            <p className="text-xs text-brand-grey">Working AI videos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Uploaded</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalDocuments}</div>
            <p className="text-xs text-brand-grey">{totalDocuments === 0 ? "Upload a PDF to start" : "PDFs ready for processing"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos Rendered</CardTitle>
            <Video className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalVideos}</div>
            <p className="text-xs text-brand-grey">Videos generated</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Projects</h2>
        
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center border border-brand-grey/20 rounded-lg bg-brand-grey/5 h-64 border-dashed">
            <div className="rounded-full bg-brand-red/10 p-3 mb-4">
              <FileText className="h-6 w-6 text-brand-red" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">No projects found</h3>
            <p className="mb-4 text-sm text-brand-grey">
              You haven't created any AI videos yet. Create your first project to get started.
            </p>
            <CreateProjectButton />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="flex flex-col hover:border-brand-red/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg text-white">{project.name}</CardTitle>
                  <p className="text-xs text-brand-grey">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end mt-2">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs px-2 py-1 rounded-full bg-brand-grey/10 text-brand-grey capitalize border border-brand-grey/20">
                      {project.status}
                    </span>
                  </div>
                  <Button asChild className="w-full bg-brand-red hover:bg-brand-red/90 text-white">
                    <Link href={`/projects/${project.id}`}>
                      Open Project
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
