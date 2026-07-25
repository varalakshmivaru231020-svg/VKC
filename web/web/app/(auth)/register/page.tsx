"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Registration is handled automatically via mobile OTP — first-time login creates an account.
export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/login"); }, [router]);
  return null;
}
