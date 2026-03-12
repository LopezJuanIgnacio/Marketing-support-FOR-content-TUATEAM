import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
        <Button asChild>
          <Link href="/upload">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder for project cards */}
        <Card className="flex flex-col items-center justify-center p-6 text-center h-48 border-dashed bg-slate-50">
          <p className="text-sm text-slate-500 mb-4">No projects yet.</p>
          <Button variant="outline" asChild>
            <Link href="/upload">Create the first one</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
