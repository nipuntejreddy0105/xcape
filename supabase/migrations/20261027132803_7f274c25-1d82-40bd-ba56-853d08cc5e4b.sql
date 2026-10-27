REVOKE EXECUTE ON FUNCTION public.is_room_member(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.enter_lobby(text,text) FROM anon;
CREATE TABLE public.profiles(id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, name text NOT NULL DEFAULT '', username text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '', updates_email boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read profiles" ON public.profiles FOR SELECT TO authenticated USING (auth.uid()=id);
CREATE POLICY "Owners create profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid()=id);
CREATE POLICY "Owners edit profiles" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid()=id) WITH CHECK (auth.uid()=id);