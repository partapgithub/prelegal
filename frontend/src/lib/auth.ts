"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: number;
  email: string;
}

export function useAuth(redirectIfUnauth = false) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else if (redirectIfUnauth) {
          router.replace("/");
        }
      })
      .catch(() => {
        if (redirectIfUnauth) router.replace("/");
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, loading };
}
