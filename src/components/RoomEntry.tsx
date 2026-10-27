import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { enterLobby } from '@/lib/account.functions';
import { useAccount } from '@/lib/auth-context';
import { AccountSignIn } from './AccountSignIn';

export function RoomEntry({ mode }: { mode: 'host' | 'join' }) {
  const { user, loading } = useAccount();
  const enter = useServerFn(enterLobby);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (loading) return <p>Loading account…</p>;
  if (!user) return <AccountSignIn />;
  return <form className="flex flex-col gap-4" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setError('');
    try { const gameId = await enter({ data: { name, ...(mode === 'join' ? { code } : {}) } }); await navigate({ to: '/game', search: { gameId, mode } }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not enter the room.'); }
    finally { setBusy(false); }
  }}>
    <h1 className="font-display text-4xl uppercase">{mode === 'host' ? 'Host a game' : 'Join a game'}</h1>
    <label className="font-semibold">Your name<Input required maxLength={40} value={name} onChange={event => setName(event.target.value)} /></label>
    {mode === 'join' && <label className="font-semibold">Room code<Input required maxLength={20} autoCapitalize="characters" value={code} onChange={event => setCode(event.target.value.toUpperCase())} /></label>}
    {error && <p role="alert" className="text-primary">{error}</p>}
    <Button type="submit" disabled={busy} className="font-display uppercase">{busy ? 'Connecting…' : mode === 'host' ? 'Create room' : 'Join room'}</Button>
  </form>;
}