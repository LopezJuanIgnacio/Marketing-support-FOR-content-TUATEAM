import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CreateProjectButton from "@/components/CreateProjectButton";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  
  let projects: any[] = [];
  if (session?.user?.id) {
    projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Your Projects</h1>
        <CreateProjectButton />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-6 text-center h-48 border-dashed border-brand-grey/20 bg-brand-grey/5 col-span-full">
            <p className="text-sm text-brand-grey mb-4">No projects yet.</p>
            <CreateProjectButton />
          </Card>
        ) : (
          projects.map((project) => (
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
          ))
        )}
      </div>
    </div>
  );
}
