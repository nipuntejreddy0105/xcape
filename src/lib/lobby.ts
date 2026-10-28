import type { Tables } from '@/integrations/supabase/types';
import type { Role } from './game';

export type LobbyPlayer = { id: string; name: string; role: Role; isMe: boolean; tagged: boolean };
export function roomPlayers(rows: Pick<Tables<'players'>, 'id' | 'game_id' | 'name' | 'role' | 'user_id' | 'is_tagged'>[], gameId: string, userId: string): LobbyPlayer[] {
  return rows.filter(row => row.game_id === gameId).map(row => ({
    id: row.id, name: row.name, role: row.role === 'hunter' ? 'hunter' : 'runner',
    isMe: row.user_id === userId, tagged: row.is_tagged ?? false,
  }));
}