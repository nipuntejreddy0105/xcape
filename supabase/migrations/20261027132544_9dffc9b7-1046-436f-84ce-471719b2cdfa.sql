CREATE OR REPLACE FUNCTION public.is_room_member(room_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.players WHERE game_id = room_id AND user_id = auth.uid()); $$;
REVOKE ALL ON FUNCTION public.is_room_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_room_member(uuid) TO authenticated;
GRANT SELECT ON public.games TO authenticated;
GRANT SELECT ON public.players TO authenticated;
GRANT UPDATE(role) ON public.players TO authenticated;
GRANT ALL ON public.games, public.players TO service_role;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read their room" ON public.games FOR SELECT TO authenticated USING (public.is_room_member(id));
CREATE POLICY "Members read lobby players" ON public.players FOR SELECT TO authenticated USING (public.is_room_member(game_id) AND EXISTS (SELECT 1 FROM public.games g WHERE g.id=game_id AND g.status='lobby'));
CREATE POLICY "Hosts assign lobby roles" ON public.players FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.games g WHERE g.id=game_id AND g.host_id=auth.uid()::text AND g.status='lobby')) WITH CHECK (EXISTS (SELECT 1 FROM public.games g WHERE g.id=game_id AND g.host_id=auth.uid()::text AND g.status='lobby'));
CREATE OR REPLACE FUNCTION public.enter_lobby(player_name text, room_code text DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE room public.games; result uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to join a room'; END IF;
 IF length(trim(player_name)) < 1 OR length(trim(player_name)) > 40 THEN RAISE EXCEPTION 'Enter a name between 1 and 40 characters'; END IF;
 IF room_code IS NULL THEN
 INSERT INTO public.games(code,host_id) VALUES (upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),auth.uid()::text) RETURNING * INTO room;
 ELSE
 SELECT * INTO room FROM public.games WHERE code=upper(trim(room_code)) AND status='lobby' FOR UPDATE;
 IF room.id IS NULL THEN RAISE EXCEPTION 'No open room has that code'; END IF;
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.players WHERE game_id=room.id AND user_id=auth.uid()) THEN
 INSERT INTO public.players(game_id,user_id,name,role) VALUES(room.id,auth.uid(),trim(player_name),CASE WHEN room.host_id=auth.uid()::text THEN 'hunter' ELSE 'runner' END);
 END IF;
 RETURN room.id;
END; $$;
REVOKE ALL ON FUNCTION public.enter_lobby(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enter_lobby(text,text) TO authenticated;
CREATE INDEX IF NOT EXISTS players_lobby_game_idx ON public.players(game_id);