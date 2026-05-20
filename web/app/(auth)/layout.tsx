import { AuthModalShell } from "@/components/auth/AuthModalShell";

export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthModalShell>{children}</AuthModalShell>;
}
