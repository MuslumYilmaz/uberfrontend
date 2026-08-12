#!/usr/bin/env python3
"""Reproduce the trivia zero-click and visible-query intent cohorts.

The script reads only materialized JSON extracts. The Downloads XLSX names were
reused for later exports, so re-reading those files would corrupt the original
3m/28d comparison.
"""

from __future__ import annotations

import json
import math
import re
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse


OUTPUT_DIR = Path(__file__).resolve().parent
BASE_EXTRACT_PATH = OUTPUT_DIR / "source_extract.json"
FOLLOWUP_EXTRACT_PATH = OUTPUT_DIR / "followup_source_extract.json"
ANGULAR_EXTRACT_PATH = OUTPUT_DIR.parent / "seo-gsc-page-audit-2026-08-07" / "source_extract.json"
OUT_PATH = OUTPUT_DIR / "zero_click_analysis.json"
GENERATED_AT = "2026-08-11T00:00:00+03:00"

DOCS_MODIFIER_PATTERN = (
    r"\b(?:official|docs?|documentation|mdn|whatwg|w3c|specification|mozilla)\b"
    r"|angular\.dev|react\.dev|\b(?:official|api|language)\s+reference\b"
)
DOCS_MODIFIER_RE = re.compile(DOCS_MODIFIER_PATTERN, re.IGNORECASE)
INTERVIEW_RE = re.compile(r"\binterview\b", re.IGNORECASE)

PAGE_POSITION_BANDS = (
    ("1–5", lambda value: 0 < value <= 5),
    ("5–10", lambda value: 5 < value <= 10),
    ("10–20", lambda value: 10 < value <= 20),
    ("20+", lambda value: value > 20),
)

TOPIC_RULE_DESCRIPTIONS = [
    "Angular HttpClient cancellation: angular AND httpclient AND (cancel|abort|unsubscribe|observable.*complete|testrequest)",
    "React render nothing: (react|jsx) AND (undefined|null|nothing was returned|render nothing|renders nothing)",
    "HTML form defaults: (html|form|mdn|whatwg) AND form AND (method|action|GET|POST|omitt|missing|default)",
    "React StrictMode: react AND (strictmode|strict mode)",
    "React stale closures: (react|usecallback) AND (stale closure|stale state|state as a snapshot|retained callback|usecallback dependenc)",
    "NgRx selectors: ngrx AND (selector|memoiz)",
    "JS equality: (javascript|js|mdn) AND (strict equality|loose equality|===|== vs|equality comparison|arrays compared by reference)",
    "JS event loop: (javascript|js|mdn) AND (event loop|microtask|macrotask)",
    "React purity: react AND (components and hooks must be pure|render should be pure|side effects.*render)",
    "React list keys: react AND (list keys|keys stable|key stable identity)",
    "React derived state: react AND derived state",
    "RxJS operators: switchmap|mergemap|concatmap|exhaustmap|tap vs map",
    "Angular lifecycle: ngoninit|ngafterviewinit|constructor.*oninit",
]


def ratio(numerator: float, denominator: float) -> float:
    return numerator / denominator if denominator else 0.0


def normalize_query(value: object) -> str:
    return " ".join(str(value).lower().split())


def weighted_position(rows: list[list], impressions_index: int, position_index: int) -> float:
    impressions = sum(float(row[impressions_index] or 0) for row in rows)
    return ratio(
        sum(float(row[impressions_index] or 0) * float(row[position_index] or 0) for row in rows),
        impressions,
    )


def summarize_rows(rows: list[list], clicks_index: int = 1, impressions_index: int = 2,
                   position_index: int = 4) -> dict:
    clicks = int(sum(float(row[clicks_index] or 0) for row in rows))
    impressions = int(sum(float(row[impressions_index] or 0) for row in rows))
    return {
        "rows": len(rows),
        "clicks": clicks,
        "impressions": impressions,
        "ctr": ratio(clicks, impressions),
        "position": weighted_position(rows, impressions_index, position_index),
    }


def topic_for_query(query: str) -> str | None:
    rules = (
        (
            "Angular HttpClient cancellation",
            bool(re.search(r"angular", query))
            and bool(re.search(r"httpclient", query))
            and bool(re.search(r"cancel|abort|unsubscribe|observable.*complete|testrequest", query)),
        ),
        (
            "React render nothing",
            bool(re.search(r"react|jsx", query))
            and bool(re.search(r"undefined|null|nothing was returned|render nothing|renders nothing", query)),
        ),
        (
            "HTML form defaults",
            bool(re.search(r"html|form|mdn|whatwg", query))
            and bool(re.search(r"form", query))
            and bool(re.search(r"method|action|\bget\b|\bpost\b|omitt|missing|default", query)),
        ),
        (
            "React StrictMode",
            bool(re.search(r"react", query)) and bool(re.search(r"strictmode|strict mode", query)),
        ),
        (
            "React stale closures",
            bool(re.search(r"react|usecallback", query))
            and bool(re.search(
                r"stale closure|stale state|state as a snapshot|retained callback|usecallback dependenc",
                query,
            )),
        ),
        (
            "NgRx selectors",
            bool(re.search(r"ngrx", query)) and bool(re.search(r"selector|memoiz", query)),
        ),
        (
            "JS equality",
            bool(re.search(r"javascript|\bjs\b|mdn", query))
            and bool(re.search(
                r"strict equality|loose equality|===|== vs|equality comparison|arrays compared by reference",
                query,
            )),
        ),
        (
            "JS event loop",
            bool(re.search(r"javascript|\bjs\b|mdn", query))
            and bool(re.search(r"event loop|microtask|macrotask", query)),
        ),
        (
            "React purity",
            bool(re.search(r"react", query))
            and bool(re.search(
                r"components and hooks must be pure|render should be pure|side effects.*render",
                query,
            )),
        ),
        (
            "React list keys",
            bool(re.search(r"react", query))
            and bool(re.search(r"list keys|keys stable|key stable identity", query)),
        ),
        (
            "React derived state",
            bool(re.search(r"react", query)) and bool(re.search(r"derived state", query)),
        ),
        (
            "RxJS operators",
            bool(re.search(r"switchmap|mergemap|concatmap|exhaustmap|tap vs map", query)),
        ),
        (
            "Angular lifecycle",
            bool(re.search(r"ngoninit|ngafterviewinit|constructor.*oninit", query)),
        ),
    )
    return next((name for name, matched in rules if matched), None)


def position_band(value: float) -> str:
    for label, predicate in PAGE_POSITION_BANDS:
        if predicate(value):
            return label
    raise ValueError(f"Unexpected non-positive position: {value}")


def trivia_rows(source: dict, period: str) -> list[list]:
    return [
        row for row in source[period]["sheets"]["Sayfa sayısı"][1:]
        if "/trivia/" in str(row[0])
    ]


def trivia_summary(rows: list[list], period: str) -> dict:
    metrics = summarize_rows(rows)
    zero_rows = [row for row in rows if int(row[1] or 0) == 0]
    return {
        "period": period,
        "pages": len(rows),
        **{key: metrics[key] for key in ("clicks", "impressions", "ctr", "position")},
        "zero_click_pages": len(zero_rows),
        "zero_click_impressions": int(sum(int(row[2] or 0) for row in zero_rows)),
        "zero_click_impression_share": ratio(
            sum(int(row[2] or 0) for row in zero_rows), metrics["impressions"]
        ),
    }


def page_position_rows(rows: list[list]) -> list[dict]:
    result = []
    for rank, (label, predicate) in enumerate(PAGE_POSITION_BANDS, 1):
        band_rows = [row for row in rows if predicate(float(row[4] or 0))]
        metrics = summarize_rows(band_rows)
        zero_rows = [row for row in band_rows if int(row[1] or 0) == 0]
        zero_impressions = int(sum(int(row[2] or 0) for row in zero_rows))
        result.append({
            "rank": rank,
            "position_band": label,
            "pages": len(band_rows),
            **{key: metrics[key] for key in ("clicks", "impressions", "ctr", "position")},
            "zero_click_pages": len(zero_rows),
            "zero_click_impressions": zero_impressions,
            "zero_click_impression_share": ratio(zero_impressions, metrics["impressions"]),
        })
    return result


def technology_rows(rows: list[list]) -> list[dict]:
    labels = {
        "angular": "Angular",
        "react": "React",
        "javascript": "JavaScript",
        "html": "HTML",
        "vue": "Vue",
        "css": "CSS",
    }
    grouped: dict[str, list[list]] = defaultdict(list)
    for row in rows:
        technology = urlparse(str(row[0])).path.strip("/").split("/", 1)[0]
        grouped[technology].append(row)

    result = []
    for rank, technology in enumerate(("angular", "react", "javascript", "html", "vue", "css"), 1):
        cohort = grouped.get(technology, [])
        metrics = summarize_rows(cohort)
        zero_rows = [row for row in cohort if int(row[1] or 0) == 0]
        zero_impressions = int(sum(int(row[2] or 0) for row in zero_rows))
        result.append({
            "rank": rank,
            "technology": labels[technology],
            "pages": len(cohort),
            **{key: metrics[key] for key in ("clicks", "impressions", "ctr", "position")},
            "zero_click_pages": len(zero_rows),
            "zero_click_impressions": zero_impressions,
            "zero_click_impression_share": ratio(zero_impressions, metrics["impressions"]),
        })
    return result


def mapped_query_outputs(query_rows: list[list]) -> tuple[dict, list[dict], list[dict], list[dict], dict]:
    mapped = []
    for row in query_rows:
        normalized = normalize_query(row[0])
        topic = topic_for_query(normalized)
        if topic:
            mapped.append({
                "query": normalized,
                "topic": topic,
                "intent": "Docs/reference" if DOCS_MODIFIER_RE.search(normalized) else "Docs dışı",
                "has_interview_modifier": bool(INTERVIEW_RE.search(normalized)),
                "clicks": int(row[1] or 0),
                "impressions": int(row[2] or 0),
                "position": float(row[4] or 0),
            })

    def summarize_dict_rows(rows: list[dict]) -> dict:
        clicks = sum(row["clicks"] for row in rows)
        impressions = sum(row["impressions"] for row in rows)
        return {
            "query_rows": len(rows),
            "clicks": clicks,
            "impressions": impressions,
            "ctr": ratio(clicks, impressions),
            "position": ratio(
                sum(row["impressions"] * row["position"] for row in rows), impressions
            ),
        }

    mapped_summary = summarize_dict_rows(mapped)
    intent_rows = []
    for rank, intent in enumerate(("Docs/reference", "Docs dışı"), 1):
        cohort = [row for row in mapped if row["intent"] == intent]
        intent_rows.append({"rank": rank, "intent": intent, **summarize_dict_rows(cohort)})

    intent_position_rows = []
    rank = 1
    for band_label, predicate in PAGE_POSITION_BANDS:
        for intent in ("Docs/reference", "Docs dışı"):
            cohort = [
                row for row in mapped
                if row["intent"] == intent and predicate(row["position"])
            ]
            intent_position_rows.append({
                "rank": rank,
                "position_band": band_label,
                "intent": intent,
                **summarize_dict_rows(cohort),
            })
            rank += 1

    topic_rows = []
    for rank, topic in enumerate((description.split(":", 1)[0] for description in TOPIC_RULE_DESCRIPTIONS), 1):
        cohort = [row for row in mapped if row["topic"] == topic]
        docs_cohort = [row for row in cohort if row["intent"] == "Docs/reference"]
        topic_rows.append({
            "rank": rank,
            "topic": topic,
            **summarize_dict_rows(cohort),
            "docs_impressions": sum(row["impressions"] for row in docs_cohort),
            "docs_impression_share": ratio(
                sum(row["impressions"] for row in docs_cohort),
                sum(row["impressions"] for row in cohort),
            ),
        })

    all_docs = [
        row for row in query_rows
        if DOCS_MODIFIER_RE.search(normalize_query(row[0]))
    ]
    docs_capture = {
        "property_docs_impressions": int(sum(int(row[2] or 0) for row in all_docs)),
        "mapped_docs_impressions": intent_rows[0]["impressions"],
        "mapped_capture_share": ratio(
            intent_rows[0]["impressions"], sum(int(row[2] or 0) for row in all_docs)
        ),
    }
    return mapped_summary, intent_rows, intent_position_rows, topic_rows, docs_capture


def exact_page_row(page: str, window: str, page_row: list, query_rows: list[list],
                   clicks_index: int = 1, impressions_index: int = 2,
                   position_index: int = 4) -> dict:
    docs_rows = [
        row for row in query_rows if DOCS_MODIFIER_RE.search(normalize_query(row[0]))
    ]
    non_docs_rows = [row for row in query_rows if row not in docs_rows]
    docs = summarize_rows(docs_rows, clicks_index, impressions_index, position_index)
    non_docs = summarize_rows(non_docs_rows, clicks_index, impressions_index, position_index)
    visible_impressions = docs["impressions"] + non_docs["impressions"]
    page_clicks = int(page_row[1] or 0)
    page_impressions = int(page_row[2] or 0)
    return {
        "page": page,
        "window": window,
        "page_clicks": page_clicks,
        "page_impressions": page_impressions,
        "page_ctr": ratio(page_clicks, page_impressions),
        "page_position": float(page_row[4] or 0),
        "visible_query_impressions": visible_impressions,
        "visible_query_coverage": ratio(visible_impressions, page_impressions),
        "docs_clicks": docs["clicks"],
        "docs_impressions": docs["impressions"],
        "docs_visible_share": ratio(docs["impressions"], visible_impressions),
        "docs_position": docs["position"],
        "non_docs_clicks": non_docs["clicks"],
        "non_docs_impressions": non_docs["impressions"],
        "non_docs_visible_share": ratio(non_docs["impressions"], visible_impressions),
        "non_docs_position": non_docs["position"],
    }


def exact_page_outputs(followup: dict, angular: list[dict]) -> list[dict]:
    angular_compare = angular[1]["sheets"]
    angular_row = angular_compare["Sayfa sayısı"][1]
    angular_page_row = [angular_row[0], angular_row[1], angular_row[3], angular_row[5], angular_row[7]]
    result = [
        exact_page_row(
            "Angular HttpClient cancellation",
            "2026-07-08–2026-08-04",
            angular_page_row,
            angular_compare["Sorgular"][1:],
            clicks_index=1,
            impressions_index=3,
            position_index=7,
        )
    ]
    for key, label in (("react", "React render nothing"), ("html", "HTML form defaults")):
        sheets = followup[key]["sheets"]
        result.append(exact_page_row(
            label,
            "2026-07-12–2026-08-08",
            sheets["Sayfa sayısı"][1],
            sheets["Sorgular"][1:],
        ))
    return [{"rank": rank, **row} for rank, row in enumerate(result, 1)]


def docs_heavy_summary(rows: list[list]) -> dict:
    heavy_urls = {
        "https://frontendatlas.com/angular/trivia/angular-http-what-actually-cancels-request",
        "https://frontendatlas.com/react/trivia/react-render-nothing-return-value",
        "https://frontendatlas.com/react/trivia/react-stale-state-closures",
        "https://frontendatlas.com/react/trivia/react-strictmode-double-invoke-effects",
        "https://frontendatlas.com/html/trivia/html-form-default-method",
    }
    heavy = [row for row in rows if str(row[0]) in heavy_urls]
    remainder = [row for row in rows if str(row[0]) not in heavy_urls]
    heavy_metrics = summarize_rows(heavy)
    remainder_metrics = summarize_rows(remainder)
    return {
        "pages": len(heavy),
        "clicks": heavy_metrics["clicks"],
        "impressions": heavy_metrics["impressions"],
        "ctr": heavy_metrics["ctr"],
        "trivia_impression_share": ratio(
            heavy_metrics["impressions"], heavy_metrics["impressions"] + remainder_metrics["impressions"]
        ),
        "remainder_pages": len(remainder),
        "remainder_clicks": remainder_metrics["clicks"],
        "remainder_impressions": remainder_metrics["impressions"],
        "remainder_ctr": remainder_metrics["ctr"],
        "remainder_to_heavy_ctr_ratio": ratio(remainder_metrics["ctr"], heavy_metrics["ctr"]),
    }


def assert_close(actual: float, expected: float, label: str, tolerance: float = 1e-5) -> None:
    if not math.isclose(actual, expected, rel_tol=tolerance, abs_tol=tolerance):
        raise AssertionError(f"{label}: expected {expected}, got {actual}")


def main() -> None:
    base = json.loads(BASE_EXTRACT_PATH.read_text(encoding="utf-8"))
    followup = json.loads(FOLLOWUP_EXTRACT_PATH.read_text(encoding="utf-8"))
    angular = json.loads(ANGULAR_EXTRACT_PATH.read_text(encoding="utf-8"))

    trivia_3m = trivia_rows(base, "3m")
    trivia_28d = trivia_rows(base, "28d")
    query_3m = base["3m"]["sheets"]["Sorgular"][1:]
    property_3m = summarize_rows(base["3m"]["sheets"]["Grafik"][1:])
    visible_query_3m = summarize_rows(query_3m)
    mapped_summary, intent_rows, intent_position_rows, topic_rows, docs_capture = (
        mapped_query_outputs(query_3m)
    )

    summaries = [trivia_summary(trivia_3m, "3m"), trivia_summary(trivia_28d, "28d")]
    position_rows = page_position_rows(trivia_3m)
    technology_cohorts = technology_rows(trivia_3m)
    exact_rows = exact_page_outputs(followup, angular)
    heavy_summary = docs_heavy_summary(trivia_3m)

    # Protect the audited cohort contract from silent regex drift.
    assert summaries[0]["pages"] == 133
    assert summaries[0]["clicks"] == 37
    assert summaries[0]["impressions"] == 34629
    assert_close(summaries[0]["position"], 10.38023275231742, "trivia 3m position")
    assert summaries[0]["zero_click_pages"] == 121
    assert summaries[0]["zero_click_impressions"] == 10855
    assert mapped_summary["query_rows"] == 319
    assert mapped_summary["clicks"] == 1
    assert mapped_summary["impressions"] == 4600
    assert intent_rows[0]["query_rows"] == 219 and intent_rows[0]["impressions"] == 3462
    assert intent_rows[0]["clicks"] == 0
    assert_close(intent_rows[0]["position"], 7.491320046216064, "docs position")
    assert intent_rows[1]["query_rows"] == 100 and intent_rows[1]["impressions"] == 1138
    assert intent_rows[1]["clicks"] == 1
    assert_close(intent_rows[1]["position"], 8.120430579964852, "non-docs position")
    assert docs_capture["property_docs_impressions"] == 3476
    assert docs_capture["mapped_docs_impressions"] == 3462
    assert heavy_summary["clicks"] == 17 and heavy_summary["impressions"] == 21359

    output = {
        "version": 1,
        "generated_at": GENERATED_AT,
        "source_files": [
            str(BASE_EXTRACT_PATH.relative_to(OUTPUT_DIR.parent.parent)),
            str(FOLLOWUP_EXTRACT_PATH.relative_to(OUTPUT_DIR.parent.parent)),
            str(ANGULAR_EXTRACT_PATH.relative_to(OUTPUT_DIR.parent.parent)),
        ],
        "definitions": {
            "trivia_url_rule": "URL path contains /trivia/.",
            "zero_click_rule": "A GSC Pages-export URL row has exactly zero clicks in the stated window.",
            "page_position_bands": [
                "1–5: 0 < average position <= 5",
                "5–10: 5 < average position <= 10",
                "10–20: 10 < average position <= 20",
                "20+: average position > 20",
            ],
            "query_position_bands": "Same mutually exclusive boundaries, applied to query-row average position.",
            "normalization": "Lowercase, collapse all whitespace to one space, trim.",
            "docs_modifier_regex": DOCS_MODIFIER_PATTERN,
            "topic_rules": TOPIC_RULE_DESCRIPTIONS,
            "mapping_mode": "Exclusive topic assignment; first matching topic rule wins.",
            "weighted_position_definition": "SUM(impressions * average_position) / SUM(impressions).",
            "ctr_definition": "SUM(clicks) / SUM(impressions); exported CTR cells are not averaged.",
        },
        "data_quality": {
            "property_3m": property_3m,
            "visible_query_3m": visible_query_3m,
            "query_impression_coverage": ratio(visible_query_3m["impressions"], property_3m["impressions"]),
            "query_click_coverage": ratio(visible_query_3m["clicks"], property_3m["clicks"]),
            "query_rows_at_export_limit": len(query_3m) == 1000,
            "query_page_joint_grain_available": False,
            "docs_capture": docs_capture,
            "exact_page_visible_query_coverage": {
                row["page"]: row["visible_query_coverage"] for row in exact_rows
            },
        },
        "trivia_summary_by_period": summaries,
        "trivia_page_position_rows_3m": position_rows,
        "trivia_technology_rows_3m": technology_cohorts,
        "mapped_query_summary_3m": {
            **mapped_summary,
            "docs_impression_share": ratio(intent_rows[0]["impressions"], mapped_summary["impressions"]),
        },
        "mapped_query_intent_rows_3m": intent_rows,
        "mapped_query_position_rows_3m": intent_position_rows,
        "mapped_query_topic_rows_3m": topic_rows,
        "exact_page_intent_rows": exact_rows,
        "docs_heavy_pages_summary_3m": heavy_summary,
    }
    OUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "output": str(OUT_PATH),
        "trivia_3m": summaries[0],
        "mapped_query_3m": output["mapped_query_summary_3m"],
        "intent_rows": intent_rows,
        "exact_pages": len(exact_rows),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
