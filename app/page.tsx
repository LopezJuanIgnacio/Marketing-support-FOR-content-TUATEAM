import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowRight, FileText, Video, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="w-full py-24 md:py-32 lg:py-40 bg-slate-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
                  Turn your PDFs into <br className="hidden md:inline" />
                  <span className="text-blue-600">Engaging Videos</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-slate-500 md:text-xl dark:text-gray-400 mt-4">
                  Upload your document and let our AI create a professional video summary, script, and storyboard in minutes.
                </p>
              </div>
              <div className="space-x-4 mt-8">
                <Button size="lg" asChild>
                  <Link href="/upload">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/dashboard">View Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Upload Document</h3>
                <p className="text-sm text-slate-500 text-center">
                  Simply drag and drop your PDF. We extract the key insights securely.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">AI Processing</h3>
                <p className="text-sm text-slate-500 text-center">
                  Our advanced AI generates a full storyboard, voiceover script, and scene plan.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <Video className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Render Video</h3>
                <p className="text-sm text-slate-500 text-center">
                  Export directly to MP4 with professional avatars, graphics, and background music.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
