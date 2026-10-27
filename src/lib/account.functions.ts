import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

export const readProfile = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from('profiles').select('*').eq('id', context.userId).maybeSingle();
  if (error) throw new Error('Could not load your profile.');
  return data;
});

export const saveProfile = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ name: z.string().trim().min(1).max(40), username: z.string().trim().regex(/^@?[a-zA-Z0-9_]{1,30}$/), email: z.string().email(), updates_email: z.boolean() }))
  .handler(async ({ data, context }) => {
    const { data: profile, error } = await context.supabase.from('profiles').upsert({ ...data, username: data.username.replace(/^@/, ''), id: context.userId, updated_at: new Date().toISOString() }).select('*').single();
    if (error) throw new Error('Could not save your profile. Please try again.');
    return profile;
  });

export const enterLobby = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ name: z.string().trim().min(1).max(40), code: z.string().trim().min(1).max(20).optional() }))
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc('enter_lobby', { player_name: data.name, ...(data.code ? { room_code: data.code } : {}) });
    if (error || !id) throw new Error(data.code ? 'Could not join. Check the room code and try again.' : 'Could not create your room.');
    return id;
  });