import Link from "next/link";
import { Video } from "lucide-react";
import { Button } from "./ui/Button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Video className="h-6 w-6 text-blue-600" />
            <span className="inline-block font-bold">PDF to Video AI</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/upload">Upload PDF</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
