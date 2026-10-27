import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ChevronRight, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAccount } from '@/lib/auth-context';
import { readProfile, saveProfile } from '@/lib/account.functions';
import { supabase } from '@/integrations/supabase/client';
import { AccountSignIn } from './AccountSignIn';

export function Settings({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user, loading } = useAccount();
  const read = useServerFn(readProfile);
  const save = useServerFn(saveProfile);
  const queries = useQueryClient();
  const { data: profile, isFetching, error } = useQuery({ queryKey: ['profile', user?.id], queryFn: () => read(), enabled: open && !!user });
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState({ name: '', username: '', email: '', updates_email: false });
  useEffect(() => {
    setDraft({ name: profile?.name || user?.user_metadata?.['name'] || '', username: profile?.username || '', email: profile?.email || user?.email || '', updates_email: profile?.updates_email ?? false });
    setEditing(false);
  }, [profile, user, open]);
  async function persist(values: typeof draft) {
    setBusy(true); setNotice('');
    try { const saved = await save({ data: values }); queries.setQueryData(['profile', user?.id], saved); setEditing(false); setNotice('Saved'); }
    catch { setNotice('Could not save. Add a name, valid username and email, then try again.'); }
    finally { setBusy(false); }
  }
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent aria-describedby="settings-description" className="max-h-[90dvh] max-w-md overflow-y-auto rounded-none border-4 border-foreground p-0 shadow-[var(--shadow-brutal)] [&>button]:hidden">
      <header className="flex items-center justify-between border-b-4 border-foreground p-5">
        <DialogTitle className="font-display text-3xl uppercase">Settings</DialogTitle>
        <Button onClick={() => onOpenChange(false)} className="font-display uppercase">Done</Button>
      </header>
      <DialogDescription id="settings-description" className="sr-only">Account and app preferences</DialogDescription>
      <div className="px-5 pb-5">
        {loading ? <p>Loading account…</p> : !user ? <AccountSignIn /> : <>
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl uppercase">Account</h2><Button variant="ghost" disabled={isFetching || busy} onClick={() => { setEditing(!editing); setNotice(''); }}><Pencil />{editing ? 'Cancel' : 'Edit Profile'}</Button></div>
          {isFetching ? <p>Loading profile…</p> : error ? <p role="alert">Could not load your account. Close Settings and try again.</p> : <form onSubmit={event => { event.preventDefault(); void persist(draft); }}>
            {(['name', 'username', 'email'] as const).map(field => <div key={field} className="border-b border-border py-3"><label htmlFor={`profile-${field}`} className="text-sm font-semibold capitalize text-muted-foreground">{field}</label>{editing ? <Input id={`profile-${field}`} required type={field === 'email' ? 'email' : 'text'} maxLength={field === 'name' ? 40 : field === 'username' ? 31 : 254} value={draft[field]} onChange={event => setDraft({ ...draft, [field]: event.target.value })} /> : <p className="break-words font-semibold">{field === 'username' && draft[field] ? `@${draft[field].replace(/^@/, '')}` : draft[field] || '—'}</p>}</div>)}
            {editing && <Button type="submit" disabled={busy} className="mt-4 w-full font-display uppercase">{busy ? 'Saving…' : 'Save'}</Button>}
          </form>}
          <h2 className="mt-7 font-display text-xl uppercase">Emails</h2>
          <div className="flex items-center justify-between gap-4 border-b border-border py-4"><label htmlFor="update-emails" className="font-semibold">New features and big updates</label><Switch id="update-emails" checked={draft.updates_email} disabled={busy || isFetching || !!error} onCheckedChange={checked => { const values = { ...draft, updates_email: checked }; setDraft(values); if (!editing) void persist(values); }} /></div>
          {notice && <p role="status" className="mt-3 text-sm text-primary">{notice}</p>}
        </>}
        <h2 className="mt-7 font-display text-xl uppercase">App settings</h2>
        {['Blocked players', 'Language', 'Contact us', 'Privacy policy'].map(label => <div key={label} className="flex items-center justify-between border-b border-border py-4 font-semibold"><span>{label}</span><span className="flex items-center gap-2 text-muted-foreground">{label === 'Language' && 'English'}<ChevronRight className="size-4" /></span></div>)}
        <Button variant="ghost" disabled={!user || busy} className="mt-3 w-full justify-start px-0 font-display uppercase text-primary" onClick={async () => { const { error: signoutError } = await supabase.auth.signOut(); if (signoutError) setNotice('Could not sign out. Try again.'); else onOpenChange(false); }}>Sign out</Button>
      </div>
    </DialogContent>
  </Dialog>;
}