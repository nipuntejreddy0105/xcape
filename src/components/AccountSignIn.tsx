import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AccountSignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return <form className="flex flex-col gap-3" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const { error, data } = signup ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else if (!data.session) setMessage('Check your email to confirm your account, then sign in.');
    } catch { setMessage('Could not connect. Please try again.'); }
    finally { setBusy(false); }
  }}>
    <h2 className="font-display text-xl uppercase">{signup ? 'Create account' : 'Sign in'}</h2>
    <label className="font-semibold">Email<Input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
    <label className="font-semibold">Password<Input type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={6} required value={password} onChange={event => setPassword(event.target.value)} /></label>
    {message && <p role="status" className="text-sm text-primary">{message}</p>}
    <Button disabled={busy} type="submit">{busy ? 'Connecting…' : signup ? 'Create account' : 'Sign in'}</Button>
    <Button type="button" variant="ghost" onClick={() => { setSignup(!signup); setMessage(''); }}>{signup ? 'Already have an account?' : 'Create an account'}</Button>
  </form>;
}