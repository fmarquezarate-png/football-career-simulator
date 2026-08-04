"use client";
import type { CareerState } from "../data/types";
import { createSupabaseBrowserClient } from "../supabase/client";

/** Persiste la carrera del usuario logueado. Insert-or-update por id. */
export async function saveCloudCareer(state: CareerState, userId: string): Promise<CareerState> {
  const supabase = createSupabaseBrowserClient();
  const payload = {
    id: state.id,
    user_id: userId,
    share_slug: state.id ? undefined : slugify(state.playerName),
    is_public: false,
    player_name: state.playerName,
    nationality: state.nationality,
    position: state.position,
    difficulty: state.difficulty,
    current_team_id: state.currentTeamId,
    current_league_id: state.currentLeagueId,
    age: state.age,
    overall: state.overall,
    potential: state.potential,
    reputation: state.reputation,
    morale: state.morale,
    fitness: state.fitness,
    season_number: state.seasonNumber,
    week: state.week,
    is_retired: state.isRetired,
    attributes: state.attributes,
    totals: state.totals,
    state,
  };
  const { data, error } = await supabase
    .from("careers")
    .upsert(payload, { onConflict: "id" })
    .select("id, share_slug")
    .single();
  if (error) throw error;
  return { ...state, id: data.id };
}

export async function togglePublic(careerId: string, isPublic: boolean): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("careers")
    .update({ is_public: isPublic })
    .eq("id", careerId)
    .select("share_slug")
    .single();
  if (error) throw error;
  return data.share_slug as string;
}

export async function listMyCareers() {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from("careers").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

function slugify(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    + "-" + Math.random().toString(36).slice(2, 6);
}
