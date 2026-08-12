#!/usr/bin/env python3
"""Build the canonical Data Analytics report artifact for the CTR diagnosis."""

from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urlparse


OUTPUT_DIR = Path(__file__).resolve().parent
ANALYSIS = json.loads((OUTPUT_DIR / "analysis_results.json").read_text(encoding="utf-8"))
FOLLOWUP = json.loads((OUTPUT_DIR / "followup_analysis.json").read_text(encoding="utf-8"))
ZERO_CLICK = json.loads((OUTPUT_DIR / "zero_click_analysis.json").read_text(encoding="utf-8"))
TITLE = "FrontendAtlas CTR neden düşük?"
GENERATED_AT = "2026-08-11T00:00:00+03:00"


def short_path(url: str) -> str:
    path = urlparse(url).path
    return path if len(path) <= 72 else f"…{path[-69:]}"


def period(key: str) -> dict:
    return next(row for row in ANALYSIS["periods"] if row["key"] == key)


def country(period_label: str, segment: str) -> dict:
    return next(
        row for row in ANALYSIS["country_mix"]
        if row["period"] == period_label and row["segment"] == segment
    )


p3m = period("3m")
p28 = period("28d")
p7 = period("7d")
p24 = period("24h")
us3 = country("Son 3 ay", "ABD")
non_us3 = country("Son 3 ay", "ABD dışı")
decomp = ANALYSIS["recent_country_decomposition"]
aug5_followup = FOLLOWUP["aug5"]
react_followup = next(row for row in FOLLOWUP["exact_pages"] if row["key"] == "react")
html_followup = next(row for row in FOLLOWUP["exact_pages"] if row["key"] == "html")

page_groups = [
    row for row in ANALYSIS["page_groups_3m"]
    if row["impressions"] >= 100
]
page_group_rows = [
    {"rank": index, **row}
    for index, row in enumerate(page_groups, 1)
]

priority_pages = []
for index, row in enumerate(ANALYSIS["priority_pages"][:10], 1):
    priority_pages.append({
        "rank": index,
        "page": short_path(row["url"]),
        "url": row["url"],
        "group": row["group"],
        "clicks_3m": row["3m_clicks"],
        "impressions_3m": row["3m_impressions"],
        "ctr_3m": row["3m_ctr"],
        "position_3m": row["3m_position"],
        "clicks_28d": row["28d_clicks"],
        "impressions_28d": row["28d_impressions"],
        "ctr_28d": row["28d_ctr"],
        "position_28d": row["28d_position"],
    })

period_rows = [
    {
        "rank": rank,
        "period": row["period"],
        "dates": f'{str(row["start"])[:10]} – {str(row["end"])[:10]}',
        "clicks": row["clicks"],
        "impressions": row["impressions"],
        "ctr": row["ctr"],
        "position": row["position"],
        "query_impression_coverage": row["query_impression_coverage"],
        "status": "Ön veri; karar için kullanma" if row["key"] == "24h" else "Tamamlanmış pencere",
    }
    for rank, row in enumerate((p3m, p28, p7, p24), 1)
]

country_rows = [
    {"rank": index, **row}
    for index, row in enumerate(
        [
            row for row in ANALYSIS["country_mix"]
            if row["period"] in ("Son 3 ay", "Son 28 gün", "Son 7 gün")
        ],
        1,
    )
]

mix_rows = [
    {"rank": index, **row}
    for index, row in enumerate(decomp["segments"], 1)
]

position_rows = [
    {"rank": index, **row}
    for index, row in enumerate(ANALYSIS["position_bands_3m"], 1)
]

query_cluster_rows = [
    {"rank": index, **row}
    for index, row in enumerate(ANALYSIS["query_signal_clusters_3m"], 1)
]

metadata_rows = [
    {
        "rank": 1,
        "page": "/guides/system-design-blueprint/radio-framework",
        "title": "RADIO Framework: Frontend System Design Interview Template",
        "title_chars": 58,
        "description_chars": 136,
        "h1_alignment": "Exact",
        "ctr_3m": 7 / 9625,
        "assessment": "Snippet temeli güçlü; sorgu karması/AI-benzeri görünüm daha olası.",
    },
    {
        "rank": 2,
        "page": "/angular/trivia/angular-http-what-actually-cancels-request",
        "title": "Angular HttpClient Unsubscribe: 6 Tests & DevTools",
        "title_chars": 50,
        "description_chars": 140,
        "h1_alignment": "Yakın ama birebir değil",
        "ctr_3m": 13 / 9517,
        "assessment": "3 Ağu değişikliği henüz olgunlaşmadı; yeniden değiştirme.",
    },
    {
        "rank": 3,
        "page": "/react/trivia/react-render-nothing-return-value",
        "title": "Can React Return undefined? React 18 vs null",
        "title_chars": 44,
        "description_chars": 154,
        "h1_alignment": "Yakın",
        "ctr_3m": 3 / 7390,
        "assessment": "Başlık açık; exact export görünür sorgularda source-preference niyetini doğruluyor.",
    },
    {
        "rank": 4,
        "page": "/javascript/trivia/js-async-race-conditions",
        "title": "JavaScript Async Race Conditions: Fix Stale UI",
        "title_chars": 46,
        "description_chars": 139,
        "h1_alignment": "Yakın",
        "ctr_3m": 8 / 2638,
        "assessment": "Öncelikli üç sayfadan daha iyi; izleme adayı.",
    },
    {
        "rank": 5,
        "page": "/html/trivia/html-form-default-method",
        "title": "HTML Form Default Method: GET or POST? (With Example)",
        "title_chars": 53,
        "description_chars": 152,
        "h1_alignment": "Yakın",
        "ctr_3m": 0.0,
        "assessment": "Metadata düzgün; exact exportta görünür sorguların %68,4'ü açıkça MDN içeriyor.",
    },
]

repo_risk_rows = [
    {
        "rank": 1,
        "finding": "Dashboard canlı SERP metadata yerine kaynak registry metnini tercih ediyor",
        "evidence": "348/435 title ve 356/435 description manifest ile prerender HTML arasında farklı.",
        "ctr_link": "Kötü snippet'leri iç SEO ekranında görünmez kılabilir; doğrudan CTR etkisi henüz cohort ile ölçülmedi.",
        "priority": "P1 ölçüm güveni",
    },
    {
        "rank": 2,
        "finding": "Otomatik trivia title üretimi bazı promptları dilbilgisel olarak bozuyor",
        "evidence": "46 indexlenebilir title `Interview Answer` kalıbı içeriyor; 3 ayda GSC'de görünen 24'ü 1.069 gösterim/2 tık (%0,187 CTR) aldı.",
        "ctr_link": "Gerçek bir snippet kusuru, ancak property gösterimlerinin yalnız %1,49'u; site-geneli düşük CTR'yi açıklayamaz.",
        "priority": "P1 snippet kalitesi",
    },
    {
        "rank": 3,
        "finding": "Teknik crawl tabanı mevcut build'de bütün",
        "evidence": "612 prerender sayfasında title/description/robots/canonical/H1 var; 435 sitemap URL'sinin tamamı prerender listesinde.",
        "ctr_link": "Site-geneli eksik tag/canonical arızası ana açıklama değil.",
        "priority": "Doğrulandı",
    },
]

quality_rows = [
    {
        "rank": 1,
        "check": "Property totals",
        "evidence": "Ülke ve cihaz toplamları grafikle dört pencerede birebir uyuşuyor.",
        "impact": "Site CTR ve mix ayrıştırması güvenilir.",
        "assessment": "Pass",
    },
    {
        "rank": 2,
        "check": "Query coverage",
        "evidence": f'3 ay gösterim kapsamı {p3m["query_impression_coverage"]:.1%}, tıklama kapsamı {p3m["query_click_coverage"]:.1%}; tablo 1.000 satırda bitiyor.',
        "impact": "Intent kümeleri yalnız görünür alt sınır; site toplamına genellenemez.",
        "assessment": "Material caveat",
    },
    {
        "rank": 3,
        "check": "Page aggregation",
        "evidence": f'Sayfa satırları grafik toplamından {p3m["page_impression_delta"]:,} gösterim ({p3m["page_impression_delta"] / p3m["impressions"]:.1%}) yüksek.',
        "impact": "Google property ve URL sonuçlarını farklı sayar; sayfa satırlarını site CTR paydası olarak toplama.",
        "assessment": "Expected limitation",
    },
    {
        "rank": 4,
        "check": "Nested windows",
        "evidence": "28 ve 7 günlük satırlar 3 aylık dosyanın aynı tarihlerdeki satırlarıyla eşleşiyor.",
        "impact": "Dört dosya bağımsız örnek değildir; ayrı deneyler gibi yorumlanamaz.",
        "assessment": "Pass",
    },
    {
        "rank": 5,
        "check": "URL variants",
        "evidence": "3 ayda 14 fragment URL satırı 295 gösterim/0 tık; query/http/www/trailing-slash varyantı yok.",
        "impact": "Canonical/URL varyant gürültüsü düşük CTR'nin ana nedeni değil.",
        "assessment": "Low risk",
    },
    {
        "rank": 6,
        "check": "24-hour export",
        "evidence": "1 tık ve son saatte 0 gösterim; en yeni veri ön nitelikte olabilir.",
        "impact": "Karar ve trend çıkarımı için kullanma.",
        "assessment": "Preliminary",
    },
    {
        "rank": 7,
        "check": "Exact-page dimension coverage",
        "evidence": "React query/country/device tabloları 251/2.719 (%9,23); HTML tabloları 155/1.113 (%13,93) gösterimi kapsıyor.",
        "impact": "Exact-page query, ülke ve cihaz oranları yalnız raporlanabilir alt kümeye aittir; tüm sayfaya genellenemez.",
        "assessment": "Material caveat",
    },
    {
        "rank": 8,
        "check": "Follow-up workbook integrity",
        "evidence": "Üç yeni dosyada filtre hedefleri, tarih sürekliliği, CTR yuvarlaması, anahtar benzersizliği ve property/page uzlaşımı doğrulandı.",
        "impact": "5 Ağustos property kırılımları ve exact-page tarih toplamları karar için güvenilir.",
        "assessment": "Pass",
    },
]

export_rows = [
    {
        "priority": 1,
        "export": "5 Ağustos 2026 — site geneli",
        "filters": "Alındı ve doğrulandı",
        "why": "Patlama %92,3 ABD, %99,5 masaüstü; interview/prep aileleri günün ana hacmini oluşturuyor.",
    },
    {
        "priority": 2,
        "export": "React render-nothing exact page",
        "filters": "Alındı ve doğrulandı",
        "why": "2.719 gösterim/1 tık; görünür sorguların %64,1'i docs/official modifier taşıyor.",
    },
    {
        "priority": 3,
        "export": "HTML form default method exact page",
        "filters": "Alındı ve doğrulandı",
        "why": "1.113 gösterim/0 tık; görünür sorguların %68,4'ü açıkça MDN içeriyor.",
    },
    {
        "priority": 4,
        "export": "Generative AI performance (varsa)",
        "filters": "İsteğe bağlı; zorunlu değil",
        "why": "AI görünümü hipotezini sınar; mevcut üç export ana aksiyonu belirlemek için yeterli.",
    },
]

aug5_group_rows = [
    {"rank": index, **row}
    for index, row in enumerate(aug5_followup["page_groups"][:10], 1)
]

aug5_top_page_rows = [
    {
        "rank": row["rank"],
        "page": short_path(row["url"]),
        "group": row["group"],
        "clicks": row["clicks"],
        "impressions": row["impressions"],
        "ctr": row["ctr"],
        "position": row["position"],
        "property_share": row["property_impression_share"],
        "seven_day_share": row["aug5_share_of_seven_day_page_impressions"],
        "other6_daily_average": row["other6_daily_average"],
        "daily_lift": row["aug5_vs_other6_daily_average"],
    }
    for row in aug5_followup["top_pages"][:10]
]

aug5_mix_rows = [
    {"rank": index, **row}
    for index, row in enumerate(
        aug5_followup["country_decomposition_aug5_vs_other6"]["segments"], 1
    )
]

exact_page_rows = [
    {
        "rank": 1,
        "page": "React render-nothing",
        "clicks": react_followup["graph"]["clicks"],
        "impressions": react_followup["graph"]["impressions"],
        "ctr": react_followup["graph"]["ctr"],
        "position": react_followup["graph"]["position"],
        "visible_query_coverage": react_followup["visible_query"]["impression_coverage"],
        "source_preference_share": next(
            row["visible_impression_share"] for row in react_followup["query_clusters"]
            if row["cluster"] == "Source-preference modifier"
        ),
        "first7_share": react_followup["daily"]["first7_impression_share"],
        "assessment": "Geçici ilk-hafta görünürlük dalgası + docs/official source-preference sinyali.",
    },
    {
        "rank": 2,
        "page": "HTML form default method",
        "clicks": html_followup["graph"]["clicks"],
        "impressions": html_followup["graph"]["impressions"],
        "ctr": html_followup["graph"]["ctr"],
        "position": html_followup["graph"]["position"],
        "visible_query_coverage": html_followup["visible_query"]["impression_coverage"],
        "source_preference_share": next(
            row["visible_impression_share"] for row in html_followup["query_clusters"]
            if row["cluster"] == "Source-preference modifier"
        ),
        "first7_share": html_followup["daily"]["first7_impression_share"],
        "assessment": "Açık MDN/specification niyeti; trivia sayfası sonuç türüyle uyumsuz.",
    },
]

exact_daily_rows = react_followup["daily_rows"] + html_followup["daily_rows"]

exact_query_rows = []
for page_label, page_data in (
    ("React render-nothing", react_followup),
    ("HTML form default method", html_followup),
):
    for row in page_data["query_clusters"]:
        exact_query_rows.append({
            "rank": len(exact_query_rows) + 1,
            "page": page_label,
            **row,
        })

trivia_page_position_rows = ZERO_CLICK["trivia_page_position_rows_3m"]
trivia_tech_cohort_rows = ZERO_CLICK["trivia_technology_rows_3m"]
trivia_intent_position_rows = ZERO_CLICK["mapped_query_position_rows_3m"]
trivia_exact_intent_rows = ZERO_CLICK["exact_page_intent_rows"]

headline = [{
    "ctr_3m": p3m["ctr"],
    "clicks_3m": p3m["clicks"],
    "impressions_3m": p3m["impressions"],
    "position_3m": p3m["position"],
    "ctr_28d": p28["ctr"],
    "ctr_7d": p7["ctr"],
    "us_share_3m": us3["impression_share"],
    "us_ctr_3m": us3["ctr"],
    "non_us_ctr_3m": non_us3["ctr"],
    "aug5_share_7d": ANALYSIS["anomaly_7d"]["aug5_impression_share"],
    "ctr_7d_ex_aug5": ANALYSIS["anomaly_7d"]["ctr_excluding_aug5"],
}]

sources = [
    {
        "id": "analysis_results",
        "label": "FrontendAtlas GSC CTR analysis results",
        "path": "outputs/seo-ctr-diagnostic-2026-08-10/analysis_results.json",
        "query": {
            "engine": "Python standard library",
            "language": "python",
            "sql": "SELECT * FROM read_json_auto('outputs/seo-ctr-diagnostic-2026-08-10/analysis_results.json')",
            "description": "Read-only OOXML extraction, reconciliation, weighted CTR/position summaries, Shapley country-mix decomposition, and page/query cohorting.",
            "executed_at": GENERATED_AT,
            "tables_used": [
                "frontendatlas.com-Performance-on-Search-2026-08-10.xlsx",
                "frontendatlas.com-Performance-on-Search-2026-08-10 (1).xlsx",
                "frontendatlas.com-Performance-on-Search-2026-08-10 (2).xlsx",
                "frontendatlas.com-Performance-on-Search-2026-08-10 (3).xlsx",
            ],
            "filters": ["Search type: Web", "Windows end 2026-08-08 except preliminary 24h export"],
            "metric_definitions": [
                "CTR = clicks / impressions; CTR cells are not averaged.",
                "Average position = impression-weighted position from the exported rows.",
                "Property totals use the Grafik/Ülkeler/Cihazlar grain; page rows are not summed into site CTR.",
                "Mix/within effects use a symmetric two-segment Shapley decomposition for US vs non-US.",
            ],
        },
    },
    {
        "id": "gsc_3m",
        "label": "GSC Search performance — last 3 months (materialized prior export)",
        "path": "outputs/seo-ctr-diagnostic-2026-08-10/source_extract.json",
        "query": {
            "engine": "DuckDB JSON reader",
            "language": "sql",
            "sql": "SELECT * FROM read_json_auto('outputs/seo-ctr-diagnostic-2026-08-10/source_extract.json') WHERE period = '3m'",
            "description": "Read the preserved, read-only extraction of the finalized property-level Web export for May 9–Aug 8, 2026.",
            "executed_at": GENERATED_AT,
            "tables_used": ["Prior export Grafik!A1:E93, preserved under source_extract.json['3m']"],
            "filters": ["Search type: Web", "Date: 2026-05-09 through 2026-08-08"],
            "metric_definitions": ["CTR = SUM(clicks) / SUM(impressions)", "Average position = SUM(impressions * position) / SUM(impressions)"],
        },
    },
    {
        "id": "gsc_28d",
        "label": "GSC Search performance — last 28 days (materialized prior export)",
        "path": "outputs/seo-ctr-diagnostic-2026-08-10/source_extract.json",
        "query": {
            "engine": "DuckDB JSON reader",
            "language": "sql",
            "sql": "SELECT * FROM read_json_auto('outputs/seo-ctr-diagnostic-2026-08-10/source_extract.json') WHERE period = '28d'",
            "description": "Read the preserved, read-only extraction of the finalized property-level Web export for Jul 12–Aug 8, 2026.",
            "executed_at": GENERATED_AT,
            "tables_used": ["Prior export Grafik!A1:E29, preserved under source_extract.json['28d']"],
            "filters": ["Search type: Web", "Date: 2026-07-12 through 2026-08-08"],
            "metric_definitions": ["CTR = SUM(clicks) / SUM(impressions)", "Average position = SUM(impressions * position) / SUM(impressions)"],
        },
    },
    {
        "id": "gsc_7d",
        "label": "GSC Search performance — last 7 days (materialized prior export)",
        "path": "outputs/seo-ctr-diagnostic-2026-08-10/source_extract.json",
        "query": {
            "engine": "DuckDB JSON reader",
            "language": "sql",
            "sql": "SELECT * FROM read_json_auto('outputs/seo-ctr-diagnostic-2026-08-10/source_extract.json') WHERE period = '7d'",
            "description": "Read the preserved, read-only extraction of the finalized property-level Web export for Aug 2–Aug 8, 2026.",
            "executed_at": GENERATED_AT,
            "tables_used": ["Prior export Grafik!A1:E8, preserved under source_extract.json['7d']"],
            "filters": ["Search type: Web", "Date: 2026-08-02 through 2026-08-08"],
            "metric_definitions": ["CTR = SUM(clicks) / SUM(impressions)", "Average position = SUM(impressions * position) / SUM(impressions)"],
        },
    },
    {
        "id": "gsc_24h",
        "label": "GSC Search performance — last 24 hours (materialized preliminary export)",
        "path": "outputs/seo-ctr-diagnostic-2026-08-10/source_extract.json",
        "query": {
            "engine": "DuckDB JSON reader",
            "language": "sql",
            "sql": "SELECT * FROM read_json_auto('outputs/seo-ctr-diagnostic-2026-08-10/source_extract.json') WHERE period = '24h'",
            "description": "Read the preserved preliminary hourly property-level Web extraction from the initial export set.",
            "executed_at": GENERATED_AT,
            "tables_used": ["Prior export Grafik!A1:E25, preserved under source_extract.json['24h']"],
            "filters": ["Search type: Web", "Timezone: UTC+03:00"],
            "metric_definitions": ["CTR = SUM(clicks) / SUM(impressions)", "Average position = SUM(impressions * position) / SUM(impressions)"],
        },
    },
    {
        "id": "followup_analysis",
        "label": "Follow-up GSC workbook analysis",
        "path": "outputs/seo-ctr-diagnostic-2026-08-10/followup_analysis.json",
        "query": {
            "engine": "Python standard library",
            "language": "python",
            "sql": "SELECT * FROM read_json_auto('outputs/seo-ctr-diagnostic-2026-08-10/followup_analysis.json')",
            "description": "Read-only reconciliation and cohort analysis of the Aug 5 sitewide export and the two exact-page exports.",
            "executed_at": GENERATED_AT,
            "tables_used": [
                "Aug 5: Grafik, Sorgular, Sayfa sayısı, Ülkeler, Cihazlar, Filtreler",
                "React exact page: Grafik, Sorgular, Sayfa sayısı, Ülkeler, Cihazlar, Filtreler",
                "HTML exact page: Grafik, Sorgular, Sayfa sayısı, Ülkeler, Cihazlar, Filtreler",
            ],
            "filters": ["Search type: Web", "Aug 5, 2026 sitewide", "Jul 12–Aug 8, 2026 exact-page windows"],
            "metric_definitions": [
                "CTR = clicks / impressions; exported CTR cells are not averaged.",
                "Exact-page Graph/Page totals are authoritative; dimension sheets are reportable-query subsets.",
                "Aug 5 country mix/within effects use a symmetric US vs non-US Shapley decomposition against the other six days.",
            ],
        },
    },
    {
        "id": "zero_click_analysis",
        "label": "Trivia zero-click and visible-query intent cohorts",
        "path": "outputs/seo-ctr-diagnostic-2026-08-10/zero_click_analysis.json",
        "query": {
            "engine": "Python standard library",
            "language": "python",
            "sql": "SELECT * FROM read_json_auto('outputs/seo-ctr-diagnostic-2026-08-10/zero_click_analysis.json')",
            "description": "Reproduce URL-level trivia cohorts and an exclusive, rule-defined intent split from materialized GSC extracts.",
            "executed_at": GENERATED_AT,
            "tables_used": [
                "source_extract.json: 3m/28d Grafik, Sorgular, Sayfa sayısı",
                "followup_source_extract.json: React and HTML exact-page exports",
                "seo-gsc-page-audit-2026-08-07/source_extract.json: Angular exact-page comparison",
            ],
            "filters": [
                "Trivia URL contains the trivia route segment",
                "Zero-click URL row has exactly zero clicks in the stated window",
                "Visible-query topic mapping is exclusive and first-match-wins",
                "Docs modifier regex is recorded in zero_click_analysis.json",
            ],
            "metric_definitions": [
                "CTR = SUM(clicks) / SUM(impressions); exported CTR cells are not averaged.",
                "Average position = SUM(impressions * position) / SUM(impressions).",
                "The 75.3% docs share is limited to the 4,600-impression mapped visible-query sample.",
                "Property-level query rows have no page dimension; exact-page rows are reported separately.",
            ],
        },
    },
    {
        "id": "gsc_aug5",
        "label": "GSC Search performance — Aug 5, 2026 sitewide",
        "path": "frontendatlas.com-Performance-on-Search-2026-08-10.xlsx",
        "query": {
            "engine": "DuckDB Excel extension",
            "language": "sql",
            "sql": "SELECT * FROM read_xlsx('frontendatlas.com-Performance-on-Search-2026-08-10.xlsx', sheet = 'Grafik')",
            "description": "Read the one-day, unfiltered property-level Web export and its page/country/device marginals.",
            "executed_at": GENERATED_AT,
            "tables_used": ["Grafik!A1:E2", "Sayfa sayısı!A1:E143", "Ülkeler!A1:E75", "Cihazlar!A1:E4", "Filtreler!A1:B3"],
            "filters": ["Search type: Web", "Date: 2026-08-05", "No page filter"],
            "metric_definitions": ["Property CTR = Grafik clicks / Grafik impressions", "Country/device totals must reconcile to Grafik"],
        },
    },
    {
        "id": "gsc_react_exact",
        "label": "GSC exact-page performance — React render-nothing",
        "path": "frontendatlas.com-Performance-on-Search-2026-08-10 (1).xlsx",
        "query": {
            "engine": "DuckDB Excel extension",
            "language": "sql",
            "sql": "SELECT * FROM read_xlsx('frontendatlas.com-Performance-on-Search-2026-08-10 (1).xlsx', sheet = 'Grafik')",
            "description": "Read the 28-day exact-page Web export for the React render-nothing URL.",
            "executed_at": GENERATED_AT,
            "tables_used": ["Grafik!A1:E29", "Sorgular!A1:E68", "Sayfa sayısı!A1:E2", "Filtreler!A1:B4"],
            "filters": ["Search type: Web", "Date: 2026-07-12 through 2026-08-08", "Exact page URL: https://frontendatlas.com/react/trivia/react-render-nothing-return-value"],
            "metric_definitions": ["Graph/Page totals are authoritative", "Query/country/device rows describe only the 251 reportable impressions"],
        },
    },
    {
        "id": "gsc_html_exact",
        "label": "GSC exact-page performance — HTML form default method",
        "path": "frontendatlas.com-Performance-on-Search-2026-08-10 (2).xlsx",
        "query": {
            "engine": "DuckDB Excel extension",
            "language": "sql",
            "sql": "SELECT * FROM read_xlsx('frontendatlas.com-Performance-on-Search-2026-08-10 (2).xlsx', sheet = 'Grafik')",
            "description": "Read the 28-day exact-page Web export for the HTML form-default URL.",
            "executed_at": GENERATED_AT,
            "tables_used": ["Grafik!A1:E29", "Sorgular!A1:E41", "Sayfa sayısı!A1:E2", "Filtreler!A1:B4"],
            "filters": ["Search type: Web", "Date: 2026-07-12 through 2026-08-08", "Exact page URL: https://frontendatlas.com/html/trivia/html-form-default-method"],
            "metric_definitions": ["Graph/Page totals are authoritative", "Query/country/device rows describe only the 155 reportable impressions"],
        },
    },
    {
        "id": "rendered_metadata",
        "label": "Current prerendered FrontendAtlas HTML metadata",
        "path": "outputs/seo-ctr-diagnostic-2026-08-10/rendered_metadata_audit.json",
        "query": {
            "engine": "DuckDB JSON reader",
            "language": "sql",
            "sql": "SELECT * FROM read_json_auto('outputs/seo-ctr-diagnostic-2026-08-10/rendered_metadata_audit.json')",
            "description": "Read the bounded metadata audit rows extracted from the current prerendered HTML.",
            "executed_at": GENERATED_AT,
            "tables_used": ["frontend/dist/frontendatlas/browser/*/index.html"],
            "filters": ["Five highest-priority low-CTR pages"],
            "metric_definitions": ["Title and description characters use Unicode string length", "CTR = GSC page clicks / page impressions"],
        },
    },
    {
        "id": "repo_seo_generator",
        "label": "FrontendAtlas SEO generators and intelligence manifest",
        "path": "outputs/seo-ctr-diagnostic-2026-08-10/repo_seo_audit.json",
        "query": {
            "engine": "DuckDB JSON reader",
            "language": "sql",
            "sql": "SELECT * FROM read_json_auto('outputs/seo-ctr-diagnostic-2026-08-10/repo_seo_audit.json')",
            "description": "Read the bounded repository/prerender audit findings and their GSC cohort cross-match.",
            "executed_at": GENERATED_AT,
            "tables_used": [
                "frontend/src/app/features/trivia/trivia-detail/trivia-seo.util.ts",
                "frontend/scripts/generate-seo-intelligence-manifest.mjs",
                "frontend/dist/frontendatlas/browser/*/index.html",
            ],
            "filters": ["Current local prerender output", "Three-month GSC Pages export"],
            "metric_definitions": ["Cohort CTR = cohort page clicks / cohort page impressions", "Cohort share = cohort page impressions / property impressions"],
        },
    },
    {
        "id": "prior_angular_audit",
        "label": "Angular HttpClient page GSC audit — 2026-08-07",
        "path": "outputs/seo-gsc-page-audit-2026-08-07/analysis_results.json",
    },
    {
        "id": "gsc_dimensions_docs",
        "label": "Google Search Console — dimensions and data groupings",
        "href": "https://support.google.com/webmasters/answer/17011259?hl=en",
    },
    {
        "id": "gsc_aggregation_docs",
        "label": "Google Search Console — about the data",
        "href": "https://support.google.com/webmasters/answer/17011364?hl=en",
    },
    {
        "id": "gsc_ai_docs",
        "label": "Google Search Console — generative AI performance report",
        "href": "https://support.google.com/webmasters/answer/16984139?hl=en",
    },
    {
        "id": "google_title_docs",
        "label": "Google Search Central — title link guidance",
        "href": "https://developers.google.com/search/docs/appearance/title-link",
    },
    {
        "id": "google_snippet_docs",
        "label": "Google Search Central — snippet guidance",
        "href": "https://developers.google.com/search/docs/appearance/snippet",
    },
]

cards = [
    {
        "id": "ctr_3m_card",
        "description": "Property-level finalized Web search performance, May 9–Aug 8, 2026.",
        "dataset": "headline",
        "sourceId": "gsc_3m",
        "metrics": [
            {"label": "3-month CTR", "field": "ctr_3m", "format": "percent"},
            {"label": "Clicks", "field": "clicks_3m", "format": "number"},
            {"label": "Impressions", "field": "impressions_3m", "format": "number"},
            {"label": "Average position", "field": "position_3m", "format": "number"},
        ],
    },
    {
        "id": "recent_ctr_card",
        "description": "Finalized nested windows; short-window movement is noisy.",
        "dataset": "headline",
        "sourceId": "analysis_results",
        "metrics": [
            {"label": "28-day CTR", "field": "ctr_28d", "format": "percent"},
            {"label": "7-day CTR", "field": "ctr_7d", "format": "percent"},
        ],
    },
    {
        "id": "us_mix_card",
        "description": "US traffic is the dominant impression pool but has extremely low click propensity.",
        "dataset": "headline",
        "sourceId": "gsc_3m",
        "metrics": [
            {"label": "US impression share", "field": "us_share_3m", "format": "percent"},
            {"label": "US CTR", "field": "us_ctr_3m", "format": "percent"},
            {"label": "Non-US CTR", "field": "non_us_ctr_3m", "format": "percent"},
        ],
    },
    {
        "id": "aug5_card",
        "description": "One anomalous day dominates the last-7-day denominator.",
        "dataset": "headline",
        "sourceId": "followup_analysis",
        "metrics": [
            {"label": "Aug 5 share of 7d impressions", "field": "aug5_share_7d", "format": "percent"},
            {"label": "7d CTR excluding Aug 5", "field": "ctr_7d_ex_aug5", "format": "percent"},
        ],
    },
]

charts = [
    {
        "id": "daily_impressions_chart",
        "title": "Daily property impressions",
        "subtitle": "May 9–Aug 8, 2026; Aug 5 is a one-day outlier rather than a sustained step-change.",
        "type": "line",
        "dataset": "daily_3m",
        "sourceId": "analysis_results",
        "encodings": {
            "x": {"field": "date", "type": "temporal", "label": "Date"},
            "y": {"field": "impressions", "type": "quantitative", "label": "Impressions"},
            "tooltip": [
                {"field": "clicks", "type": "quantitative", "label": "Clicks", "format": "number"},
                {"field": "ctr", "type": "quantitative", "label": "CTR", "format": "percent"},
                {"field": "position", "type": "quantitative", "label": "Average position", "format": "number"},
            ],
        },
        "xAxisTitle": "Date",
        "yAxisTitle": "Impressions",
        "valueFormat": "number",
        "layout": "wide",
        "maxRows": 100,
    },
    {
        "id": "country_ctr_chart",
        "title": "CTR by US vs non-US traffic",
        "subtitle": "Three finalized windows; the US segment supplies most impressions but far fewer clicks per impression.",
        "type": "bar",
        "dataset": "country_rows",
        "sourceId": "analysis_results",
        "encodings": {
            "x": {"field": "period", "type": "nominal", "label": "Period"},
            "y": {"field": "ctr", "type": "quantitative", "label": "CTR"},
            "color": {"field": "segment", "type": "nominal", "label": "Segment"},
            "tooltip": [
                {"field": "impressions", "type": "quantitative", "label": "Impressions", "format": "number"},
                {"field": "impression_share", "type": "quantitative", "label": "Impression share", "format": "percent"},
                {"field": "position", "type": "quantitative", "label": "Average position", "format": "number"},
            ],
        },
        "xAxisTitle": "Period",
        "yAxisTitle": "CTR",
        "valueFormat": "percent",
        "layout": "wide",
        "maxRows": 10,
    },
    {
        "id": "page_group_ctr_chart",
        "title": "Page-table CTR by content group",
        "subtitle": "Three-month URL-level rows; impressions are page-aggregated and must not be summed into the property CTR.",
        "type": "horizontalBar",
        "dataset": "page_groups_3m",
        "sourceId": "analysis_results",
        "encodings": {
            "x": {"field": "group", "type": "nominal", "label": "Content group"},
            "y": {"field": "ctr", "type": "quantitative", "label": "CTR"},
            "tooltip": [
                {"field": "impressions", "type": "quantitative", "label": "Page impressions", "format": "number"},
                {"field": "impression_share", "type": "quantitative", "label": "Page-table share", "format": "percent"},
                {"field": "position", "type": "quantitative", "label": "Average position", "format": "number"},
            ],
        },
        "xAxisTitle": "Content group",
        "yAxisTitle": "CTR",
        "valueFormat": "percent",
        "layout": "wide",
        "maxRows": 12,
    },
    {
        "id": "aug5_group_chart",
        "title": "5 Ağustos gösterimleri: içerik ailesi",
        "subtitle": "Interview hub ve framework-prep sayfaları 4.281 gösterim ve sıfır tık üretti; trivia ile birlikte sayfa tablosunun %85,2'sini oluşturdu.",
        "type": "horizontalBar",
        "dataset": "aug5_group_rows",
        "sourceId": "followup_analysis",
        "encodings": {
            "x": {"field": "group", "type": "nominal", "label": "Content group"},
            "y": {"field": "impressions", "type": "quantitative", "label": "Page impressions"},
            "tooltip": [
                {"field": "clicks", "type": "quantitative", "label": "Clicks", "format": "number"},
                {"field": "ctr", "type": "quantitative", "label": "CTR", "format": "percent"},
                {"field": "position", "type": "quantitative", "label": "Average position", "format": "number"},
                {"field": "page_table_share", "type": "quantitative", "label": "Page-table share", "format": "percent"},
            ],
        },
        "xAxisTitle": "Content group",
        "yAxisTitle": "Page impressions",
        "valueFormat": "number",
        "layout": "wide",
        "maxRows": 10,
    },
    {
        "id": "exact_page_daily_chart",
        "title": "Exact-page günlük gösterimler",
        "subtitle": "React'te ilk-hafta dalgası sönüyor; HTML görünürlüğü daha geç ve kalıcı büyüyor. Ortalama sıralamalar dönem boyunca yaklaşık sabit.",
        "type": "line",
        "dataset": "exact_daily_rows",
        "sourceId": "followup_analysis",
        "encodings": {
            "x": {"field": "date", "type": "temporal", "label": "Date"},
            "y": {"field": "impressions", "type": "quantitative", "label": "Impressions"},
            "color": {"field": "page", "type": "nominal", "label": "Page"},
            "tooltip": [
                {"field": "clicks", "type": "quantitative", "label": "Clicks", "format": "number"},
                {"field": "ctr", "type": "quantitative", "label": "CTR", "format": "percent"},
                {"field": "position", "type": "quantitative", "label": "Average position", "format": "number"},
            ],
        },
        "xAxisTitle": "Date",
        "yAxisTitle": "Impressions",
        "valueFormat": "number",
        "layout": "wide",
        "maxRows": 60,
    },
    {
        "id": "trivia_intent_position_chart",
        "title": "Visible trivia-query impressions by intent and position",
        "subtitle": "High-confidence mapped three-month visible sample; this is not all-query or page-level traffic.",
        "type": "bar",
        "dataset": "trivia_intent_position_rows",
        "sourceId": "zero_click_analysis",
        "encodings": {
            "x": {"field": "position_band", "type": "nominal", "label": "Query position band"},
            "y": {"field": "impressions", "type": "quantitative", "label": "Visible impressions"},
            "color": {"field": "intent", "type": "nominal", "label": "Intent"},
            "tooltip": [
                {"field": "query_rows", "type": "quantitative", "label": "Query rows", "format": "number"},
                {"field": "clicks", "type": "quantitative", "label": "Clicks", "format": "number"},
                {"field": "ctr", "type": "quantitative", "label": "CTR", "format": "percent"},
                {"field": "position", "type": "quantitative", "label": "Weighted position", "format": "number"},
            ],
        },
        "xAxisTitle": "Query position band",
        "yAxisTitle": "Visible impressions",
        "valueFormat": "number",
        "layout": "wide",
        "maxRows": 8,
    },
]


def table(table_id: str, title: str, subtitle: str, dataset: str, source_id: str,
          columns: list[dict], sort_field: str, direction: str = "desc") -> dict:
    return {
        "id": table_id,
        "title": title,
        "subtitle": subtitle,
        "dataset": dataset,
        "sourceId": source_id,
        "density": "comfortable",
        "defaultSort": {"field": sort_field, "direction": direction},
        "columns": columns,
    }


tables = [
    table(
        "period_table", "Property performance by exported window",
        "CTR is recalculated from clicks/impressions; the 24-hour window is preliminary.",
        "period_rows", "analysis_results",
        [
            {"field": "period", "label": "Window", "type": "text"},
            {"field": "dates", "label": "Dates", "type": "text"},
            {"field": "clicks", "label": "Clicks", "type": "number"},
            {"field": "impressions", "label": "Impressions", "type": "number"},
            {"field": "ctr", "label": "CTR", "type": "percent"},
            {"field": "position", "label": "Avg pos.", "type": "number"},
            {"field": "query_impression_coverage", "label": "Query coverage", "type": "percent"},
            {"field": "status", "label": "Use", "type": "text"},
            {"field": "rank", "label": "Order", "type": "number"},
        ],
        "rank", "asc",
    ),
    table(
        "mix_table", "US mix: previous 21 days vs latest 7 days",
        "The last seven days are subtracted from the 28-day export to form a non-overlapping 21-day baseline.",
        "mix_rows", "analysis_results",
        [
            {"field": "segment", "label": "Segment", "type": "text"},
            {"field": "prior21_impressions", "label": "Prior 21d imps", "type": "number"},
            {"field": "prior21_share", "label": "Prior share", "type": "percent"},
            {"field": "prior21_ctr", "label": "Prior CTR", "type": "percent"},
            {"field": "last7_impressions", "label": "Last 7d imps", "type": "number"},
            {"field": "last7_share", "label": "Last share", "type": "percent"},
            {"field": "last7_ctr", "label": "Last CTR", "type": "percent"},
            {"field": "rank", "label": "Order", "type": "number"},
        ],
        "rank", "asc",
    ),
    table(
        "position_table", "Page rows by average-position band",
        "Ecological check only: a row's average position is not an impression-level rank distribution.",
        "position_rows", "analysis_results",
        [
            {"field": "band", "label": "Avg position band", "type": "text"},
            {"field": "pages", "label": "Pages", "type": "number"},
            {"field": "clicks", "label": "Clicks", "type": "number"},
            {"field": "impressions", "label": "Page imps", "type": "number"},
            {"field": "ctr", "label": "CTR", "type": "percent"},
            {"field": "position", "label": "Weighted pos.", "type": "number"},
            {"field": "impression_share", "label": "Page-table share", "type": "percent"},
            {"field": "rank", "label": "Order", "type": "number"},
        ],
        "rank", "asc",
    ),
    table(
        "trivia_page_position_table", "Trivia zero-click profile by page position",
        "Mutually exclusive URL-level average-position bands; this is an ecological page-row view, not impression-level rank.",
        "trivia_page_position_rows", "zero_click_analysis",
        [
            {"field": "position_band", "label": "Avg position band", "type": "text"},
            {"field": "pages", "label": "Trivia pages", "type": "number"},
            {"field": "clicks", "label": "Clicks", "type": "number"},
            {"field": "impressions", "label": "Page imps", "type": "number"},
            {"field": "ctr", "label": "CTR", "type": "percent"},
            {"field": "position", "label": "Weighted pos.", "type": "number"},
            {"field": "zero_click_pages", "label": "Zero-click pages", "type": "number"},
            {"field": "zero_click_impressions", "label": "Zero-click imps", "type": "number"},
            {"field": "zero_click_impression_share", "label": "Zero-click imp share", "type": "percent"},
            {"field": "rank", "label": "Order", "type": "number"},
        ],
        "rank", "asc",
    ),
    table(
        "trivia_tech_cohort_table", "Trivia CTR by technology cohort",
        "Three-month GSC Pages rows; cohorts show that the zero-click problem is not uniform across technologies.",
        "trivia_tech_cohort_rows", "zero_click_analysis",
        [
            {"field": "technology", "label": "Technology", "type": "text"},
            {"field": "pages", "label": "Trivia pages", "type": "number"},
            {"field": "clicks", "label": "Clicks", "type": "number"},
            {"field": "impressions", "label": "Page imps", "type": "number"},
            {"field": "ctr", "label": "CTR", "type": "percent"},
            {"field": "position", "label": "Weighted pos.", "type": "number"},
            {"field": "zero_click_impression_share", "label": "Zero-click imp share", "type": "percent"},
            {"field": "rank", "label": "Order", "type": "number"},
        ],
        "rank", "asc",
    ),
    table(
        "priority_pages_table", "High-impression pages averaging positions 5–10",
        "Sorted by three-month page impressions; URL-level aggregation is appropriate for page diagnosis, not property totals.",
        "priority_pages", "analysis_results",
        [
            {"field": "page", "label": "Page", "type": "text"},
            {"field": "group", "label": "Group", "type": "text"},
            {"field": "clicks_3m", "label": "3m clicks", "type": "number"},
            {"field": "impressions_3m", "label": "3m imps", "type": "number"},
            {"field": "ctr_3m", "label": "3m CTR", "type": "percent"},
            {"field": "position_3m", "label": "3m pos.", "type": "number"},
            {"field": "ctr_28d", "label": "28d CTR", "type": "percent"},
            {"field": "position_28d", "label": "28d pos.", "type": "number"},
            {"field": "rank", "label": "Rank", "type": "number"},
        ],
        "rank", "asc",
    ),
    table(
        "query_clusters_table", "Visible query signals",
        "Rule-defined, overlapping lower bounds from the truncated three-month query table.",
        "query_cluster_rows", "analysis_results",
        [
            {"field": "cluster", "label": "Signal", "type": "text"},
            {"field": "definition", "label": "Rule", "type": "text"},
            {"field": "query_rows", "label": "Rows", "type": "number"},
            {"field": "clicks", "label": "Clicks", "type": "number"},
            {"field": "impressions", "label": "Visible imps", "type": "number"},
            {"field": "ctr", "label": "CTR", "type": "percent"},
            {"field": "position", "label": "Avg pos.", "type": "number"},
            {"field": "rank", "label": "Order", "type": "number"},
        ],
        "impressions", "desc",
    ),
    table(
        "aug5_mix_table", "5 Ağustos vs diğer altı gün: ABD karması",
        "Ülke toplamları property grafiğiyle tam uzlaşır; iki dönem birbirini dışlar.",
        "aug5_mix_rows", "followup_analysis",
        [
            {"field": "segment", "label": "Segment", "type": "text"},
            {"field": "other6_impressions", "label": "Other 6d imps", "type": "number"},
            {"field": "other6_share", "label": "Other 6d share", "type": "percent"},
            {"field": "other6_ctr", "label": "Other 6d CTR", "type": "percent"},
            {"field": "aug5_impressions", "label": "Aug 5 imps", "type": "number"},
            {"field": "aug5_share", "label": "Aug 5 share", "type": "percent"},
            {"field": "aug5_ctr", "label": "Aug 5 CTR", "type": "percent"},
            {"field": "rank", "label": "Order", "type": "number"},
        ],
        "rank", "asc",
    ),
    table(
        "aug5_top_pages_table", "5 Ağustos: en yüksek gösterimli sayfalar",
        "Top 10 sayfa property gösterimlerinin %60,1'ini taşır; patlama tek URL'ye bağlı değildir.",
        "aug5_top_page_rows", "followup_analysis",
        [
            {"field": "page", "label": "Page", "type": "text"},
            {"field": "group", "label": "Group", "type": "text"},
            {"field": "clicks", "label": "Clicks", "type": "number"},
            {"field": "impressions", "label": "Impressions", "type": "number"},
            {"field": "ctr", "label": "CTR", "type": "percent"},
            {"field": "position", "label": "Avg pos.", "type": "number"},
            {"field": "property_share", "label": "Property share", "type": "percent"},
            {"field": "seven_day_share", "label": "Share of page's 7d imps", "type": "percent"},
            {"field": "daily_lift", "label": "vs other-6 daily avg", "type": "number"},
            {"field": "rank", "label": "Rank", "type": "number"},
        ],
        "rank", "asc",
    ),
    table(
        "exact_page_table", "Exact-page sonuçları",
        "Grafik/Sayfa toplamları kontrol kaynağıdır; source-preference oranları yalnız görünür query alt kümesidir.",
        "exact_page_rows", "followup_analysis",
        [
            {"field": "page", "label": "Page", "type": "text"},
            {"field": "clicks", "label": "Clicks", "type": "number"},
            {"field": "impressions", "label": "Impressions", "type": "number"},
            {"field": "ctr", "label": "CTR", "type": "percent"},
            {"field": "position", "label": "Avg pos.", "type": "number"},
            {"field": "visible_query_coverage", "label": "Visible query coverage", "type": "percent"},
            {"field": "source_preference_share", "label": "Source-pref. share (visible)", "type": "percent"},
            {"field": "first7_share", "label": "First-7 share", "type": "percent"},
            {"field": "assessment", "label": "Assessment", "type": "text"},
            {"field": "rank", "label": "Rank", "type": "number"},
        ],
        "rank", "asc",
    ),
    table(
        "exact_query_table", "Exact-page görünür query kümeleri",
        "Kümeler örtüşür. React'te yalnız 251, HTML'de 155 raporlanabilir gösterim vardır; yüzdeler tüm sayfa trafiğini temsil etmez.",
        "exact_query_rows", "followup_analysis",
        [
            {"field": "page", "label": "Page", "type": "text"},
            {"field": "cluster", "label": "Signal", "type": "text"},
            {"field": "definition", "label": "Rule", "type": "text"},
            {"field": "rows", "label": "Rows", "type": "number"},
            {"field": "impressions", "label": "Visible imps", "type": "number"},
            {"field": "visible_impression_share", "label": "Visible share", "type": "percent"},
            {"field": "ctr", "label": "CTR", "type": "percent"},
            {"field": "position", "label": "Avg pos.", "type": "number"},
            {"field": "rank", "label": "Order", "type": "number"},
        ],
        "rank", "asc",
    ),
    table(
        "trivia_exact_intent_table", "Exact-page docs vs non-doc visible queries",
        "Angular and React/HTML use adjacent but non-identical windows; query rows are reportable subsets, while page totals remain authoritative.",
        "trivia_exact_intent_rows", "zero_click_analysis",
        [
            {"field": "page", "label": "Page", "type": "text"},
            {"field": "window", "label": "Window", "type": "text"},
            {"field": "page_clicks", "label": "Page clicks", "type": "number"},
            {"field": "page_impressions", "label": "Page imps", "type": "number"},
            {"field": "page_ctr", "label": "Page CTR", "type": "percent"},
            {"field": "page_position", "label": "Page pos.", "type": "number"},
            {"field": "visible_query_coverage", "label": "Visible coverage", "type": "percent"},
            {"field": "docs_impressions", "label": "Docs imps", "type": "number"},
            {"field": "docs_visible_share", "label": "Docs visible share", "type": "percent"},
            {"field": "docs_clicks", "label": "Docs clicks", "type": "number"},
            {"field": "docs_position", "label": "Docs pos.", "type": "number"},
            {"field": "non_docs_impressions", "label": "Non-doc imps", "type": "number"},
            {"field": "non_docs_clicks", "label": "Non-doc clicks", "type": "number"},
            {"field": "non_docs_position", "label": "Non-doc pos.", "type": "number"},
            {"field": "rank", "label": "Order", "type": "number"},
        ],
        "rank", "asc",
    ),
    table(
        "metadata_table", "Current rendered metadata on priority pages",
        "Extracted from the current prerendered HTML, not from the internal SEO manifest.",
        "metadata_rows", "rendered_metadata",
        [
            {"field": "page", "label": "Page", "type": "text"},
            {"field": "title", "label": "Rendered title", "type": "text"},
            {"field": "title_chars", "label": "Title chars", "type": "number"},
            {"field": "description_chars", "label": "Desc chars", "type": "number"},
            {"field": "h1_alignment", "label": "H1 alignment", "type": "text"},
            {"field": "ctr_3m", "label": "3m CTR", "type": "percent"},
            {"field": "assessment", "label": "Assessment", "type": "text"},
            {"field": "rank", "label": "Rank", "type": "number"},
        ],
        "rank", "asc",
    ),
    table(
        "repo_risk_table", "SEO implementation findings",
        "Current repository and prerender output; no source file was edited for this diagnosis.",
        "repo_risk_rows", "repo_seo_generator",
        [
            {"field": "finding", "label": "Finding", "type": "text"},
            {"field": "evidence", "label": "Evidence", "type": "text"},
            {"field": "ctr_link", "label": "CTR relevance", "type": "text"},
            {"field": "priority", "label": "Priority", "type": "text"},
            {"field": "rank", "label": "Rank", "type": "number"},
        ],
        "rank", "asc",
    ),
    table(
        "quality_table", "Data quality and interpretation checks",
        "Checks that determine which exported grains are safe to use for each claim.",
        "quality_rows", "analysis_results",
        [
            {"field": "check", "label": "Check", "type": "text"},
            {"field": "evidence", "label": "Evidence", "type": "text"},
            {"field": "impact", "label": "Analytical impact", "type": "text"},
            {"field": "assessment", "label": "Assessment", "type": "text"},
            {"field": "rank", "label": "Rank", "type": "number"},
        ],
        "rank", "asc",
    ),
    table(
        "exports_table", "Requested evidence status",
        "The three requested workbooks are received and validated; the generative-AI report is optional.",
        "export_rows", "followup_analysis",
        [
            {"field": "priority", "label": "Priority", "type": "number"},
            {"field": "export", "label": "Export", "type": "text"},
            {"field": "filters", "label": "Filters", "type": "text"},
            {"field": "why", "label": "What it resolves", "type": "text"},
        ],
        "priority", "asc",
    ),
]

blocks = [
    {"id": "title", "type": "markdown", "body": f"# {TITLE}"},
    {
        "id": "executive_summary",
        "type": "markdown",
        "body": """## Executive Summary

- **Kısa dönem düşüşü artık net: 5 Ağustos'ta geniş bir ABD/masaüstü görünürlük dalgası oluştu.** Günün 7.884 gösteriminin %92,3'ü ABD, %99,5'i masaüstü; CTR %0,076. Aynı gün ABD ve ABD dışı ortalama pozisyonları neredeyse eşitken CTR farkı 59,8 kattı.
- **Bu tek sayfa veya tek bozuk title olayı değil.** Interview hub + framework-prep sayfaları 4.281 gösterim ve sıfır tık üretti; trivia ile birlikte 5 Ağustos sayfa tablosunun %85,2'sini oluşturdu. İlk beş sayfa 3.292 gösterim/sıfır tık aldı, fakat en büyük sayfanın payı yalnız %11.
- **Docs/reference intent büyük ama tek neden değil.** Yüksek güvenle trivia konularına eşlenen 4.600 görünür gösterimin %75,3'ü docs/reference modifier taşıyor ve sıfır tıkta; docs-dışı 1.138 gösterim de yalnız 1 tık aldı. Üç exact sayfada docs-dışı görünür sorgular toplam 0/402 ve 5,76 ağırlıklı pozisyonda.
- **Karar iki parçalı olmalı.** Public trivia çıktısındaki ortak source/reference sinyalleri merkezden kaldırılmalı; fakat CTR iyileşmesi için direct-answer/factoid sayfalarına tek cümlelik cevabın ötesinde tıklama gerektiren pratik değer eklenmeli. Toplu title/meta değişikliği için hâlâ kanıt yok.""",
    },
    {"id": "headline_metrics", "type": "metric-strip", "cardIds": ["ctr_3m_card", "recent_ctr_card", "us_mix_card", "aug5_card"]},
    {
        "id": "definitions",
        "type": "markdown",
        "body": """## Bu sayıları nasıl okumalıyız?

**Site CTR'si** için grafik/ülke/cihaz toplamları yetkilidir. **Sayfa tablosu** URL bazında toplandığı için aynı sonuç sayfasında birden fazla FrontendAtlas URL'si göründüğünde property toplamını aşabilir. **Zero-click URL**, belirtilen pencerede GSC Pages satırında tam olarak sıfır tık alan URL'dir. **Query coverage** anonim sorgular nedeniyle eksiktir; “%75,3 docs” yalnız 4.600 gösterimlik, görünür ve kural-bazlı topic-mapped örnektir. Pozisyon bantları `0<p≤5`, `5<p≤10`, `10<p≤20`, `p>20` olarak birbirini dışlar.""",
    },
    {"id": "period_table_block", "type": "table", "tableId": "period_table"},
    {
        "id": "country_finding",
        "type": "markdown",
        "sourceId": "analysis_results",
        "body": """## Son düşüşü ABD ağırlığındaki trafik karması açıklıyor

Son 7 günde ABD gösterim payı önceki 21 gündeki %52,8'den %77,6'ya çıktı. ABD CTR'si %0,066'dan %0,030'a gerilerken ABD dışı CTR %0,666'dan %0,878'e yükseldi. İki segmentli Shapley ayrıştırması toplam −0,1295 yüzde puan CTR hareketini −0,1800 puan **mix etkisi** ve +0,0505 puan **segment içi etki** olarak tam uzlaştırıyor.

**Sonuç:** kısa dönem alarmı, site-geneli snippet çöküşü olarak yorumlanmamalı. Önce ABD'deki gösterim türü ve sorgu/sayfa bileşimi bulunmalı.""",
    },
    {"id": "country_chart_block", "type": "chart", "chartId": "country_ctr_chart"},
    {"id": "mix_table_block", "type": "table", "tableId": "mix_table"},
    {
        "id": "spike_finding",
        "type": "markdown",
        "sourceId": "followup_analysis",
        "body": """## 5 Ağustos tek günlük bir gösterim patlaması

5 Ağustos'taki 7.884 gösterim, bir gün önceki 724 gösterimin 10,9 katı; ertesi gün 979'a geri dönüyor. Bu gün son haftanın gösterimlerinin %62'sini ama tıkların yalnız %21,4'ünü üretti. Gün çıkarıldığında haftalık CTR %0,220'den %0,455'e yükseliyor.

Yeni export, günün %92,3 ABD ve %99,5 masaüstü olduğunu doğruluyor. ABD CTR'si %0,0137; ABD dışı CTR %0,822 ve ortalama pozisyonlar 17,35'e karşı 17,32. Diğer altı güne göre CTR kaybının %82,7'si ABD payının %53,7'den %92,3'e çıkmasıyla, %17,3'ü ülke-içi değişimle açıklanıyor.

**Sonuç:** haftalık çöküş site-geneli title/meta arızası değil; düşük sıralı, ABD/masaüstü ağırlıklı geçici görünürlük genişlemesidir.""",
    },
    {"id": "daily_chart_block", "type": "chart", "chartId": "daily_impressions_chart"},
    {
        "id": "aug5_scope_finding",
        "type": "markdown",
        "sourceId": "followup_analysis",
        "body": """## Patlama geniş bir interview/prep cohortuna yayıldı

İlk beş sayfa 3.292 gösterim ve sıfır tık aldı: Angular prep path, Vue interview hub, Vue prep path, HTML/CSS interview hub ve React interview hub. Bu sayfalar o gün 17,7–19,1 ortalama pozisyonlardaydı. En büyük URL toplamın yalnız %11'ini, ilk 10 URL %60,1'ini taşıdı; dolayısıyla olay tek URL değildir.

Interview hub + framework-prep aileleri 4.281 gösterim/sıfır tık üretti. Trivia ile birlikte sayfa tablosunun %85,2'sine ulaştı. 10–20 ortalama pozisyon bandı da sayfa gösterimlerinin yaklaşık %91'ini ve yalnız %0,056 CTR'yi taşıdı. Görünür query tablosu günün sadece %1,89'unu açıkladığı için bunu belirli sorgu ya da AI özelliğine bağlamak mümkün değildir.""",
    },
    {"id": "aug5_group_chart_block", "type": "chart", "chartId": "aug5_group_chart"},
    {"id": "aug5_mix_table_block", "type": "table", "tableId": "aug5_mix_table"},
    {"id": "aug5_top_pages_block", "type": "table", "tableId": "aug5_top_pages_table"},
    {
        "id": "content_finding",
        "type": "markdown",
        "sourceId": "analysis_results",
        "body": """## Kalıcı düşük CTR birkaç içerik ailesinde yoğunlaşıyor

Üç aylık sayfa tablosunda trivia sayfaları 34.629 gösterimde 37 tık (%0,107); system-design blueprint sayfaları 11.842 gösterimde 10 tık (%0,084) üretiyor. Buna karşılık doğrudan system-design problem sayfaları ve ana sayfa, daha kötü ortalama pozisyonlarda bile daha yüksek CTR alıyor.

Ortalama pozisyonu **5'ten büyük ve 10'a eşit/daha iyi** olan sayfa satırları 37.228 gösterimde yalnız 36 tık (%0,097); 10–20 bandı %0,489. Bu ekolojik test gerçek impression-level pozisyon eğrisi değildir, fakat “sadece ikinci sayfadayız” açıklamasını reddetmek için yeterlidir.""",
    },
    {"id": "page_group_chart_block", "type": "chart", "chartId": "page_group_ctr_chart"},
    {"id": "position_table_block", "type": "table", "tableId": "position_table"},
    {
        "id": "trivia_zero_click_finding",
        "type": "markdown",
        "sourceId": "zero_click_analysis",
        "body": """## Trivia zero-click sorunu long-tail sayısından ibaret değil

Üç ayda 133 trivia URL'si 34.629 gösterimde 37 tık aldı: CTR %0,107. URL'lerin 121'i literal zero-click olsa da bunlar gösterimlerin yalnız %31,3'ünü taşıyor. Tık alan 12 yüksek hacimli sayfanın CTR'si de yalnız %0,156; yani sorun yalnız çok sayıdaki küçük sayfanın sıfır tık alması değil.

Ortalama pozisyonu 5–10 olan trivia satırları 26.003 gösterimde %0,100 CTR üretirken 10–20 bandı %0,133 üretiyor. Teknoloji kırılımı da uniform değil: JavaScript %0,248 ve Angular %0,148; React yalnız %0,0316, HTML/Vue sıfır. **Sonuç:** rank tek kök neden değil; React/HTML ve beş docs-heavy konu önce ele alınmalı.""",
    },
    {"id": "trivia_page_position_table_block", "type": "table", "tableId": "trivia_page_position_table"},
    {"id": "trivia_tech_cohort_table_block", "type": "table", "tableId": "trivia_tech_cohort_table"},
    {"id": "priority_pages_block", "type": "table", "tableId": "priority_pages_table"},
    {
        "id": "intent_finding",
        "type": "markdown",
        "sourceId": "analysis_results",
        "body": """## Görünür sorgular source-preference ve AI-benzeri intent gösteriyor

Dar ve denetlenebilir tam ifade `official docs` alt kümesi dahi 1.443 görünür gösterim, 0 tık ve 6,85 ortalama pozisyon üretiyor. Daha geniş `official/docs/documentation` kuralı 3.278 gösterimde yine sıfır tıkta kalıyor. Angular HttpClient cancellation ve RADIO kümeleri benzer biçimde iyi ortalama pozisyona rağmen çok düşük CTR taşıyor.

Bu sonuç, kullanıcıların özellikle birincil dokümantasyon ararken FrontendAtlas yerine Angular/React/MDN gibi kaynakları tercih ettiğini düşündürüyor. Ayrıca uzun, şablonlaşmış RADIO sorguları AI Mode'un çoklu alt konu aramalarına benziyor; **bu bir hipotezdir**, generative-AI raporuyla sınanmalıdır. Query exportu toplam gösterimlerin yalnız %18,5'ini kapsadığı için kümeler alt sınırdır.""",
    },
    {"id": "query_clusters_block", "type": "table", "tableId": "query_clusters_table"},
    {
        "id": "trivia_intent_split_finding",
        "type": "markdown",
        "sourceId": "zero_click_analysis",
        "body": """## Docs intent baskın; docs-dışı sorgular da tıklanmıyor

Yüksek güvenle trivia konularına eşlenen görünür üç aylık örnekte docs/reference sorguları 0/3.462, 7,49 pozisyonda; docs-dışı direct-answer/factoid sorgular 1/1.138, 8,12 pozisyonda. 5–10 query-position bandında docs 0/3.415, docs-dışı 1/952. Docs modifier, mapped görünür hacmin %75,3'ünü açıklıyor ama tek neden olamaz.

Exact Angular, React ve HTML sayfalarında docs-dışı görünür sorgular birleşik 0/402 ve 5,76 ağırlıklı pozisyonda. Bu, **answer-in-SERP / tıklamadan tatmin edilen factoid** davranışını ikinci ana mekanizma yapıyor. Search Appearance verisi olmadığından bunun featured snippet, AI sonucu veya sıradan no-click davranışından hangisi olduğu ayrıştırılamaz.""",
    },
    {"id": "trivia_intent_position_chart_block", "type": "chart", "chartId": "trivia_intent_position_chart"},
    {"id": "trivia_exact_intent_table_block", "type": "table", "tableId": "trivia_exact_intent_table"},
    {
        "id": "exact_page_finding",
        "type": "markdown",
        "sourceId": "followup_analysis",
        "body": """## Exact-page sonuçları aynı sorunun iki farklı biçimini gösteriyor

### React: geçici exposure dalgası + iki intent

`/react/trivia/react-render-nothing-return-value` 28 günde 2.719 gösterim/1 tık (%0,0368 CTR), 8,65 ortalama pozisyon aldı. İlk yedi gün gösterimlerin %63,2'sini taşıdı; sonraki 21 günde hacim 1.001'e indi, pozisyon yine yaklaşık 8,7 kaldı. Bu ranking çöküşünden çok geçici ilk-hafta exposure dalgasıdır. Görünür 251 gösterimin %64,1'i docs/documentation/official modifier, önemli bir kısmı da JSX-child ve eski React error semantiği taşıyor. Mevcut title component-return niyetini karşılıyor; snippet'teki “Practice…” dili kaynak arayan kullanıcıya zayıf kalıyor.

**Karar:** public source-check bloğunu ve reference şemasını trivia'dan çıkarın; component-vs-JSX-child ayrımını interview-practice değer önerisi içinde tutun. Hemen yeniden title değiştirmeyin; önce merkezi intent temizliğinin cohort etkisini ölçün.

### HTML: açık authority/navigational intent uyumsuzluğu

`/html/trivia/html-form-default-method` 1.113 gösterim/sıfır tık ve 7,65 ortalama pozisyon aldı; 28 günün tamamı sıfır tık. Görünür 155 gösterimin %68,4'ü açıkça MDN, daha geniş source-preference kümesi %79,4. Bu, üçüncü taraf interview/trivia sayfasının MDN/standart navigational sorgularında 7–8. sırada görünmesi; iyi metadata bile tıklama üretmeyebilir. Basit factoid cevap SERP'te tıklamadan da tüketilebilir.

**Karar:** başlığa `MDN` ekleyerek branded intent kovalamayın ve trivia'ya görünür reference bloğu eklemeyin. MDN/WHATWG derinliği ürün açısından gerekliyse ayrı, benzersiz ve self-canonical reference guide oluşturun. Trivia sayfası interview/practice rolünde kalsın; direct-answer sorgularında ise minimal örneğin ötesinde kullanıcıyı tıklamaya değer kılan test/decision değeri sunun.""",
    },
    {"id": "exact_page_daily_chart_block", "type": "chart", "chartId": "exact_page_daily_chart"},
    {"id": "exact_page_table_block", "type": "table", "tableId": "exact_page_table"},
    {"id": "exact_query_table_block", "type": "table", "tableId": "exact_query_table"},
    {
        "id": "metadata_finding",
        "type": "markdown",
        "sourceId": "rendered_metadata",
        "body": """## Öncelikli sayfalarda toplu metadata değişikliği desteklenmiyor

En yüksek gösterimli beş düşük-CTR sayfanın güncel prerender title ve description'ları açık, benzersiz ve içerikle uyumlu. React ve HTML exact exportları da canonical/metadata kaybını değil, görünür sorgularda source-preference intentini işaret ediyor. Bu iki sayfada snippet testi yapılabilir; fakat bu, site-geneli otomatik başlık yeniden yazımı için kanıt değildir.

Angular HttpClient sayfasının title'ı 3 Ağustos'ta değişti; önceki exact-page audit yeni snippet için temiz bir post-crawl pencere olmadığını gösterdi. **Bu sayfayı tekrar değiştirmeyin; ölçüm penceresini tamamlayın.**""",
    },
    {"id": "metadata_table_block", "type": "table", "tableId": "metadata_table"},
    {
        "id": "repo_finding",
        "type": "markdown",
        "sourceId": "repo_seo_generator",
        "body": """## Teknik temel iyi; iç SEO ölçüm ekranında kör nokta var

Mevcut build'de sitemap/prerender/canonical/H1 kapsamı güçlü; bu nedenle eksik tag veya genel canonical arızası ana neden değil. Buna karşılık SEO intelligence manifesti çoğu sayfada gerçek prerender `<title>`/description yerine registry metnini gösteriyor. 348/435 title ve 356/435 description farklı; dashboard bu alanları kullanıyor.

Ek olarak 46 indexlenebilir title `Interview Answer` kalıbı taşıyor ve bazı prompt dönüşümleri dilbilgisel olarak bozuk. GSC'de üç ayda görünen 24 URL 1.069 gösterim/2 tık (%0,187 CTR) aldı; bu property gösterimlerinin yalnız %1,49'u. Kusur gerçek, fakat aggregate düşük CTR'nin nedeni değil. **Dashboard gerçek prerender metadata ile uzlaştırılmadan otomatik snippet aksiyonu yine de güvenli değil.**""",
    },
    {"id": "repo_table_block", "type": "table", "tableId": "repo_risk_table"},
    {
        "id": "data_quality",
        "type": "markdown",
        "body": """## Veri güvenilir; çapraz boyut eksikliği nedenselliği sınırlar

5 Ağustos dosyasında ülke ve cihaz toplamları property grafiğiyle tam uzlaşıyor; üç yeni dosyada tarih, filtre, CTR yuvarlaması ve anahtar kontrolleri geçti. React ve HTML exact-page dosyalarında ise query/country/device sekmeleri sırasıyla yalnız 251 ve 155 raporlanabilir gösterime uzlaşıyor. Bu, dosya bozukluğu değil; anonim sorgu filtrelemesiyle tutarlı bir kapsam sınırıdır.

XLSX'ler yine tek boyutlu marjinaller sunuyor; `date × page × query × country × device` birleşik grain yok. Bu nedenle 5 Ağustos'un en az %91,8'inin hem ABD hem masaüstü olduğu sınırlandırılabilir, fakat belirli sayfa + sorgu + ülke + cihaz zinciri kurulamaz.""",
    },
    {"id": "quality_table_block", "type": "table", "tableId": "quality_table"},
    {
        "id": "recommended_steps",
        "type": "markdown",
        "body": """## Önerilen sonraki adımlar

1. **5 Ağustos için site-geneli metadata değiştirmeyin.** Olayı ayrı bir görünürlük dalgası olarak etiketleyin; interview hub ve framework-prep ailelerinde tekrar edip etmediğini günlük izleyin.
2. **Merkezi trivia intent temizliğini tek müdahale olarak ölçün.** Source/reference-only bloklarını public route ve TransferState'ten çıkarın; trivia şemasını `BreadcrumbList + Article` ile sınırlandırın; practice değer önerisini quick answer sonrasına taşıyın. Aynı anda title/meta değiştirmeyin.
3. **Beş docs-heavy konuyu cohort olarak izleyin.** Angular HttpClient, React render-nothing, stale closures, StrictMode ve HTML form-default üç aylık trivia gösterimlerinin %61,7'sini fakat yalnız %0,0796 CTR'yi taşıyor. Deploy sonrası 3–4 tamamlanmış hafta docs-modifier payı, non-doc CTR, gösterim ve pozisyonu birlikte karşılaştırın.
4. **Direct-answer sayfalarına tıklama gerektiren değer ekleyin.** Tek cümlelik factoid cevabın ötesinde çalıştırılabilir test, karar ağacı, failure prediction veya gerçek debugging kanıtı sunun. Reference derinliği gerekiyorsa ayrı, benzersiz self-canonical guide'a taşıyın.
5. **SEO dashboard'unu gerçek prerender metadata ile uzlaştırın.** Aksi halde yanlış başlık/description cohortları görünmez kalır. Generative AI raporu görünüyorsa yalnız exposure mekanizmasını daraltmak için isteğe bağlı kullanın.""",
    },
    {"id": "exports_table_block", "type": "table", "tableId": "exports_table"},
    {
        "id": "further_questions",
        "type": "markdown",
        "body": """## Açık kalan sorular

- 5 Ağustos'taki düşük sıralı ABD/masaüstü exposure dalgası generative-AI görünümünden mi, klasik Web query inventory genişlemesinden mi geldi?
- Google React ve HTML sayfalarında bildirilen `<title>`/description'ı mı gösterdi, yoksa query'ye göre başka bir title link/snippet mi üretti?
- Merkezi source/schema temizliğinden 3–4 tamamlanmış hafta sonra docs-modifier payı düşerken non-doc CTR, ortalama pozisyon ve gösterim hacmi korunuyor mu?
- Exact URL + docs-regex karşılaştırması, property-level proxy sorguların gerçekten aynı trivia URL'sine gitmeye devam ettiğini doğruluyor mu?""",
    },
    {
        "id": "caveats",
        "type": "markdown",
        "body": """## Sınırlamalar ve varsayımlar

- Exact-page query/country/device oranları React'te 251, HTML'de 155 raporlanabilir gösterime aittir; tüm 2.719/1.113 gösterime genellenmez.
- `%75,3 docs` oranı yalnız 4.600 gösterimlik, görünür ve topic-mapped query örneğidir; bütün trivia trafiğine genellenmez.
- Property-level query exportunda URL boyutu yoktur. Sorguda `docs`, `MDN` veya `official` bulunması tek başına uygulamanın Google'a docs sinyali gönderdiğini kanıtlamaz.
- Angular exact-page penceresi 8 Temmuz–4 Ağustos, React/HTML pencereleri 12 Temmuz–8 Ağustos'tur; exact-page satırları yön gösterir fakat tek birleşik cohort değildir.
- 5 Ağustos query tablosu gösterimlerin yalnız %1,89'unu kapsar; günün sorgu veya SERP-feature nedeni doğrulanamaz.
- Sayfa tablosu URL bazında, grafik property bazında toplandığı için sayfa satırları site toplamına eklenmez.
- Ortalama pozisyon, impression-level sıra dağılımı değildir; position-band karşılaştırması kaba bir ekolojik testtir.
- Ülke ve cihaz ayrıştırmaları aynı trafiğin farklı marjinalleridir; etkileri birbirine eklenemez.
- Search Appearance sekmesinin boş olması özel appearance sınıfı raporlanmadığını gösterir; normal Web sonucunun yokluğu anlamına gelmez.
- Google'ın gerçek SERP title/snippet rewrite'ı ve canlı deploy'un local prerender ile birebir eşleşmesi XLSX'lerden doğrulanamaz.
- Yeni dosyalar önceki exportlarla aynı adları kullandığı için 3 ay/28 gün/7 gün/24 saat geçmiş analizi raporda salt-okuma `source_extract.json` kopyasından sürdürülür.
- Kaynak XLSX'ler ve production state değiştirilmedi. Bu raporun ardından public trivia intent sözleşmesi local uygulama kaynaklarında güncellendi; deploy ve GSC etkisi henüz gözlenmedi.""",
    },
]

artifact = {
    "surface": "report",
    "manifest": {
        "version": 1,
        "surface": "report",
        "title": TITLE,
        "description": "Source-backed diagnosis of FrontendAtlas Google Search CTR, the Aug 5 US/desktop exposure wave, trivia zero-click behavior, visible-query intent, metadata quality, and prioritized actions.",
        "generatedAt": GENERATED_AT,
        "cards": cards,
        "charts": charts,
        "tables": tables,
        "sources": sources,
        "blocks": blocks,
    },
    "snapshot": {
        "version": 1,
        "generatedAt": GENERATED_AT,
        "status": "ready",
        "datasets": {
            "headline": headline,
            "daily_3m": ANALYSIS["daily_3m"],
            "period_rows": period_rows,
            "country_rows": country_rows,
            "mix_rows": mix_rows,
            "page_groups_3m": page_group_rows,
            "position_rows": position_rows,
            "priority_pages": priority_pages,
            "query_cluster_rows": query_cluster_rows,
            "metadata_rows": metadata_rows,
            "repo_risk_rows": repo_risk_rows,
            "quality_rows": quality_rows,
            "export_rows": export_rows,
            "aug5_group_rows": aug5_group_rows,
            "aug5_top_page_rows": aug5_top_page_rows,
            "aug5_mix_rows": aug5_mix_rows,
            "exact_page_rows": exact_page_rows,
            "exact_daily_rows": exact_daily_rows,
            "exact_query_rows": exact_query_rows,
            "trivia_page_position_rows": trivia_page_position_rows,
            "trivia_tech_cohort_rows": trivia_tech_cohort_rows,
            "trivia_intent_position_rows": trivia_intent_position_rows,
            "trivia_exact_intent_rows": trivia_exact_intent_rows,
        },
    },
    "sources": sources,
    "package_info": {
        "originUrl": "artifact://frontendatlas-gsc-ctr-diagnostic-2026-08-10",
        "controls": {"edit": False, "refresh": False, "share": False, "export": False},
    },
}

(OUTPUT_DIR / "rendered_metadata_audit.json").write_text(
    json.dumps(metadata_rows, ensure_ascii=False, indent=2), encoding="utf-8"
)
(OUTPUT_DIR / "repo_seo_audit.json").write_text(
    json.dumps(repo_risk_rows, ensure_ascii=False, indent=2), encoding="utf-8"
)
(OUTPUT_DIR / "artifact.json").write_text(
    json.dumps(artifact, ensure_ascii=False, indent=2), encoding="utf-8"
)
print(json.dumps({
    "artifact": str(OUTPUT_DIR / "artifact.json"),
    "blocks": len(blocks),
    "charts": len(charts),
    "tables": len(tables),
    "datasets": {key: len(value) for key, value in artifact["snapshot"]["datasets"].items()},
}, ensure_ascii=False, indent=2))
