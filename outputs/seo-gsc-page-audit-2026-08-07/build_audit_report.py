#!/usr/bin/env python3
"""Build a reproducible audit summary and portable-report artifact from the GSC exports."""

from __future__ import annotations

import json
import math
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


OUTPUT_DIR = Path(__file__).resolve().parent
EXTRACT_PATH = OUTPUT_DIR / "source_extract.json"
TARGET_URL = "https://frontendatlas.com/angular/trivia/angular-http-what-actually-cancels-request"
TITLE = "FrontendAtlas Angular HttpClient sayfası: GSC ve uygulama denetimi"


def ratio(numerator: float, denominator: float) -> float:
    return numerator / denominator if denominator else 0.0


def pct_delta(current: float, previous: float) -> float:
    return (current - previous) / previous if previous else 0.0


def weighted_position(rows: list[list], impressions_index: int, position_index: int) -> float:
    impressions = sum(float(row[impressions_index] or 0) for row in rows)
    if not impressions:
        return 0.0
    numerator = sum(
        float(row[impressions_index] or 0) * float(row[position_index] or 0)
        for row in rows
    )
    return numerator / impressions


def fisher_two_sided(clicks_current: int, impressions_current: int,
                     clicks_prior: int, impressions_prior: int) -> float:
    successes = clicks_current + clicks_prior
    total = impressions_current + impressions_prior
    minimum = max(0, impressions_current - (total - successes))
    maximum = min(impressions_current, successes)

    def log_choose(n: int, k: int) -> float:
        return math.lgamma(n + 1) - math.lgamma(k + 1) - math.lgamma(n - k + 1)

    def probability(x: int) -> float:
        return math.exp(
            log_choose(successes, x)
            + log_choose(total - successes, impressions_current - x)
            - log_choose(total, impressions_current)
        )

    observed = probability(clicks_current)
    return sum(
        probability(x)
        for x in range(minimum, maximum + 1)
        if probability(x) <= observed + 1e-15
    )


def query_cluster(query: str) -> str:
    q = query.lower()
    if "interview" in q:
        return "Interview"
    if any(token in q for token in (
        "testrequest", " testing", " test ", "debug", "devtools", "stale", "memory leak"
    )):
        return "Debugging / testing"

    docs_modifier = any(token in q for token in ("docs", "documentation", "official", "angular.dev"))
    core_semantics = (
        "httpclient" in q
        and "unsubscribe" in q
        and ("cancel" in q or "abort" in q)
    )
    if docs_modifier:
        return "Official docs / adjacent"
    if "cancel request" in q or "cancel http request" in q or "request cancellation" in q:
        return "Implementation"
    if not core_semantics:
        return "Official docs / adjacent"
    return "Direct answer"


def source_query(engine: str, code: str, description: str, tables: list[str],
                 filters: list[str], definitions: list[str]) -> dict:
    return {
        "engine": engine,
        "sql": code,
        "description": description,
        "executed_at": "2026-08-07",
        "tables_used": tables,
        "filters": filters,
        "metric_definitions": definitions,
    }


def main() -> None:
    exports = json.loads(EXTRACT_PATH.read_text(encoding="utf-8"))
    by_file = {item["file"]: item for item in exports}
    history_file = "frontendatlas.com-Performance-on-Search-2026-08-07.xlsx"
    target_file = "frontendatlas.com-Performance-on-Search-2026-08-07 (1).xlsx"
    site_file = "frontendatlas.com-Performance-on-Search-2026-08-07 (2).xlsx"
    history = by_file[history_file]["sheets"]
    target = by_file[target_file]["sheets"]
    site = by_file[site_file]["sheets"]

    page_row = target["Sayfa sayısı"][1]
    current = {
        "clicks": int(page_row[1]),
        "impressions": int(page_row[3]),
        "ctr": ratio(page_row[1], page_row[3]),
        "position": float(page_row[7]),
    }
    prior = {
        "clicks": int(page_row[2]),
        "impressions": int(page_row[4]),
        "ctr": ratio(page_row[2], page_row[4]),
        "position": float(page_row[8]),
    }

    query_rows = target["Sorgular"][1:]
    current_query_impressions = sum(int(row[3] or 0) for row in query_rows)
    prior_query_impressions = sum(int(row[4] or 0) for row in query_rows)
    current_query_clicks = sum(int(row[1] or 0) for row in query_rows)
    prior_query_clicks = sum(int(row[2] or 0) for row in query_rows)
    query_coverage_current = ratio(current_query_impressions, current["impressions"])
    query_coverage_prior = ratio(prior_query_impressions, prior["impressions"])

    cluster_rows: dict[str, list[list]] = defaultdict(list)
    for row in query_rows:
        cluster_rows[query_cluster(str(row[0]))].append(row)

    cluster_order = [
        "Official docs / adjacent",
        "Direct answer",
        "Implementation",
        "Debugging / testing",
        "Interview",
    ]
    clusters = []
    for name in cluster_order:
        rows = cluster_rows.get(name, [])
        current_impressions = sum(int(row[3] or 0) for row in rows)
        prior_impressions = sum(int(row[4] or 0) for row in rows)
        clusters.append({
            "cluster": name,
            "current_impressions": current_impressions,
            "prior_impressions": prior_impressions,
            "current_visible_share": ratio(current_impressions, current_query_impressions),
            "prior_visible_share": ratio(prior_impressions, prior_query_impressions),
            "current_full_page_lower_bound": ratio(current_impressions, current["impressions"]),
            "current_position": weighted_position(rows, 3, 7),
            "prior_position": weighted_position(rows, 4, 8),
            "query_count": len(rows),
        })

    top_queries = []
    for rank, row in enumerate(sorted(query_rows, key=lambda item: int(item[3] or 0), reverse=True)[:10], 1):
        top_queries.append({
            "rank": rank,
            "query": row[0],
            "cluster": query_cluster(str(row[0])),
            "current_impressions": int(row[3] or 0),
            "current_position": float(row[7] or 0),
            "prior_impressions": int(row[4] or 0),
            "prior_position": float(row[8] or 0),
            "visible_clicks": int(row[1] or 0),
        })

    history_page = history["Sayfa sayısı"][1]
    history_summary = {
        "clicks": int(history_page[1]),
        "impressions": int(history_page[2]),
        "ctr": ratio(history_page[1], history_page[2]),
        "position": float(history_page[4]),
        "query_impressions": sum(int(row[2] or 0) for row in history["Sorgular"][1:]),
    }
    history_summary["query_coverage"] = ratio(
        history_summary["query_impressions"], history_summary["impressions"]
    )

    site_page_rows = site["Sayfa sayısı"][1:]
    target_impression_rank = 1 + sum(int(row[3] or 0) > current["impressions"] for row in site_page_rows)
    peer_rows = [
        row for row in site_page_rows
        if row[0] != TARGET_URL and int(row[3] or 0) >= 100 and 5 < float(row[7] or 0) <= 10
    ]
    peer_clicks = sum(int(row[1] or 0) for row in peer_rows)
    peer_impressions = sum(int(row[3] or 0) for row in peer_rows)
    peer_baseline = ratio(peer_clicks, peer_impressions)

    daily_rows = history["Grafik"][1:]
    clean_boundary_rows = [row for row in daily_rows if row[0] in ("2026-08-03", "2026-08-04")]
    boundary_impressions = sum(int(row[2] or 0) for row in clean_boundary_rows)
    boundary_clicks = sum(int(row[1] or 0) for row in clean_boundary_rows)

    p_value = fisher_two_sided(
        current["clicks"], current["impressions"], prior["clicks"], prior["impressions"]
    )
    all_query_semantic_impressions = sum(
        int(row[3] or 0)
        for row in query_rows
        if "httpclient" in str(row[0]).lower()
        and "unsubscribe" in str(row[0]).lower()
        and ("cancel" in str(row[0]).lower() or "abort" in str(row[0]).lower())
    )
    docs_semantic_impressions = sum(
        int(row[3] or 0)
        for row in query_rows
        if "httpclient" in str(row[0]).lower()
        and "unsubscribe" in str(row[0]).lower()
        and ("cancel" in str(row[0]).lower() or "abort" in str(row[0]).lower())
        and any(token in str(row[0]).lower() for token in ("docs", "documentation", "official", "angular.dev"))
    )

    headline = [{
        "current_clicks": current["clicks"],
        "prior_clicks": prior["clicks"],
        "click_change": pct_delta(current["clicks"], prior["clicks"]),
        "current_impressions": current["impressions"],
        "prior_impressions": prior["impressions"],
        "impression_change": pct_delta(current["impressions"], prior["impressions"]),
        "current_ctr": current["ctr"],
        "prior_ctr": prior["ctr"],
        "ctr_change": pct_delta(current["ctr"], prior["ctr"]),
        "current_position": current["position"],
        "prior_position": prior["position"],
        "position_change": current["position"] - prior["position"],
        "query_coverage": query_coverage_current,
        "prior_query_coverage": query_coverage_prior,
    }]

    period_comparison = [
        {
            "metric": "Clicks",
            "current": str(current["clicks"]),
            "prior": str(prior["clicks"]),
            "change": "-50.0%",
            "interpretation": "Yalnızca 3 ve 6 tıklama var; iki taraflı Fisher p=%.2f, bu nedenle watch seviyesinde gürültü." % p_value,
        },
        {
            "metric": "Impressions",
            "current": f'{current["impressions"]:,}',
            "prior": f'{prior["impressions"]:,}',
            "change": f'{pct_delta(current["impressions"], prior["impressions"]):+.1%}',
            "interpretation": "Ortalama konum sabitken talep/gösterim azaldı; content decay kanıtı değil.",
        },
        {
            "metric": "All-query CTR",
            "current": f'{current["ctr"]:.3%}',
            "prior": f'{prior["ctr"]:.3%}',
            "change": f'{pct_delta(current["ctr"], prior["ctr"]):+.1%}',
            "interpretation": "Sayfa toplamını kullan; 0 tıklamalı görünür-query alt kümesini kullanma.",
        },
        {
            "metric": "Average position",
            "current": f'{current["position"]:.2f}',
            "prior": f'{prior["position"]:.2f}',
            "change": f'{current["position"] - prior["position"]:+.2f}',
            "interpretation": "Pratikte sabit; daha düşük değer daha iyidir.",
        },
    ]

    reconciliation = [
        {
            "grain": "All-query page total",
            "current_clicks": current["clicks"],
            "current_impressions": current["impressions"],
            "coverage": 1.0,
            "safe_use": "Authoritative page KPI denominator",
        },
        {
            "grain": "Visible query subset",
            "current_clicks": current_query_clicks,
            "current_impressions": current_query_impressions,
            "coverage": query_coverage_current,
            "safe_use": "Directional intent evidence only; no query CTR attribution",
        },
        {
            "grain": "Visible device subset",
            "current_clicks": sum(int(row[1] or 0) for row in target["Cihazlar"][1:]),
            "current_impressions": sum(int(row[3] or 0) for row in target["Cihazlar"][1:]),
            "coverage": ratio(sum(int(row[3] or 0) for row in target["Cihazlar"][1:]), current["impressions"]),
            "safe_use": "Partial subset; not true device mix or device CTR",
        },
    ]

    app_comparison = [
        {
            "area": "Page KPI totals",
            "current_app": "3 / 2,519 / 0.119% / 6.646",
            "audit_verdict": "Matches GSC export (rounding only)",
            "state": "Correct",
        },
        {
            "area": "Current empty state",
            "current_app": "Green 'No urgent action' with 32/56 days",
            "audit_verdict": "No page was evaluated; state should be 'Not evaluated'",
            "state": "Misleading UI",
        },
        {
            "area": "Decay detector after full backfill",
            "current_app": "content_decay; confidence 0.68; +3 expected clicks",
            "audit_verdict": "6 to 3 clicks is low-volume noise (p about 0.74), rank improved",
            "state": "False-positive risk",
        },
        {
            "area": "CTR detector",
            "current_app": "No action; target 0.119% exceeds 0.106% peer baseline",
            "audit_verdict": "No action is fine, but 9 peers/10 clicks is an insufficient baseline",
            "state": "Under-explained",
        },
        {
            "area": "Intent detector",
            "current_app": "No mismatch; exact top query share 14.6%, coverage 29.7%",
            "audit_verdict": "Topical intent aligns; exact-query-as-cluster misses semantic family and docs trust modifier",
            "state": "Conservative but shallow",
        },
        {
            "area": "Technical detector",
            "current_app": "No technical action",
            "audit_verdict": "Correct: indexed, fetch allowed, self-canonical, visible",
            "state": "Correct",
        },
        {
            "area": "Recent-change awareness",
            "current_app": "No pre-detector cooldown tied to live metadata/crawl",
            "audit_verdict": "Current window is almost entirely pre-change; action generation must pause",
            "state": "Missing guard",
        },
    ]

    timeline = [
        {
            "date": "2026-08-03",
            "event": "Content/SEO metadata updated",
            "meaning": "New title: Angular HttpClient Unsubscribe: 6 Tests & DevTools",
        },
        {
            "date": "2026-08-04 01:09",
            "event": "Google smartphone crawl",
            "meaning": "URL Inspection reports successful fetch and matching canonical",
        },
        {
            "date": "2026-08-05 to 2026-09-01",
            "event": "Clean 28-day observation window",
            "meaning": "Keep title, meta and H1 unchanged; use finalized all-query page totals",
        },
        {
            "date": "2026-09-04 or later",
            "event": "Earliest 28-day decision read",
            "meaning": "Assumes the configured 3-day finalized-data lag",
        },
    ]

    actions = [
        {
            "priority": "P0",
            "action": "Persist analysis readiness and gate reasons",
            "why": "The current green empty state hides that 0 pages were evaluated.",
            "acceptance": "32/56 shows Not evaluated; green no-action only after a complete current run.",
            "effort": "M",
        },
        {
            "priority": "P0",
            "action": "Add material-change and crawl-aware cooldown",
            "why": "The 28-day export does not measure the Aug 3 title change.",
            "acceptance": "This URL shows observing_change 0/14 and no detector action through Aug 4.",
            "effort": "M",
        },
        {
            "priority": "P0",
            "action": "Harden content-decay rules for low click counts",
            "why": "The current rule would call 6 to 3 clicks content decay despite p about 0.74.",
            "acceptance": "Fixture becomes low_sample/watch; high-volume persistent loss still triggers.",
            "effort": "S-M",
        },
        {
            "priority": "P1",
            "action": "Separate semantic clusters from exact queries",
            "why": "740/749 visible impressions share cancel/abort semantics although no exact query dominates.",
            "acceptance": "Show visible share, full-page lower bound and coverage; keep exact-query drilldown.",
            "effort": "L",
        },
        {
            "priority": "P1",
            "action": "Attach quality metadata to CTR peer baselines",
            "why": "Nine mixed peers and ten clicks can normalize a weak CTR.",
            "acceptance": "Baseline marked insufficient and the page is monitor, not healthy or urgent.",
            "effort": "M-L",
        },
        {
            "priority": "P1",
            "action": "Show per-page grain reconciliation",
            "why": "Query/device rows expose only 29.7% of page impressions and zero attributed clicks.",
            "acceptance": "Page, query and device totals are labeled separately with coverage.",
            "effort": "M",
        },
        {
            "priority": "P2",
            "action": "Store owner-triggered URL Inspection snapshots",
            "why": "Index/crawl/canonical evidence should be distinct from sitemap property health.",
            "acceptance": "This URL stays technical PASS; sitemap temporary error is a separate warning.",
            "effort": "S-M",
        },
    ]

    analysis = {
        "target_url": TARGET_URL,
        "current": current,
        "prior": prior,
        "fisher_two_sided_p": p_value,
        "query_detail": {
            "current_impressions": current_query_impressions,
            "prior_impressions": prior_query_impressions,
            "current_clicks": current_query_clicks,
            "prior_clicks": prior_query_clicks,
            "current_coverage": query_coverage_current,
            "prior_coverage": query_coverage_prior,
            "semantic_core_impressions": all_query_semantic_impressions,
            "semantic_core_visible_share": ratio(all_query_semantic_impressions, current_query_impressions),
            "docs_semantic_impressions": docs_semantic_impressions,
            "docs_semantic_visible_share": ratio(docs_semantic_impressions, current_query_impressions),
        },
        "history": history_summary,
        "site_context": {
            "page_count": len(site_page_rows),
            "target_impression_rank": target_impression_rank,
            "peer_count": len(peer_rows),
            "peer_clicks": peer_clicks,
            "peer_impressions": peer_impressions,
            "peer_ctr": peer_baseline,
        },
        "change_boundary": {
            "aug_3_4_impressions": boundary_impressions,
            "aug_3_4_clicks": boundary_clicks,
            "clean_post_crawl_days_in_export": 0,
        },
        "clusters": clusters,
        "top_queries": top_queries,
        "app_comparison": app_comparison,
        "recommended_actions": actions,
    }
    (OUTPUT_DIR / "analysis_results.json").write_text(
        json.dumps(analysis, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    manifest_sources = [
        {"id": "target_compare", "label": "GSC target-page comparison", "path": target_file},
        {"id": "target_history", "label": "GSC target-page history", "path": history_file},
        {"id": "site_compare", "label": "GSC site-wide comparison", "path": site_file},
        {"id": "inspection", "label": "User-provided URL Inspection result", "path": "URL Inspection snapshot, 2026-08-07"},
        {"id": "live_page", "label": "Live target page", "href": TARGET_URL},
        {"id": "angular_docs", "label": "Angular official HttpClient guide", "href": "https://angular.dev/guide/http/making-requests"},
        {"id": "app_audit", "label": "Local SEO analysis code and deterministic rule replay", "path": "analysis.js, rule-engine.js, seo-dashboard.component.html"},
        {"id": "audit_synthesis", "label": "Derived audit synthesis", "path": "GSC exports plus local application audit"},
    ]
    sources = [
        {
            "id": "target_compare",
            "label": "GSC target-page comparison",
            "path": target_file,
            "query": source_query(
                "xlsx",
                "SELECT * FROM target_page_compare WHERE page_url = 'exact target URL' AND current_window = '2026-07-08/2026-08-04'",
                "Reads the exact URL current and prior 28-day totals plus visible query and device rows.",
                ["Sayfa sayisi!A1:I2", "Sorgular!A1:I56", "Cihazlar!A1:I4", "Filtreler!A1:B4"],
                ["Search type = Web", "Page = exact target URL", "Current = 2026-07-08 to 2026-08-04", "Prior = 2026-06-10 to 2026-07-07"],
                [
                    "All-query CTR = page clicks / page impressions.",
                    "Visible query coverage = sum of visible query impressions / all-query page impressions.",
                    "Query-cluster shares use impressions only because visible query clicks are zero while page clicks are privacy-filtered.",
                    "Average position is the GSC impression-weighted average; lower is better.",
                ],
            ),
        },
        {
            "id": "target_history",
            "label": "GSC target-page history",
            "path": history_file,
            "query": source_query(
                "xlsx",
                "SELECT * FROM target_page_history WHERE page_url = 'exact target URL' AND date BETWEEN DATE '2026-01-25' AND DATE '2026-08-04'",
                "Reads daily history and long-window page/query totals for the exact URL.",
                ["Grafik!A1:E193", "Sayfa sayisi!A1:E2", "Sorgular!A1:E71", "Filtreler!A1:B4"],
                ["Search type = Web", "Page = exact target URL", "Date = 2026-01-25 to 2026-08-04"],
                ["Long-window query coverage = visible query impressions / all-query page impressions."],
            ),
        },
        {
            "id": "site_compare",
            "label": "GSC site-wide comparison",
            "path": site_file,
            "query": source_query(
                "xlsx",
                "SELECT * FROM site_page_compare WHERE current_window = '2026-07-08/2026-08-04'",
                "Reads site-wide page rows for impression rank and the application's leave-one-out position bucket.",
                ["Sayfa sayisi!A1:I322", "Filtreler!A1:B3"],
                ["Search type = Web", "No page filter", "Current = 2026-07-08 to 2026-08-04", "Prior = 2026-06-10 to 2026-07-07"],
                ["Peer CTR = peer clicks / peer impressions for pages with at least 100 impressions and average position above 5 through 10, excluding the target."],
            ),
        },
        {
            "id": "inspection",
            "label": "User-provided URL Inspection result",
            "path": "URL Inspection snapshot, 2026-08-07",
            "query": source_query(
                "manual",
                "SELECT indexed, crawl_allowed, fetch_status, canonical_status, last_crawl, sitemap_message FROM url_inspection_snapshot WHERE page_url = 'exact target URL'",
                "User supplied the URL Inspection fields in chat.",
                ["URL Inspection result"],
                ["Target URL only", "Observed 2026-08-07"],
                ["Technical pass requires indexed, crawl/index allowed, successful fetch and matching selected canonical."],
            ),
        },
        {
            "id": "live_page",
            "label": "Live target page",
            "href": TARGET_URL,
            "query": source_query(
                "http",
                "SELECT seo_title, meta_description, canonical_url, h1, content_updated_at FROM live_page_snapshot WHERE page_url = 'exact target URL'",
                "Verifies the currently served SEO title, description, canonical and page content.",
                ["Live HTML response"],
                ["Fetched 2026-08-07"],
                ["Current SEO title is the served HTML title, not the inventory display title."],
            ),
        },
        {
            "id": "angular_docs",
            "label": "Angular official HttpClient guide",
            "href": "https://angular.dev/guide/http/making-requests",
            "query": source_query(
                "http",
                "SELECT section_heading, reviewed_claim FROM angular_http_guide_review WHERE section_heading = 'HTTP Observables'",
                "Confirms the official documentation discusses unsubscribe, request abort and switchMap cleanup.",
                ["Angular Making HTTP requests guide"],
                ["Reviewed 2026-08-07"],
                ["Used only to validate topical/source-intent alignment, not to calculate GSC metrics."],
            ),
        },
        {
            "id": "app_audit",
            "label": "Local SEO analysis code and deterministic rule replay",
            "path": "analysis.js, rule-engine.js, seo-dashboard.component.html",
            "query": source_query(
                "javascript",
                "SELECT * FROM rule_engine_replay WHERE page_url = 'exact target URL' AND rule_version = 'balanced-v1'",
                "Reviews balanced-analysis readiness, detector thresholds, baseline construction and the empty action state.",
                ["analysis.js:68-89", "analysis.js:105-180", "rule-engine.js:42-168", "seo-dashboard.component.html:348-353"],
                ["Rule version = balanced-v1", "Target URL only", "Uses exact export totals"],
                [
                    "Balanced analysis requires two contiguous 28-day page windows.",
                    "Current content-decay rule fires on at least 20% click decline with prior impressions at least 100, without a click-count or significance floor.",
                    "Current CTR baseline uses leave-one-out pages in the same broad position bucket and at least 300 remaining impressions.",
                ],
            ),
        },
        {
            "id": "audit_synthesis",
            "label": "Derived audit synthesis",
            "path": "GSC exports plus local application audit",
            "query": source_query(
                "python",
                "SELECT * FROM audit_synthesis WHERE page_url = 'exact target URL' AND snapshot_date = DATE '2026-08-07'",
                "Combines reviewed evidence into the comparison and prioritized action plan.",
                [target_file, history_file, site_file, "URL Inspection result", "Local SEO analysis code"],
                ["Target URL only", "No mutation of source workbooks or production data"],
                [
                    "Fisher exact p-value compares 3 of 2519 with 6 of 3156 clicks.",
                    "A recent-change guard uses clean finalized days after the last known Google crawl.",
                    "Recommendations are audit judgments, not automated production changes.",
                ],
            ),
        },
    ]

    artifact = {
        "surface": "report",
        "manifest": {
            "version": 1,
            "surface": "report",
            "title": TITLE,
            "description": "A source-backed comparison of GSC exports, the live page and the owner-only SEO application's current logic.",
            "generatedAt": generated_at,
            "cards": [
                {
                    "id": "clicks_card",
                    "description": "Exact-page all-query clicks for the current and prior 28-day windows.",
                    "dataset": "headline",
                    "sourceId": "target_compare",
                    "metrics": [
                        {"label": "Current clicks", "field": "current_clicks", "format": "number"},
                        {"label": "Prior clicks", "field": "prior_clicks", "format": "number"},
                        {"label": "Change", "field": "click_change", "format": "percent", "signed": True},
                    ],
                },
                {
                    "id": "impressions_card",
                    "description": "Exact-page all-query impressions for the current and prior 28-day windows.",
                    "dataset": "headline",
                    "sourceId": "target_compare",
                    "metrics": [
                        {"label": "Current impressions", "field": "current_impressions", "format": "compact"},
                        {"label": "Prior impressions", "field": "prior_impressions", "format": "compact"},
                        {"label": "Change", "field": "impression_change", "format": "percent", "signed": True},
                    ],
                },
                {
                    "id": "ctr_card",
                    "description": "All-query page CTR, calculated from page totals rather than visible query rows.",
                    "dataset": "headline",
                    "sourceId": "target_compare",
                    "metrics": [
                        {"label": "Current CTR", "field": "current_ctr", "format": "percent"},
                        {"label": "Prior CTR", "field": "prior_ctr", "format": "percent"},
                        {"label": "Relative change", "field": "ctr_change", "format": "percent", "signed": True},
                    ],
                },
                {
                    "id": "position_card",
                    "description": "GSC average position; lower values are better.",
                    "dataset": "headline",
                    "sourceId": "target_compare",
                    "metrics": [
                        {"label": "Current position", "field": "current_position", "format": "number"},
                        {"label": "Prior position", "field": "prior_position", "format": "number"},
                        {"label": "Movement", "field": "position_change", "format": "number", "signed": True},
                    ],
                },
                {
                    "id": "coverage_card",
                    "description": "Share of all-query page impressions represented by visible query rows.",
                    "dataset": "headline",
                    "sourceId": "target_compare",
                    "metrics": [
                        {"label": "Visible query coverage", "field": "query_coverage", "format": "percent"},
                        {"label": "Prior coverage", "field": "prior_query_coverage", "format": "percent"},
                    ],
                },
            ],
            "charts": [
                {
                    "id": "query_cluster_chart",
                    "title": "Intent kümesine göre görünür sorgu gösterimleri",
                    "subtitle": "Yalnızca mevcut dönem; görünür alt küme tüm sayfa gösterimlerinin %29,7'sini kapsıyor.",
                    "headerMarkdown": "Kümeler deterministik anahtar kelime aileleridir; model tarafından üretilmiş kesin intent etiketleri değildir. Sayfanın üç tıklaması da query satırlarından gizlendiği için tıklamalar grafiğe dahil edilmedi.",
                    "type": "horizontalBar",
                    "dataset": "clusters",
                    "sourceId": "target_compare",
                    "encodings": {
                        "x": {"field": "cluster", "type": "nominal", "label": "Intent kümesi"},
                        "y": {"field": "current_impressions", "type": "quantitative", "label": "Görünür gösterimler"},
                        "tooltip": [
                            {"field": "current_visible_share", "type": "quantitative", "label": "Visible share", "format": "percent"},
                            {"field": "current_full_page_lower_bound", "type": "quantitative", "label": "Full-page lower bound", "format": "percent"},
                            {"field": "prior_impressions", "type": "quantitative", "label": "Prior visible impressions", "format": "number"},
                            {"field": "current_position", "type": "quantitative", "label": "Current average position", "format": "number"},
                        ],
                    },
                    "xAxisTitle": "Query intent kümesi",
                    "yAxisTitle": "Görünür gösterimler (8 Tem-4 Ağu)",
                    "valueFormat": "number",
                    "layout": "wide",
                    "maxRows": 10,
                },
            ],
            "tables": [
                {
                    "id": "period_table",
                    "title": "Hedef sayfa dönem karşılaştırması",
                    "subtitle": "All-query sayfa toplamları; 8 Tem-4 Ağu ile 10 Haz-7 Tem.",
                    "dataset": "period_comparison",
                    "sourceId": "target_compare",
                    "density": "comfortable",
                    "columns": [
                        {"field": "metric", "label": "Metric", "type": "text"},
                        {"field": "current", "label": "Current", "type": "text"},
                        {"field": "prior", "label": "Prior", "type": "text"},
                        {"field": "change", "label": "Change", "type": "text"},
                        {"field": "interpretation", "label": "Safe interpretation", "type": "text"},
                    ],
                },
                {
                    "id": "reconciliation_table",
                    "title": "Sayfa bazında veri-grain uzlaştırması",
                    "subtitle": "Query ve device detayının neden all-query sayfa toplamının yerini alamadığı.",
                    "dataset": "reconciliation",
                    "sourceId": "target_compare",
                    "density": "comfortable",
                    "columns": [
                        {"field": "grain", "label": "Grain", "type": "text"},
                        {"field": "current_clicks", "label": "Clicks", "type": "number"},
                        {"field": "current_impressions", "label": "Impressions", "type": "number"},
                        {"field": "coverage", "label": "Coverage", "type": "percent"},
                        {"field": "safe_use", "label": "Safe use", "type": "text"},
                    ],
                },
                {
                    "id": "cluster_table",
                    "title": "Query kümesi detayı",
                    "subtitle": "Yalnızca gösterim tabanlıdır; sayfa alt sınırı görünür satırların ötesine taşan iddiaları engeller.",
                    "dataset": "clusters",
                    "sourceId": "target_compare",
                    "density": "comfortable",
                    "defaultSort": {"field": "current_impressions", "direction": "desc"},
                    "columns": [
                        {"field": "cluster", "label": "Cluster", "type": "text"},
                        {"field": "current_impressions", "label": "Current imps", "type": "number"},
                        {"field": "current_visible_share", "label": "Visible share", "type": "percent"},
                        {"field": "current_full_page_lower_bound", "label": "Page lower bound", "type": "percent"},
                        {"field": "current_position", "label": "Current pos", "type": "number"},
                        {"field": "prior_impressions", "label": "Prior imps", "type": "number"},
                    ],
                },
                {
                    "id": "top_queries_table",
                    "title": "En yüksek görünür sorgular",
                    "subtitle": "Mevcut gösterime göre sıralı; query tıklamalarının tamamı bu exportta gizli.",
                    "dataset": "top_queries",
                    "sourceId": "target_compare",
                    "density": "compact",
                    "defaultSort": {"field": "rank", "direction": "asc"},
                    "columns": [
                        {"field": "rank", "label": "Rank", "type": "number"},
                        {"field": "query", "label": "Query", "type": "text"},
                        {"field": "cluster", "label": "Cluster", "type": "text"},
                        {"field": "current_impressions", "label": "Current imps", "type": "number"},
                        {"field": "current_position", "label": "Current pos", "type": "number"},
                        {"field": "prior_impressions", "label": "Prior imps", "type": "number"},
                    ],
                },
                {
                    "id": "timeline_table",
                    "title": "Ölçüm zaman çizgisi",
                    "subtitle": "Temiz pencere bilinen Google crawl sınırından sonra başlamalı.",
                    "dataset": "timeline",
                    "sourceId": "audit_synthesis",
                    "density": "comfortable",
                    "columns": [
                        {"field": "date", "label": "Date", "type": "text"},
                        {"field": "event", "label": "Event", "type": "text"},
                        {"field": "meaning", "label": "Decision meaning", "type": "text"},
                    ],
                },
                {
                    "id": "app_comparison_table",
                    "title": "Uygulama çıktısı ve audit sonucu",
                    "subtitle": "Mevcut balanced-v1 davranışında doğru, eksik veya riskli olan noktalar.",
                    "dataset": "app_comparison",
                    "sourceId": "app_audit",
                    "density": "comfortable",
                    "columns": [
                        {"field": "area", "label": "Area", "type": "text"},
                        {"field": "current_app", "label": "Current app", "type": "text"},
                        {"field": "audit_verdict", "label": "Audit conclusion", "type": "text"},
                        {"field": "state", "label": "State", "type": "text"},
                    ],
                },
                {
                    "id": "actions_table",
                    "title": "Öncelikli uygulama iyileştirmeleri",
                    "subtitle": "Önce yanlış güven ve false-positive SEO aksiyonlarını engelleyecek şekilde sıralandı.",
                    "dataset": "actions",
                    "sourceId": "audit_synthesis",
                    "density": "comfortable",
                    "columns": [
                        {"field": "priority", "label": "Priority", "type": "text"},
                        {"field": "action", "label": "Change", "type": "text"},
                        {"field": "why", "label": "Why", "type": "text"},
                        {"field": "acceptance", "label": "Acceptance", "type": "text"},
                        {"field": "effort", "label": "Effort", "type": "text"},
                    ],
                },
            ],
            "sources": manifest_sources,
            "blocks": [
                {"id": "title", "type": "markdown", "body": f"# {TITLE}"},
                {
                    "id": "executive_summary",
                    "type": "markdown",
                    "body": (
                        "## Executive Summary\n\n"
                        "### Kullanılan tanımlar\n\n"
                        "- **All-query sayfa toplamı**, exact URL'nin sayfa seviyesindeki tıklama ve gösterimleridir; KPI paydası budur.\n"
                        "- **Visible query coverage**, görünür query gösterimlerinin all-query sayfa gösterimlerine oranıdır; sayfa toplamının kalitesini değil, ne kadarının teşhis edilebildiğini gösterir.\n"
                        "- **Average position**, GSC'nin gösterim-ağırlıklı sıralama değeridir; daha düşük daha iyidir.\n\n"
                        "### Karar\n\n"
                        "Export ile uygulama sayfa toplamlarında uyuşuyor. Teknik indeksleme arızası veya konu seviyesinde intent mismatch kanıtı yok. Bugün için doğru aksiyon: **yeni title/meta/H1'i sabit tutmak, temiz bir post-crawl pencere toplamak ve henüz yeniden yazmamak**.\n\n"
                        "Uygulamanın zorla snippet ya da intent değişikliği üretmemesi yön olarak doğru; fakat ekran yanıltıcı. Gereken 56 günün yalnızca 32'si varken hiçbir sayfa değerlendirilmediği halde UI güven veren bir no-action durumu gösteriyor. Tam veri geldiğinde ise mevcut decay kuralı ters hatayı yaparak düşük hacim ve sabit sıralamaya rağmen 6'dan 3'e tıklamayı `content_decay` sayacak."
                    ),
                },
                {"id": "headline_metrics", "type": "metric-strip", "cardIds": ["clicks_card", "impressions_card", "ctr_card", "position_card", "coverage_card"]},
                {
                    "id": "findings",
                    "type": "markdown",
                    "body": (
                        "## Görsel kanıtla temel bulgular\n\n"
                        f"Mevcut 28 günlük pencerede **{current['impressions']:,} gösterimden {current['clicks']} tıklama** ve **{current['position']:.2f}** ortalama konum var. Önceki pencerede **{prior['impressions']:,} gösterimden {prior['clicks']} tıklama** ve **{prior['position']:.2f}** konum vardı. Bu hacimde CTR farkı ikna edici değil (iki taraflı Fisher p yaklaşık **{p_value:.2f}**).\n\n"
                        f"Hedef, mevcut gösterime göre export edilen {len(site_page_rows)} sayfa içinde **#{target_impression_rank}**; dolayısıyla izlenmeye değer. Ancak query/device detayı sayfa gösterimlerinin yalnızca **{query_coverage_current:.1%}**'sini ve tıklamaların hiçbirini temsil ediyor."
                    ),
                },
                {"id": "period_table_block", "type": "table", "tableId": "period_table"},
                {"id": "reconciliation_block", "type": "table", "tableId": "reconciliation_table"},
                {"id": "cluster_chart_block", "type": "chart", "chartId": "query_cluster_chart"},
                {
                    "id": "intent",
                    "type": "markdown",
                    "body": (
                        "## Intent teşhisi\n\n"
                        f"Görünür talep sayfanın temel sorusuyla güçlü biçimde uyumlu: **{all_query_semantic_impressions}/{current_query_impressions} ({ratio(all_query_semantic_impressions, current_query_impressions):.1%})** görünür gösterimde HttpClient + unsubscribe + cancel/abort semantiği var. Bu bir intent mismatch değil.\n\n"
                        f"Asıl nüans bir **kaynak/güven tercihi**: **{docs_semantic_impressions}/{current_query_impressions} ({ratio(docs_semantic_impressions, current_query_impressions):.1%})** görünür gösterim ayrıca `official`, `docs`, `documentation` veya `angular.dev` içeriyor. Sayfa soruyu zaten yanıtlıyor ve Angular kaynaklarına atıf yapıyor; fırsat doğrudan cevabı ve resmi-kaynak köprüsünü daha belirgin yapmak. Sayfayı resmi dokümantasyon gibi sunmak veya interview/debugging intent'ine çevirmek değil.\n\n"
                        "Coverage düşük olduğu için bunlar visible-subset yön sinyalleridir. Otomatik page-wide intent aksiyonu değil, `investigate/monitor` durumu üretmelidir."
                    ),
                },
                {"id": "cluster_table_block", "type": "table", "tableId": "cluster_table"},
                {"id": "top_queries_block", "type": "table", "tableId": "top_queries_table"},
                {
                    "id": "technical_and_change",
                    "type": "markdown",
                    "body": (
                        "## Teknik durum ve değişiklik sınırı\n\n"
                        "Paylaşılan URL Inspection sonucu sayfa seviyesinde teknik PASS: sayfa indexli, fetch başarılı, crawl/index izni açık, Googlebot smartphone ve Google-selected canonical beyan edilen canonical ile aynı. Sitemap'teki geçici işleme hatası ayrı bir property-level uyarı; bu indexli URL'yi bloke etmiyor.\n\n"
                        f"Kaynak içerik **3 Ağu 2026**'da değişti ve Google **4 Ağu 2026 01:09**'da crawl etti. Export 4 Ağu'da bitiyor; 3-4 Ağu yalnızca **{boundary_impressions} gösterim ve {boundary_clicks} tıklama** içeriyor ve tamamen temiz bir post-crawl gün yok. Bu nedenle bu rapor yeni title'ı henüz puanlayamaz."
                    ),
                },
                {"id": "timeline_block", "type": "table", "tableId": "timeline_table"},
                {
                    "id": "app_comparison",
                    "type": "markdown",
                    "body": (
                        "## Uygulama karşılaştırması\n\n"
                        f"Uygulama sayfa KPI grain'ini doğru koruyor ve düşük-coverage intent iddialarını doğru blokluyor. Geniş 6-10 konum baseline'ı yalnızca **{len(peer_rows)}** peer'dan **{peer_clicks}/{peer_impressions:,} = {peer_baseline:.3%}** üretiyor; bu nedenle no-op makul, fakat 'CTR sağlıklı' sonucu değil.\n\n"
                        "En yüksek riskli iki açık state semantiği ve decay mantığı: `not evaluated` pozitif bir empty-state gibi gösteriliyor; tamamlanan 56 günlük replay ise düşük örneklemli bir `content_decay` false positive üretecek."
                    ),
                },
                {"id": "app_comparison_table_block", "type": "table", "tableId": "app_comparison_table"},
                {
                    "id": "recommended_steps",
                    "type": "markdown",
                    "body": (
                        "## Önerilen sonraki adımlar\n\n"
                        "1. **Bu sayfa için şimdi:** 3 Ağu title, meta ve H1'ı temiz 5 Ağu-1 Eyl gözlem penceresi boyunca değiştirme. 1 Eyl'e kadar veri kesinleştiğinde, mevcut lag ile 4 Eyl veya sonrasında tekrar değerlendir.\n"
                        "2. **Pencere sonrası karar kuralı:** konum bugünkü görünürlük seviyesini korur ve all-query CTR yine yaklaşık %0,1'de kalırsa tek bir kontrollü title deneyi yap. Mantıklı tek aday: `Does Angular HttpClient Unsubscribe Cancel Requests? 6 Tests`. Description önce 'Yes' cevabını, sonra caveat'leri ve resmi Angular kaynaklarını vermeli.\n"
                        "3. **Küçük lift'leri kesin sonuç sayma:** bu trafik düzeyinde 3 ve 6 tıklama gürültü. 28 günü garantili istatistiksel kanıt değil, cooldown/karar kontrol noktası say. Sabit gösterim ve konumda çift haneli tıklamaya yaklaşan maddi bir sonuç, küçük yüzde hareketinden daha kullanışlıdır.\n"
                        "4. **Ürün için:** semantic clustering'i zenginleştirmeden önce P0 state/readiness, recent-change ve low-volume guard'larını uygula."
                    ),
                },
                {"id": "actions_table_block", "type": "table", "tableId": "actions_table"},
                {
                    "id": "further_questions",
                    "type": "markdown",
                    "body": (
                        "## Further questions\n\n"
                        "- 4 Ağu crawl'u yeni snippet'i hemen seçti mi, yoksa Google önceki title'ı yazmaya/göstermeye devam etti mi?\n"
                        "- Anonimleştirilmiş tıklamalar hangi query ailelerinden geliyor? GSC mevcut privacy eşiğinde bunu açıklayamıyor; uygulama attribution uydurmamalı.\n"
                        "- 90 günlük page-type/technology cohort yeterince büyük CTR baseline'ı üretiyor mu, yoksa bu sayfa benchmark-insufficient olarak mı kalmalı?\n"
                        "- Aynı semantic cluster için ikinci bir URL sırayla görünüyor mu? Verilen exportlar cannibalization kararı için gereken query-to-multiple-page bağını korumuyor."
                    ),
                },
                {
                    "id": "caveats",
                    "type": "markdown",
                    "body": (
                        "## Caveats and assumptions\n\n"
                        "- Query, country ve device satırları privacy/truncation nedeniyle sınırlı alt kümelerdir; page totals yetkili KPI kaynağı olarak kalır.\n"
                        "- Query cluster'ları şeffaf anahtar kelime heuristics'idir ve yalnızca gösterim kullanır. Kesin intent etiketi değildir.\n"
                        "- Tıklama karşılaştırmasının gücü çok düşük; istatistiksel kanıt yokluğu değişiklik olmadığını kanıtlamaz.\n"
                        "- Search Appearance exportunda satır yok; bu, sayfanın hiçbir search feature almadığını kanıtlamaz.\n"
                        "- URL Inspection alanları owner tarafından paylaşıldı; API'den bağımsız olarak istenmedi.\n"
                        "- Bu audit hiçbir kaynak workbook'u, uygulama dosyasını, DB kaydını veya production state'i değiştirmedi."
                    ),
                },
            ],
        },
        "snapshot": {
            "version": 1,
            "generatedAt": generated_at,
            "status": "ready",
            "datasets": {
                "headline": headline,
                "period_comparison": period_comparison,
                "reconciliation": reconciliation,
                "clusters": clusters,
                "top_queries": top_queries,
                "timeline": timeline,
                "app_comparison": app_comparison,
                "actions": actions,
            },
        },
        "sources": sources,
        "package_info": {
            "originUrl": "artifact://frontendatlas-angular-httpclient-gsc-audit-2026-08-07",
            "controls": {
                "edit": False,
                "refresh": False,
                "share": False,
                "export": False,
            },
        },
    }
    (OUTPUT_DIR / "artifact.json").write_text(
        json.dumps(artifact, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(json.dumps({
        "analysis": str(OUTPUT_DIR / "analysis_results.json"),
        "artifact": str(OUTPUT_DIR / "artifact.json"),
        "clusters": clusters,
        "p_value": p_value,
        "peer_baseline": peer_baseline,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
