import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PlusCircle, Video, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button asChild>
          <Link href="/upload">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Video className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-slate-500">No projects created yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Uploaded</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-slate-500">Upload a PDF to start</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos Rendered</CardTitle>
            <Video className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-slate-500">0 hours watched</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-slate-50 mt-8 h-64 border-dashed">
        <div className="rounded-full bg-blue-100 p-3 mb-4">
          <FileText className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No projects found</h3>
        <p className="mb-4 text-sm text-slate-500">
          You haven't created any AI videos yet. Upload your first PDF document to get started.
        </p>
        <Button asChild>
          <Link href="/upload">Upload PDF Document</Link>
        </Button>
      </div>
    </div>
  );
}
