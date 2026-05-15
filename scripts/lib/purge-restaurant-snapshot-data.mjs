/**
 * Remove portal snapshot artifacts for a restaurant so intake can rebuild cleanly.
 */

export async function purgeRestaurantSnapshotData(supabase, restaurantId, { dryRun = false } = {}) {
  if (!restaurantId) throw new Error("restaurantId required");

  const { data: snapshots, error: snapErr } = await supabase
    .from("snapshots")
    .select("id, period_label")
    .eq("restaurant_id", restaurantId);
  if (snapErr) throw snapErr;

  const snapshotIds = (snapshots ?? []).map((s) => s.id);
  const summary = {
    restaurantId,
    snapshots: snapshotIds.length,
    snapshotPeriods: (snapshots ?? []).map((s) => s.period_label),
    scorecards: 0,
  };

  if (dryRun) {
    const { count } = await supabase
      .from("scorecards")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId);
    summary.scorecards = count ?? 0;
    return summary;
  }

  if (snapshotIds.length) {
    const { error: catErr } = await supabase
      .from("snapshot_category_scores")
      .delete()
      .in("snapshot_id", snapshotIds);
    if (catErr) throw catErr;
  }

  const { count: scorecardsBefore } = await supabase
    .from("scorecards")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId);
  summary.scorecards = scorecardsBefore ?? 0;

  const { error: scoreErr } = await supabase.from("scorecards").delete().eq("restaurant_id", restaurantId);
  if (scoreErr) throw scoreErr;

  if (snapshotIds.length) {
    const { error: delSnapErr } = await supabase.from("snapshots").delete().eq("restaurant_id", restaurantId);
    if (delSnapErr) throw delSnapErr;
  }

  return summary;
}
