#!/usr/bin/env python3
"""Read-only analysis of the requested Aug 5 and exact-page GSC exports."""

from __future__ import annotations

import importlib.util
import json
import re
from collections import defaultdict
from pathlib import Path


OUTPUT_DIR = Path(__file__).resolve().parent
READER_PATH = OUTPUT_DIR / "analyze_ctr.py"
PREVIOUS_EXTRACT_PATH = OUTPUT_DIR / "source_extract.json"

FILES = {
    "aug5": Path("/Users/muslumyilmaz/Downloads/frontendatlas.com-Performance-on-Search-2026-08-10.xlsx"),
    "react": Path("/Users/muslumyilmaz/Downloads/frontendatlas.com-Performance-on-Search-2026-08-10 (1).xlsx"),
    "html": Path("/Users/muslumyilmaz/Downloads/frontendatlas.com-Performance-on-Search-2026-08-10 (2).xlsx"),
}


def load_reader():
    spec = importlib.util.spec_from_file_location("ctr_reader", READER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load workbook reader: {READER_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


reader = load_reader()


def ratio(numerator: float, denominator: float) -> float:
    return numerator / denominator if denominator else 0.0


def data_rows(sheet: list[list]) -> list[list]:
    return [row for row in sheet[1:] if row and row[0] is not None]


def totals(rows: list[list]) -> dict:
    result = reader.dimension_totals(rows)
    result["rows"] = len(rows)
    return result


def filter_map(workbook: dict[str, list[list]]) -> dict[str, str]:
    return {
        str(row[0]): str(row[1])
        for row in data_rows(workbook["Filtreler"])
        if len(row) >= 2
    }


def query_cluster(rows: list[list], name: str, definition: str, pattern: str) -> dict:
    regex = re.compile(pattern, re.IGNORECASE)
    matches = [row for row in rows if regex.search(str(row[0]))]
    result = totals(matches)
    result.update({
        "cluster": name,
        "definition": definition,
        "visible_impression_share": 0.0,
    })
    return result


def daily_summary(rows: list[list]) -> dict:
    full = totals(rows)
    first7 = totals(rows[:7])
    last7 = totals(rows[-7:])
    remainder = totals(rows[7:])
    peak = max(rows, key=lambda row: int(row[2] or 0))
    click_days = [str(row[0]) for row in rows if int(row[1] or 0) > 0]
    return {
        "full": full,
        "first7": first7,
        "after_first7": remainder,
        "last7": last7,
        "first7_impression_share": ratio(first7["impressions"], full["impressions"]),
        "peak_day": {
            "date": str(peak[0]),
            "clicks": int(peak[1] or 0),
            "impressions": int(peak[2] or 0),
            "ctr": ratio(int(peak[1] or 0), int(peak[2] or 0)),
            "position": float(peak[4] or 0),
        },
        "click_days": click_days,
    }


def exact_page_summary(key: str, workbook: dict[str, list[list]]) -> dict:
    daily = data_rows(workbook["Grafik"])
    page_rows = data_rows(workbook["Sayfa sayısı"])
    queries = data_rows(workbook["Sorgular"])
    countries = data_rows(workbook["Ülkeler"])
    devices = data_rows(workbook["Cihazlar"])
    graph = totals(daily)
    page = totals(page_rows)
    query = totals(queries)
    country = totals(countries)
    device = totals(devices)

    patterns = {
        "react": [
            ("Source-preference modifier", "docs, documentation, or official", r"\b(?:docs?|documentation|official)\b"),
            ("Exact official docs", "exact phrase: official docs", r"\bofficial\s+docs\b"),
            ("Legacy error wording", "nothing was returned or error", r"nothing\s+was\s+returned|\berror\b"),
            ("Undefined intent", "contains undefined", r"\bundefined\b"),
            ("Null comparison", "contains null", r"\bnull\b"),
        ],
        "html": [
            ("MDN intent", "contains mdn", r"\bmdn\b"),
            ("Source-preference modifier", "mdn, specification, whatwg, docs, documentation, or official", r"\b(?:mdn|specification|whatwg|docs?|documentation|official)\b"),
            ("Omitted/default behavior", "contains omitted, default, or if omitted", r"\b(?:omitted|default)\b"),
            ("Action fallback", "contains action and current url", r"\baction\b.*\bcurrent\s+url\b"),
        ],
    }
    clusters = []
    for name, definition, pattern in patterns[key]:
        item = query_cluster(queries, name, definition, pattern)
        item["visible_impression_share"] = ratio(item["impressions"], query["impressions"])
        clusters.append(item)

    return {
        "key": key,
        "file": FILES[key].name,
        "filters": filter_map(workbook),
        "page": str(page_rows[0][0]) if page_rows else None,
        "graph": graph,
        "page_table": page,
        "visible_query": {
            **query,
            "impression_coverage": ratio(query["impressions"], graph["impressions"]),
            "click_coverage": ratio(query["clicks"], graph["clicks"]),
        },
        "visible_country": {
            **country,
            "impression_coverage": ratio(country["impressions"], graph["impressions"]),
            "click_coverage": ratio(country["clicks"], graph["clicks"]),
        },
        "visible_device": {
            **device,
            "impression_coverage": ratio(device["impressions"], graph["impressions"]),
            "click_coverage": ratio(device["clicks"], graph["clicks"]),
        },
        "dimension_reconciliation": {
            "query_country_impression_delta": query["impressions"] - country["impressions"],
            "query_device_impression_delta": query["impressions"] - device["impressions"],
            "query_country_click_delta": query["clicks"] - country["clicks"],
            "query_device_click_delta": query["clicks"] - device["clicks"],
        },
        "daily": daily_summary(daily),
        "daily_rows": [
            {
                "page": "React render-nothing" if key == "react" else "HTML form default method",
                "date": str(row[0]),
                "clicks": int(row[1] or 0),
                "impressions": int(row[2] or 0),
                "ctr": ratio(int(row[1] or 0), int(row[2] or 0)),
                "position": float(row[4] or 0),
            }
            for row in daily
        ],
        "query_clusters": clusters,
        "top_visible_queries": [
            {
                "query": str(row[0]).replace("\n", " ").strip(),
                "clicks": int(row[1] or 0),
                "impressions": int(row[2] or 0),
                "ctr": ratio(int(row[1] or 0), int(row[2] or 0)),
                "position": float(row[4] or 0),
            }
            for row in queries[:15]
        ],
        "visible_countries": [
            {
                "country": str(row[0]),
                "clicks": int(row[1] or 0),
                "impressions": int(row[2] or 0),
                "ctr": ratio(int(row[1] or 0), int(row[2] or 0)),
                "position": float(row[4] or 0),
                "visible_share": ratio(int(row[2] or 0), country["impressions"]),
            }
            for row in countries
        ],
        "visible_devices": [
            {
                "device": str(row[0]),
                "clicks": int(row[1] or 0),
                "impressions": int(row[2] or 0),
                "ctr": ratio(int(row[1] or 0), int(row[2] or 0)),
                "position": float(row[4] or 0),
                "visible_share": ratio(int(row[2] or 0), device["impressions"]),
            }
            for row in devices
        ],
    }


def segment_us(rows: list[list]) -> dict[str, dict]:
    us = [row for row in rows if str(row[0]) == "Amerika Birleşik Devletleri"]
    non_us = [row for row in rows if str(row[0]) != "Amerika Birleşik Devletleri"]
    return {"ABD": totals(us), "ABD dışı": totals(non_us)}


def subtract_dimension(window_rows: list[list], day_rows: list[list]) -> list[list]:
    day_by_key = {str(row[0]): row for row in day_rows}
    result = []
    for row in window_rows:
        key = str(row[0])
        day = day_by_key.get(key, [key, 0, 0, 0, 0])
        clicks = int(row[1] or 0) - int(day[1] or 0)
        impressions = int(row[2] or 0) - int(day[2] or 0)
        weighted_position = float(row[4] or 0) * int(row[2] or 0) - float(day[4] or 0) * int(day[2] or 0)
        position = ratio(weighted_position, impressions)
        if clicks or impressions:
            result.append([key, clicks, impressions, ratio(clicks, impressions), position])
    return result


def shapley_mix(baseline: dict[str, dict], current: dict[str, dict]) -> dict:
    baseline_total = sum(item["impressions"] for item in baseline.values())
    current_total = sum(item["impressions"] for item in current.values())
    mix_effect = 0.0
    within_effect = 0.0
    rows = []
    for segment in ("ABD", "ABD dışı"):
        base = baseline[segment]
        now = current[segment]
        w0 = ratio(base["impressions"], baseline_total)
        w1 = ratio(now["impressions"], current_total)
        r0 = base["ctr"]
        r1 = now["ctr"]
        mix_effect += 0.5 * (w1 - w0) * (r0 + r1)
        within_effect += 0.5 * (r1 - r0) * (w0 + w1)
        rows.append({
            "segment": segment,
            "other6_clicks": base["clicks"],
            "other6_impressions": base["impressions"],
            "other6_share": w0,
            "other6_ctr": r0,
            "aug5_clicks": now["clicks"],
            "aug5_impressions": now["impressions"],
            "aug5_share": w1,
            "aug5_ctr": r1,
        })
    baseline_ctr = ratio(
        sum(item["clicks"] for item in baseline.values()), baseline_total
    )
    current_ctr = ratio(
        sum(item["clicks"] for item in current.values()), current_total
    )
    return {
        "baseline_ctr": baseline_ctr,
        "current_ctr": current_ctr,
        "total_change": current_ctr - baseline_ctr,
        "mix_effect": mix_effect,
        "within_segment_effect": within_effect,
        "reconciliation_error": (current_ctr - baseline_ctr) - mix_effect - within_effect,
        "segments": rows,
    }


def aug5_summary(workbook: dict[str, list[list]], previous_extract: dict) -> dict:
    graph_rows = data_rows(workbook["Grafik"])
    query_rows = data_rows(workbook["Sorgular"])
    page_rows = data_rows(workbook["Sayfa sayısı"])
    country_rows = data_rows(workbook["Ülkeler"])
    device_rows = data_rows(workbook["Cihazlar"])

    graph = totals(graph_rows)
    query = totals(query_rows)
    page = totals(page_rows)
    country = totals(country_rows)
    device = totals(device_rows)

    group_accumulator: dict[str, dict[str, float]] = defaultdict(
        lambda: {"clicks": 0, "impressions": 0, "position_weighted": 0, "pages": 0}
    )
    for row in page_rows:
        group = reader.page_group(str(row[0]))
        impressions = int(row[2] or 0)
        group_accumulator[group]["clicks"] += int(row[1] or 0)
        group_accumulator[group]["impressions"] += impressions
        group_accumulator[group]["position_weighted"] += impressions * float(row[4] or 0)
        group_accumulator[group]["pages"] += 1
    groups = []
    for group, values in group_accumulator.items():
        impressions = int(values["impressions"])
        clicks = int(values["clicks"])
        groups.append({
            "group": group,
            "pages": int(values["pages"]),
            "clicks": clicks,
            "impressions": impressions,
            "ctr": ratio(clicks, impressions),
            "position": ratio(values["position_weighted"], impressions),
            "page_table_share": ratio(impressions, page["impressions"]),
        })
    groups.sort(key=lambda item: item["impressions"], reverse=True)

    old_7d = previous_extract["7d"]["sheets"]
    old_page_rows = data_rows(old_7d["Sayfa sayısı"])
    old_page_by_url = {str(row[0]): row for row in old_page_rows}
    page_rows_by_impressions = sorted(
        page_rows, key=lambda row: int(row[2] or 0), reverse=True
    )
    top_pages = []
    for rank, row in enumerate(page_rows_by_impressions[:20], 1):
        url = str(row[0])
        window = old_page_by_url.get(url)
        window_impressions = int(window[2] or 0) if window else None
        other6_impressions = window_impressions - int(row[2] or 0) if window else None
        other6_daily_average = ratio(other6_impressions, 6) if other6_impressions is not None else None
        top_pages.append({
            "rank": rank,
            "url": url,
            "group": reader.page_group(url),
            "clicks": int(row[1] or 0),
            "impressions": int(row[2] or 0),
            "ctr": ratio(int(row[1] or 0), int(row[2] or 0)),
            "position": float(row[4] or 0),
            "property_impression_share": ratio(int(row[2] or 0), graph["impressions"]),
            "seven_day_impressions": window_impressions,
            "aug5_share_of_seven_day_page_impressions": ratio(int(row[2] or 0), window_impressions or 0),
            "other6_daily_average": other6_daily_average,
            "aug5_vs_other6_daily_average": ratio(int(row[2] or 0), other6_daily_average or 0),
        })

    old_country_rows = data_rows(old_7d["Ülkeler"])
    other6_country_rows = subtract_dimension(old_country_rows, country_rows)
    country_decomposition = shapley_mix(
        segment_us(other6_country_rows), segment_us(country_rows)
    )

    old_device_rows = data_rows(old_7d["Cihazlar"])
    other6_device_rows = subtract_dimension(old_device_rows, device_rows)

    return {
        "file": FILES["aug5"].name,
        "filters": filter_map(workbook),
        "graph": graph,
        "page_table": {
            **page,
            "impression_delta_vs_property": page["impressions"] - graph["impressions"],
            "click_delta_vs_property": page["clicks"] - graph["clicks"],
        },
        "visible_query": {
            **query,
            "impression_coverage": ratio(query["impressions"], graph["impressions"]),
            "click_coverage": ratio(query["clicks"], graph["clicks"]),
        },
        "country": country,
        "device": device,
        "country_device_reconciliation": {
            "country_impression_delta": country["impressions"] - graph["impressions"],
            "device_impression_delta": device["impressions"] - graph["impressions"],
            "country_click_delta": country["clicks"] - graph["clicks"],
            "device_click_delta": device["clicks"] - graph["clicks"],
        },
        "page_groups": groups,
        "top_pages": top_pages,
        "top10_property_impression_share": ratio(
            sum(int(row[2] or 0) for row in page_rows_by_impressions[:10]), graph["impressions"]
        ),
        "top_visible_queries": [
            {
                "query": str(row[0]).replace("\n", " ").strip(),
                "clicks": int(row[1] or 0),
                "impressions": int(row[2] or 0),
                "ctr": ratio(int(row[1] or 0), int(row[2] or 0)),
                "position": float(row[4] or 0),
            }
            for row in query_rows[:20]
        ],
        "countries": [
            {
                "country": str(row[0]),
                "clicks": int(row[1] or 0),
                "impressions": int(row[2] or 0),
                "ctr": ratio(int(row[1] or 0), int(row[2] or 0)),
                "position": float(row[4] or 0),
                "share": ratio(int(row[2] or 0), graph["impressions"]),
            }
            for row in country_rows
        ],
        "devices": [
            {
                "device": str(row[0]),
                "clicks": int(row[1] or 0),
                "impressions": int(row[2] or 0),
                "ctr": ratio(int(row[1] or 0), int(row[2] or 0)),
                "position": float(row[4] or 0),
                "share": ratio(int(row[2] or 0), graph["impressions"]),
            }
            for row in device_rows
        ],
        "other6_devices": [
            {
                "device": str(row[0]),
                "clicks": int(row[1] or 0),
                "impressions": int(row[2] or 0),
                "ctr": ratio(int(row[1] or 0), int(row[2] or 0)),
                "position": float(row[4] or 0),
                "share": ratio(int(row[2] or 0), sum(int(item[2] or 0) for item in other6_device_rows)),
            }
            for row in other6_device_rows
        ],
        "country_decomposition_aug5_vs_other6": country_decomposition,
    }


def main() -> None:
    missing = [str(path) for path in FILES.values() if not path.exists()]
    if missing:
        raise FileNotFoundError("Missing follow-up workbook(s): " + ", ".join(missing))
    if not PREVIOUS_EXTRACT_PATH.exists():
        raise FileNotFoundError(f"Missing previous materialized GSC extract: {PREVIOUS_EXTRACT_PATH}")

    workbooks = {key: reader.read_workbook(path) for key, path in FILES.items()}
    previous_extract = json.loads(PREVIOUS_EXTRACT_PATH.read_text(encoding="utf-8"))

    extract = {
        key: {"file": FILES[key].name, "sheets": workbook}
        for key, workbook in workbooks.items()
    }
    (OUTPUT_DIR / "followup_source_extract.json").write_text(
        json.dumps(extract, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    analysis = {
        "generated_at": "2026-08-10T22:20:00+03:00",
        "aug5": aug5_summary(workbooks["aug5"], previous_extract),
        "exact_pages": [
            exact_page_summary("react", workbooks["react"]),
            exact_page_summary("html", workbooks["html"]),
        ],
    }
    (OUTPUT_DIR / "followup_analysis.json").write_text(
        json.dumps(analysis, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(json.dumps({
        "outputs": ["followup_source_extract.json", "followup_analysis.json"],
        "filters": {key: filter_map(workbook) for key, workbook in workbooks.items()},
        "aug5": {
            "graph": analysis["aug5"]["graph"],
            "visible_query": analysis["aug5"]["visible_query"],
            "top10_property_impression_share": analysis["aug5"]["top10_property_impression_share"],
            "country_decomposition": analysis["aug5"]["country_decomposition_aug5_vs_other6"],
        },
        "exact_pages": [
            {
                "key": item["key"],
                "graph": item["graph"],
                "visible_query": item["visible_query"],
                "daily": item["daily"],
                "query_clusters": item["query_clusters"],
            }
            for item in analysis["exact_pages"]
        ],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
