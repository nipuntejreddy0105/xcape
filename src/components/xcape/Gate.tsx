import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccount } from "@/lib/auth-context";
import { useProfile, useSaveProfile, type Profile } from "@/lib/profile";
import { useTheme } from "@/lib/theme";
import { usernameError } from "@/lib/xcape";
import { Logo, Screen } from "./ui";

function Splash({ text = "Loading…" }: { text?: string }) {
  return <Screen className="items-center justify-center"><Logo className="text-5xl" /><p className="text-muted-foreground">{text}</p></Screen>;
}

function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <Screen className="justify-center">
      <div className="glass rounded-[2rem] p-6">
        <Logo className="text-6xl" />
        <p className="mb-6 mt-1 text-lg font-semibold">Run. Hide. Xcape.</p>
        <Button type="button" variant="outline" className="glass-chip h-12 w-full rounded-full font-bold" onClick={async () => {
          const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
          if (error) setMessage(error.message);
        }}>Continue with Google</Button>
        <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase text-muted-foreground"><span className="h-px flex-1 bg-border" />or email<span className="h-px flex-1 bg-border" /></div>
        <form className="flex flex-col gap-3" onSubmit={async (e) => {
          e.preventDefault(); setBusy(true); setMessage("");
          try {
            const { error, data } = signup
              ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
              : await supabase.auth.signInWithPassword({ email, password });
            if (error) setMessage(error.message);
            else if (!data.session) setMessage("Check your email to confirm your account, then sign in.");
          } catch { setMessage("Could not connect. Please try again."); }
          finally { setBusy(false); }
        }}>
          <Input aria-label="Email" placeholder="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-full px-5" />
          <Input aria-label="Password" placeholder="Password" type="password" minLength={6} required autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-full px-5" />
          {message && <p role="status" className="text-sm font-semibold text-primary">{message}</p>}
          <Button disabled={busy} className="h-12 rounded-full font-display uppercase">{busy ? "Connecting…" : signup ? "Create account" : "Sign in"}</Button>
          <Button type="button" variant="ghost" onClick={() => { setSignup(!signup); setMessage(""); }}>{signup ? "I already have an account" : "Create an account"}</Button>
        </form>
      </div>
    </Screen>
  );
}

function UsernameSetup({ profile }: { profile: Profile }) {
  const save = useSaveProfile();
  const [name, setName] = useState(profile.name ?? "");
  const [username, setUsername] = useState("@");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Screen className="justify-center">
      <form className="glass flex flex-col gap-4 rounded-[2rem] p-6" onSubmit={async (e) => {
        e.preventDefault();
        const problem = usernameError(username);
        if (problem) return setError(problem);
        setBusy(true); setError("");
        try { const r = await save({ name, username }); if (!r.ok) setError(r.error); }
        catch { setError("Could not save. Try again."); }
        finally { setBusy(false); }
      }}>
        <Logo />
        <h1 className="font-display text-3xl uppercase leading-tight">Pick your @username</h1>
        <p className="text-muted-foreground">This is how other players find you. It has to be unique.</p>
        <Input aria-label="Name" placeholder="Your name" required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-full px-5" />
        <Input aria-label="Username" required maxLength={21} autoCapitalize="none" value={username}
          onChange={(e) => { const v = e.target.value.toLowerCase().replace(/\s/g, ""); setUsername(v.startsWith("@") ? v : `@${v}`); }}
          className="h-12 rounded-full px-5 font-bold" />
        {error && <p role="alert" className="text-sm font-semibold text-primary">{error}</p>}
        <Button disabled={busy} className="h-12 rounded-full font-display uppercase">{busy ? "Saving…" : "Let's go"}</Button>
      </form>
    </Screen>
  );
}

export function Gate({ children }: { children: (profile: Profile) => ReactNode }) {
  const { user, loading } = useAccount();
  const { data: profile, isLoading, error, refetch } = useProfile();
  const { setTheme } = useTheme();
  useEffect(() => { if (profile?.theme === "dark" || profile?.theme === "light") setTheme(profile.theme); }, [profile?.theme, setTheme]);
  if (loading) return <Splash />;
  if (!user) return <AuthScreen />;
  if (isLoading) return <Splash text="Loading your profile…" />;
  if (error || !profile) return <Screen className="items-center justify-center"><p>Could not load your profile.</p><Button onClick={() => refetch()}>Try again</Button></Screen>;
  if (!profile.username) return <UsernameSetup profile={profile} />;
  return <>{children(profile)}</>;
}
