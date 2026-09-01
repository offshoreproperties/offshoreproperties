import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { consumeAuthReturnPath } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get("error_description") || params.get("error");
      if (oauthError) {
        if (!cancelled) setError(oauthError);
        toast.error(oauthError);
        return;
      }

      try {
        const code = params.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (!session) {
            await new Promise<void>((resolve, reject) => {
              const timeout = window.setTimeout(() => {
                sub.unsubscribe();
                reject(new Error("Sign-in timed out. Please try again."));
              }, 12000);
              const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((event, s) => {
                if (event === "SIGNED_IN" && s) {
                  window.clearTimeout(timeout);
                  sub.unsubscribe();
                  resolve();
                }
              });
            });
          }
        }

        if (cancelled) return;
        toast.success("You're signed in.");
        window.location.replace(consumeAuthReturnPath());
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not complete sign-in";
        if (!cancelled) setError(message);
        toast.error(message);
      }
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-dvh-screen flex-col items-center justify-center gap-4 bg-background px-4">
      {error ? (
        <>
          <p className="text-center text-sm text-destructive">{error}</p>
          <Link to="/" className="text-sm font-medium underline">
            Return home
          </Link>
        </>
      ) : (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Completing sign-in…</p>
        </>
      )}
    </div>
  );
}
