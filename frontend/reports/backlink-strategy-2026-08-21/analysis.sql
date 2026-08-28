WITH classified AS (
  SELECT
    *,
    CASE
      WHEN category IN (
        'academic',
        'university_career',
        'government_resource',
        'official_docs',
        'open_source_resource',
        'open_source_data',
        'security_standard'
      ) THEN 'Kurumsal proxy'
      WHEN category IN ('resource_library', 'directory') THEN 'Resource library + directory'
      ELSE 'Diğer'
    END AS segment,
    CASE
      WHEN state IN ('contacted', 'submitted', 'human_positive', 'human_negative') THEN 1
      WHEN contacted_on <> '' AND state IN ('deferred', 'excluded', 'closed') THEN 1
      ELSE 0
    END AS is_actioned,
    CASE
      WHEN state = 'human_positive' THEN 1
      ELSE 0
    END AS is_positive,
    CASE
      WHEN state = 'human_negative' THEN 1
      WHEN root_domain IN ('theodinproject.com', 'cssauthor.com')
        AND state = 'excluded'
        AND contacted_on <> '' THEN 1
      ELSE 0
    END AS is_negative
  FROM backlink_outreach_registry
)
SELECT
  segment,
  COUNT(*) AS all_rows,
  SUM(is_actioned) AS actioned,
  SUM(CASE WHEN is_actioned = 1 THEN is_positive ELSE 0 END) AS positive,
  SUM(CASE WHEN is_actioned = 1 THEN is_negative ELSE 0 END) AS negative,
  SUM(CASE WHEN is_actioned = 1 AND is_positive = 0 AND is_negative = 0 THEN 1 ELSE 0 END) AS unresolved
FROM classified
GROUP BY segment
ORDER BY actioned DESC;
