import { supabase, SUPABASE_ENABLED, type DBProfile } from './supabase';

const LOCAL_KEY = 'morabaraba.localProfile';

export interface LocalProfile {
  username: string;
  avatar_id: number;
  region: string;
  coins: number;
  tier: string;
  wins: number;
  losses: number;
  streak: number;
  id?: string;
}

export function loadLocalProfile(): LocalProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalProfile;
  } catch { return null; }
}

export function saveLocalProfile(p: LocalProfile): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(p));
}

export function clearLocalProfile(): void {
  localStorage.removeItem(LOCAL_KEY);
}

export async function ensureAuthAndProfile(): Promise<{ id: string | null }> {
  if (!SUPABASE_ENABLED || !supabase) return { id: null };
  let { data } = await supabase.auth.getSession();
  if (!data.session) {
    const signIn = await supabase.auth.signInAnonymously();
    if (signIn.error) {
      console.warn('Anonymous sign-in failed:', signIn.error.message);
      return { id: null };
    }
    data = { session: signIn.data.session };
  }
  return { id: data.session?.user.id ?? null };
}

export async function upsertProfile(p: LocalProfile, userId: string): Promise<DBProfile | null> {
  if (!SUPABASE_ENABLED || !supabase) return null;
  const payload = {
    id: userId,
    username: p.username,
    avatar_id: p.avatar_id,
    region: p.region,
  };
  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();
  if (error) { console.warn('upsertProfile error:', error.message); return null; }
  return data as DBProfile;
}

export async function fetchProfileRemote(userId: string): Promise<DBProfile | null> {
  if (!SUPABASE_ENABLED || !supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) { console.warn('fetchProfileRemote:', error.message); return null; }
  return data as DBProfile | null;
}

export function coinReward(mode: 'ai_easy' | 'ai_medium' | 'ai_hard' | 'local' | 'online'): number {
  switch (mode) {
    case 'ai_easy': return 5;
    case 'ai_medium': return 10;
    case 'ai_hard': return 20;
    case 'local': return 15;
    case 'online': return 25;
  }
}

export async function awardCoinsRemote(
  userId: string,
  amount: number,
  reason: string,
  referenceId?: string
): Promise<number | null> {
  if (!SUPABASE_ENABLED || !supabase) return null;
  const { data, error } = await supabase.rpc('award_coins', {
    p_profile_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_reference_id: referenceId ?? null,
    p_metadata: null,
  });
  if (error) { console.warn('award_coins:', error.message); return null; }
  return data as number;
}
