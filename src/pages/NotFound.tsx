import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import BackButton from "@/components/BackButton";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="blob-warm-1 pointer-events-none fixed -right-32 -top-32 h-80 w-80 rounded-full" />
      <div className="blob-warm-2 pointer-events-none fixed -left-20 top-1/3 h-64 w-64 rounded-full" />

      <div className="relative z-10 text-center">
        <p className="text-8xl font-extrabold text-primary/20">404</p>
        <h1 className="mt-2 text-2xl font-extrabold text-foreground">Page Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
          >
            <Home className="h-4 w-4" />
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
