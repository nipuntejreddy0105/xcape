import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assignRoles, clampRule, isRoomFull, makeHostCode, MAX_PLAYERS, normalizeCode, normalizeUsername, usernameError, type RuleKey } from "./xcape";

// games/players have no row access rules for signed-in users, so these actions use the
// admin client — always after checking the caller's identity and room membership/host status.
const admin = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;
type Admin = Awaited<ReturnType<typeof admin>>;

async function uniqueHostCode(db: Admin) {
  for (let i = 0; i < 20; i++) {
    const code = makeHostCode();
    const [{ count: p }, { count: g }] = await Promise.all([
      db.from("profiles").select("id", { count: "exact", head: true }).eq("host_code", code),
      db.from("games").select("id", { count: "exact", head: true }).eq("code", code),
    ]);
    if (!p && !g) return code;
  }
  throw new Error("Could not create a host code. Try again.");
}

export const ensureProfile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle();
  if (error) throw new Error("Could not load your profile.");
  if (data) return data;
  const db = await admin();
  const meta = (context.claims as { user_metadata?: Record<string, unknown> }).user_metadata ?? {};
  const email = String((context.claims as { email?: string }).email ?? "");
  const name = String(meta["full_name"] ?? meta["name"] ?? email.split("@")[0] ?? "Player").slice(0, 40);
  const { data: created, error: insertError } = await context.supabase
    .from("profiles")
    .insert({ id: context.userId, email, name, host_code: await uniqueHostCode(db), avatar_url: typeof meta["avatar_url"] === "string" ? meta["avatar_url"] : null })
    .select("*")
    .single();
  if (insertError) throw new Error("Could not create your profile.");
  return created;
});

export const updateProfile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    name: z.string().trim().min(1).max(40).optional(),
    username: z.string().max(21).optional(),
    units: z.enum(["km", "mi"]).optional(),
    theme: z.enum(["light", "dark"]).optional(),
    avatar_url: z.string().url().max(500).optional(),
  }))
  .handler(async ({ data, context }) => {
    const patch = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)) as { name?: string; username?: string; units?: "km" | "mi"; theme?: "light" | "dark"; avatar_url?: string };
    if (patch.username !== undefined) {
      const problem = usernameError(patch.username);
      if (problem) return { ok: false as const, error: problem };
      patch.username = normalizeUsername(patch.username);
      const db = await admin();
      const { count } = await db.from("profiles").select("id", { count: "exact", head: true }).ilike("username", patch.username).neq("id", context.userId);
      if (count) return { ok: false as const, error: `${patch.username} is taken` };
    }
    const { data: profile, error } = await context.supabase.from("profiles").update(patch).eq("id", context.userId).select("*").single();
    if (error) return { ok: false as const, error: "Could not save. Try again." };
    return { ok: true as const, profile };
  });

export const changeHostCode = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const db = await admin();
  const code = await uniqueHostCode(db);
  const { error } = await context.supabase.from("profiles").update({ host_code: code }).eq("id", context.userId);
  if (error) throw new Error("Could not change your code.");
  await db.from("games").update({ code }).eq("host_id", context.userId).eq("status", "lobby");
  return code;
});

async function profileOf(db: Admin, userId: string) {
  const { data } = await db.from("profiles").select("name, username, avatar_url, host_code").eq("id", userId).single();
  if (!data) throw new Error("Finish setting up your profile first.");
  return data;
}

export const openHostLobby = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const db = await admin();
  const me = await profileOf(db, context.userId);
  let { data: game } = await db.from("games").select("id").eq("host_id", context.userId).eq("status", "lobby").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!game) {
    const { data, error } = await db.from("games").insert({ code: me.host_code, host_id: context.userId }).select("id").single();
    if (error || !data) throw new Error("Could not open your lobby.");
    game = data;
  }
  const { count } = await db.from("players").select("id", { count: "exact", head: true }).eq("game_id", game.id).eq("user_id", context.userId);
  if (!count) await db.from("players").insert({ game_id: game.id, user_id: context.userId, name: me.name ?? "Host", username: me.username, avatar_url: me.avatar_url, role: "hunter" });
  return game.id;
});

export const joinGame = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ code: z.string().max(12) }))
  .handler(async ({ data, context }) => {
    const code = normalizeCode(data.code);
    const db = await admin();
    const { data: game } = await db.from("games").select("id").eq("code", code).eq("status", "lobby").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!game) return { ok: false as const, error: "No open game has that code." };
    const { data: rows } = await db.from("players").select("user_id").eq("game_id", game.id);
    if (rows?.some((r) => r.user_id === context.userId)) return { ok: true as const, gameId: game.id };
    if (isRoomFull(rows?.length ?? 0)) return { ok: false as const, error: `This game is full (${MAX_PLAYERS} players max).` };
    const me = await profileOf(db, context.userId);
    const { error } = await db.from("players").insert({ game_id: game.id, user_id: context.userId, name: me.name ?? "Player", username: me.username, avatar_url: me.avatar_url, role: "runner" });
    if (error) return { ok: false as const, error: "Could not join. Try again." };
    return { ok: true as const, gameId: game.id };
  });

async function requireMember(db: Admin, gameId: string, userId: string) {
  const { data: game } = await db.from("games").select("*").eq("id", gameId).maybeSingle();
  if (!game) throw new Error("This game no longer exists.");
  const { data: players } = await db.from("players").select("id, user_id, name, username, avatar_url, role").eq("game_id", gameId).order("updated_at");
  if (!players?.some((p) => p.user_id === userId)) throw new Error("You're not in this game.");
  return { game, players };
}

async function requireHost(db: Admin, gameId: string, userId: string) {
  const { data: game } = await db.from("games").select("*").eq("id", gameId).maybeSingle();
  if (!game || game.host_id !== userId) throw new Error("Only the host can do that.");
  return game;
}

export const getLobby = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ gameId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { game, players } = await requireMember(await admin(), data.gameId, context.userId);
    return { game, players, isHost: game.host_id === context.userId, me: context.userId };
  });

const ruleKeys = ["round_length_min", "ping_interval_min", "headstart_min", "initial_radius_m", "shrink_interval_min", "min_radius_m", "hunter_count"] as const;

export const updateRules = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    gameId: z.string().uuid(),
    patch: z.object({
      ...Object.fromEntries(ruleKeys.map((k) => [k, z.number().optional()])) as Record<RuleKey, z.ZodOptional<z.ZodNumber>>,
      hunters_can_talk: z.boolean().optional(),
      play_zone_enabled: z.boolean().optional(),
      role_assignment_mode: z.enum(["manual", "random"]).optional(),
    }),
  }))
  .handler(async ({ data, context }) => {
    const db = await admin();
    await requireHost(db, data.gameId, context.userId);
    const patch: Record<string, number | boolean | string> = {};
    for (const [k, v] of Object.entries(data.patch)) {
      if (v === undefined) continue;
      patch[k] = typeof v === "number" ? clampRule(k as RuleKey, v) : v;
    }
    if (typeof patch["initial_radius_m"] === "number") patch["current_radius_m"] = patch["initial_radius_m"];
    const { error } = await db.from("games").update(patch as never).eq("id", data.gameId).eq("status", "lobby");
    if (error) throw new Error("Could not save the rule.");
    return true;
  });

export const setPlayerRole = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ gameId: z.string().uuid(), playerId: z.string().uuid(), role: z.enum(["hunter", "runner"]) }))
  .handler(async ({ data, context }) => {
    const db = await admin();
    await requireHost(db, data.gameId, context.userId);
    const { error } = await db.from("players").update({ role: data.role }).eq("id", data.playerId).eq("game_id", data.gameId);
    if (error) throw new Error("Could not change the role.");
    return true;
  });

export const startGame = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ gameId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const game = await requireHost(db, data.gameId, context.userId);
    const { data: players } = await db.from("players").select("id, role").eq("game_id", data.gameId);
    if (!players || players.length < 2) return { ok: false as const, error: "You need at least 2 players to start." };
    const roles = game.role_assignment_mode === "random"
      ? assignRoles(players.map((p) => p.id), game.hunter_count ?? 2)
      : players.map((p) => ({ id: p.id, role: p.role === "hunter" ? "hunter" : "runner" }));
    if (!roles.some((r) => r.role === "hunter") || !roles.some((r) => r.role === "runner")) return { ok: false as const, error: "You need at least one hunter and one runner." };
    await Promise.all(roles.map((r) => db.from("players").update({ role: r.role }).eq("id", r.id)));
    const { error } = await db.from("games").update({ status: "active", started_at: new Date().toISOString() }).eq("id", data.gameId);
    if (error) return { ok: false as const, error: "Could not start the game." };
    return { ok: true as const };
  });

export const deleteAccount = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const db = await admin();
  const { data: hosted } = await db.from("games").select("id").eq("host_id", context.userId);
  const ids = (hosted ?? []).map((g) => g.id);
  if (ids.length) await db.from("players").delete().in("game_id", ids);
  await db.from("players").delete().eq("user_id", context.userId);
  if (ids.length) await db.from("games").delete().in("id", ids);
  await db.from("profiles").delete().eq("id", context.userId);
  const { error } = await db.auth.admin.deleteUser(context.userId);
  if (error) throw new Error("Could not delete your account.");
  return true;
});
