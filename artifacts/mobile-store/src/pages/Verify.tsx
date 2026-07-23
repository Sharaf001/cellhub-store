import { useEffect, useState } from "react";
import { useSearch, Link } from "wouter";
import { verifyEmail } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Smartphone } from "lucide-react";

export default function Verify() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }
    verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed.");
      });
  }, [token]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-muted/10 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex items-center gap-2 text-primary font-bold text-2xl">
            <Smartphone className="w-7 h-7" />
            <span>CellHub</span>
          </div>
        </div>

        <div className="bg-card border rounded-xl shadow-sm p-8 flex flex-col items-center gap-4">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-600" />
              <h2 className="text-xl font-bold">Email Verified!</h2>
              <p className="text-muted-foreground">{message}</p>
              <Link href="/login">
                <Button className="mt-2">Go to Login</Button>
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="w-12 h-12 text-destructive" />
              <h2 className="text-xl font-bold">Verification Failed</h2>
              <p className="text-muted-foreground">{message}</p>
              <Link href="/login">
                <Button variant="outline" className="mt-2">Back to Login</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
