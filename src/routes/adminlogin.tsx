import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { verifyAdminPassword } from "@/lib/admin-auth.functions";
import { isAdminSessionActive, setAdminBearerToken } from "@/lib/admin-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND } from "@/lib/constants";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/adminlogin")({
  head: () => ({ meta: [{ title: `Admin — ${BRAND.name}` }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const verify = useServerFn(verifyAdminPassword);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdminSessionActive()) {
      navigate({ to: "/admin" });
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await verify({ data: { password } });
      setAdminBearerToken(password);
      toast.success("Welcome back");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141414] p-8 shadow-elevated sm:p-10">
        <Link to="/" className="text-xl font-bold text-white">
          Offshore
        </Link>
        <p className="mt-2 text-sm text-white/50">Administration</p>
        <h1 className="mt-8 text-2xl font-bold text-white">Admin access</h1>
        <p className="mt-2 text-sm text-white/60">Enter the admin password to continue.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-white/70">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="border-white/15 bg-black/40 text-white"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-full bg-neutral-900 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-white/40">
          <Link to="/" className="text-[#2563eb] hover:underline">
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
