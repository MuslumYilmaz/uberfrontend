-- Deterministic materialization of the verified 2026-08-23 candidate snapshot.
-- Semrush values are browser-UI estimates; GSC values are the 28-day snapshot
-- through 2026-08-20. The query is intentionally descriptive, not predictive.
WITH candidate_snapshot (
  priority,
  opportunity,
  tier,
  authority_score,
  organic_traffic,
  referring_domains,
  gsc_impressions,
  average_position,
  score
) AS (
  VALUES
    (1, 'Indeed — Angular interviews', 'Moonshot', 100, 152200000, 315984, 1958, 18.2, 8),
    (2, 'Scrimba — Interview Prep 2026', 'Beklenen değer', 49, 70639, 5888, 915, 18.7, 9),
    (3, 'Angular University — RxJS mapping', 'Sayfa-1 kaldıracı', 36, 6534, 2012, 346, 10.0, 9),
    (4, 'SitePoint — Angular lifecycle', 'Gerçekçi otorite', 55, 262783, 45940, 520, 18.3, 9),
    (5, 'Vue School — Vue hiring', 'Niş uzman', 32, 4845, 3278, 1610, 17.0, 9)
)
SELECT
  priority,
  opportunity,
  tier,
  authority_score,
  organic_traffic,
  referring_domains,
  gsc_impressions,
  average_position,
  score
FROM candidate_snapshot
ORDER BY priority;
