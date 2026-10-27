import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queries = useQueryClient();
  useEffect(() => {
    let live = true;
    supabase.auth.getUser().then(({ data }) => { if (live) { setUser(data.user); setLoading(false); } });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) return;
      setUser(session?.user ?? null); setLoading(false);
      void router.invalidate();
      if (event !== 'SIGNED_OUT') void queries.invalidateQueries();
      else queries.clear();
    });
    return () => { live = false; data.subscription.unsubscribe(); };
  }, [router, queries]);
  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}
export const useAccount = () => useContext(AuthContext);