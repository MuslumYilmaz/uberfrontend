#!/usr/bin/env python3
"""Reproducible, read-only analysis of four Google Search Console XLSX exports.

The script uses only Python's standard library. It reads OOXML directly so the
source workbooks remain untouched and writes compact JSON evidence beside this
file.
"""

from __future__ import annotations

import json
import re
import statistics
import zipfile
from collections import defaultdict
from datetime import date
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree as ET


OUTPUT_DIR = Path(__file__).resolve().parent
FILES = {
    "3m": Path("/Users/muslumyilmaz/Downloads/frontendatlas.com-Performance-on-Search-2026-08-10.xlsx"),
    "28d": Path("/Users/muslumyilmaz/Downloads/frontendatlas.com-Performance-on-Search-2026-08-10 (1).xlsx"),
    "7d": Path("/Users/muslumyilmaz/Downloads/frontendatlas.com-Performance-on-Search-2026-08-10 (2).xlsx"),
    "24h": Path("/Users/muslumyilmaz/Downloads/frontendatlas.com-Performance-on-Search-2026-08-10 (3).xlsx"),
}
PERIOD_LABELS = {
    "3m": "Son 3 ay",
    "28d": "Son 28 gün",
    "7d": "Son 7 gün",
    "24h": "Son 24 saat (ön veri)",
}

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_NS = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
DOC_REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
CELL_REF = re.compile(r"([A-Z]+)([0-9]+)")


def ratio(numerator: float, denominator: float) -> float:
    return numerator / denominator if denominator else 0.0


def column_index(label: str) -> int:
    value = 0
    for char in label:
        value = value * 26 + ord(char) - 64
    return value - 1


def shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    return [
        "".join(node.text or "" for node in item.findall(".//m:t", NS))
        for item in root.findall("m:si", NS)
    ]


def workbook_sheet_targets(archive: zipfile.ZipFile) -> list[tuple[str, str]]:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    target_by_id = {
        rel.attrib["Id"]: rel.attrib["Target"].lstrip("/")
        for rel in relationships.findall("r:Relationship", REL_NS)
    }
    result = []
    for sheet in workbook.findall("m:sheets/m:sheet", NS):
        target = target_by_id[sheet.attrib[DOC_REL]]
        if not target.startswith("xl/"):
            target = f"xl/{target}"
        result.append((sheet.attrib["name"], target))
    return result


def parse_cell(cell: ET.Element, strings: list[str]):
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        return "".join(node.text or "" for node in cell.findall(".//m:t", NS))
    value_node = cell.find("m:v", NS)
    if value_node is None:
        return None
    raw = value_node.text or ""
    if cell_type == "s":
        return strings[int(raw)]
    if cell_type == "b":
        return raw == "1"
    if cell_type in {"str", "e"}:
        return raw
    try:
        numeric = float(raw)
        return int(numeric) if numeric.is_integer() else numeric
    except ValueError:
        return raw


def parse_sheet(archive: zipfile.ZipFile, target: str, strings: list[str]) -> list[list]:
    root = ET.fromstring(archive.read(target))
    sparse_rows: dict[int, dict[int, object]] = {}
    max_column = -1
    for row in root.findall("m:sheetData/m:row", NS):
        row_index = int(row.attrib["r"]) - 1
        values: dict[int, object] = {}
        for cell in row.findall("m:c", NS):
            match = CELL_REF.fullmatch(cell.attrib["r"])
            if not match:
                continue
            col_index = column_index(match.group(1))
            values[col_index] = parse_cell(cell, strings)
            max_column = max(max_column, col_index)
        sparse_rows[row_index] = values
    if not sparse_rows:
        return []
    max_row = max(sparse_rows)
    return [
        [sparse_rows.get(row_idx, {}).get(col_idx) for col_idx in range(max_column + 1)]
        for row_idx in range(max_row + 1)
    ]


def read_workbook(path: Path) -> dict[str, list[list]]:
    with zipfile.ZipFile(path) as archive:
        strings = shared_strings(archive)
        return {
            name: parse_sheet(archive, target, strings)
            for name, target in workbook_sheet_targets(archive)
        }


def weighted_position(rows: list[list], impressions_index: int = 2, position_index: int = 4) -> float:
    impressions = sum(float(row[impressions_index] or 0) for row in rows)
    if not impressions:
        return 0.0
    return sum(
        float(row[impressions_index] or 0) * float(row[position_index] or 0)
        for row in rows
    ) / impressions


def dimension_totals(rows: list[list]) -> dict:
    clicks = int(sum(float(row[1] or 0) for row in rows))
    impressions = int(sum(float(row[2] or 0) for row in rows))
    return {
        "clicks": clicks,
        "impressions": impressions,
        "ctr": ratio(clicks, impressions),
        "position": weighted_position(rows),
    }


def duplicate_key_count(rows: list[list]) -> int:
    keys = [str(row[0]).strip().casefold() for row in rows if row and row[0] is not None]
    return len(keys) - len(set(keys))


def page_group(url: str) -> str:
    path = urlparse(url).path
    if path == "/":
        return "Ana sayfa"
    if "/trivia/" in path:
        return "Trivia / answer"
    if "/coding/" in path:
        return "Coding"
    if path.endswith("/interview-questions") or "/interview-questions/" in path:
        return "Interview hub"
    if path.startswith("/guides/system-design-blueprint/"):
        return "System-design blueprint"
    if path.startswith("/guides/framework-prep/"):
        return "Framework prep"
    if path.startswith("/guides/interview-blueprint/"):
        return "Interview blueprint"
    if path.startswith("/guides/behavioral/"):
        return "Behavioral guides"
    if path.startswith("/guides/"):
        return "Other guides"
    if path.startswith("/system-design/"):
        return "System design"
    if path.startswith("/tradeoffs/"):
        return "Tradeoffs"
    if path.startswith("/incidents/"):
        return "Incidents"
    if path.startswith("/tracks"):
        return "Tracks"
    return "Other"


def summarize_page_groups(rows: list[list]) -> list[dict]:
    grouped: dict[str, dict[str, float]] = defaultdict(
        lambda: {"clicks": 0, "impressions": 0, "position_weighted": 0, "pages": 0}
    )
    for row in rows:
        group = page_group(str(row[0]))
        impressions = int(row[2] or 0)
        grouped[group]["clicks"] += int(row[1] or 0)
        grouped[group]["impressions"] += impressions
        grouped[group]["position_weighted"] += impressions * float(row[4] or 0)
        grouped[group]["pages"] += 1
    total_impressions = sum(item["impressions"] for item in grouped.values())
    result = []
    for group, item in grouped.items():
        impressions = int(item["impressions"])
        clicks = int(item["clicks"])
        result.append({
            "group": group,
            "pages": int(item["pages"]),
            "clicks": clicks,
            "impressions": impressions,
            "impression_share": ratio(impressions, total_impressions),
            "ctr": ratio(clicks, impressions),
            "position": ratio(item["position_weighted"], impressions),
        })
    return sorted(result, key=lambda item: item["impressions"], reverse=True)


POSITION_BANDS = [
    (0, 3, "1-3"),
    (3, 5, "3-5"),
    (5, 8, "5-8"),
    (8, 10, "8-10"),
    (10, 20, "10-20"),
    (20, float("inf"), "20+"),
]


def summarize_position_bands(rows: list[list]) -> list[dict]:
    total_impressions = sum(int(row[2] or 0) for row in rows)
    result = []
    for lower, upper, label in POSITION_BANDS:
        band_rows = [
            row for row in rows
            if lower < float(row[4] or 0) <= upper
        ]
        totals = dimension_totals(band_rows)
        result.append({
            "band": label,
            "pages": len(band_rows),
            **totals,
            "impression_share": ratio(totals["impressions"], total_impressions),
        })
    return result


def period_summary(key: str, sheets: dict[str, list[list]]) -> dict:
    daily = sheets["Grafik"][1:]
    queries = sheets["Sorgular"][1:]
    pages = sheets["Sayfa sayısı"][1:]
    countries = sheets["Ülkeler"][1:]
    devices = sheets["Cihazlar"][1:]
    top = dimension_totals(daily)
    query = dimension_totals(queries)
    page = dimension_totals(pages)
    country = dimension_totals(countries)
    device = dimension_totals(devices)
    return {
        "key": key,
        "period": PERIOD_LABELS[key],
        "start": str(daily[0][0]) if daily else None,
        "end": str(daily[-1][0]) if daily else None,
        **top,
        "query_click_coverage": ratio(query["clicks"], top["clicks"]),
        "query_impression_coverage": ratio(query["impressions"], top["impressions"]),
        "query_rows": len(queries),
        "page_rows": len(pages),
        "country_rows": len(countries),
        "device_rows": len(devices),
        "page_click_delta": page["clicks"] - top["clicks"],
        "page_impression_delta": page["impressions"] - top["impressions"],
        "country_click_delta": country["clicks"] - top["clicks"],
        "country_impression_delta": country["impressions"] - top["impressions"],
        "device_click_delta": device["clicks"] - top["clicks"],
        "device_impression_delta": device["impressions"] - top["impressions"],
        "duplicate_queries": duplicate_key_count(queries),
        "duplicate_pages": duplicate_key_count(pages),
        "duplicate_countries": duplicate_key_count(countries),
        "duplicate_devices": duplicate_key_count(devices),
    }


def country_mix(key: str, sheets: dict[str, list[list]]) -> list[dict]:
    rows = sheets["Ülkeler"][1:]
    totals = dimension_totals(rows)
    us = next(row for row in rows if row[0] == "Amerika Birleşik Devletleri")
    non_us_rows = [row for row in rows if row[0] != "Amerika Birleşik Devletleri"]
    us_clicks, us_impressions = int(us[1] or 0), int(us[2] or 0)
    non_clicks = totals["clicks"] - us_clicks
    non_impressions = totals["impressions"] - us_impressions
    return [
        {
            "period": PERIOD_LABELS[key],
            "segment": "ABD",
            "clicks": us_clicks,
            "impressions": us_impressions,
            "ctr": ratio(us_clicks, us_impressions),
            "impression_share": ratio(us_impressions, totals["impressions"]),
            "position": float(us[4] or 0),
        },
        {
            "period": PERIOD_LABELS[key],
            "segment": "ABD dışı",
            "clicks": non_clicks,
            "impressions": non_impressions,
            "ctr": ratio(non_clicks, non_impressions),
            "impression_share": ratio(non_impressions, totals["impressions"]),
            "position": weighted_position(non_us_rows),
        },
    ]


def device_mix(key: str, sheets: dict[str, list[list]]) -> list[dict]:
    rows = sheets["Cihazlar"][1:]
    totals = dimension_totals(rows)
    return [
        {
            "period": PERIOD_LABELS[key],
            "device": str(row[0]),
            "clicks": int(row[1] or 0),
            "impressions": int(row[2] or 0),
            "ctr": ratio(float(row[1] or 0), float(row[2] or 0)),
            "impression_share": ratio(float(row[2] or 0), totals["impressions"]),
            "position": float(row[4] or 0),
        }
        for row in rows
    ]


def recent_country_decomposition(
    sheets_28d: dict[str, list[list]], sheets_7d: dict[str, list[list]]
) -> dict:
    """Shapley decomposition of 7-day CTR change vs the preceding 21 days."""
    by_country_28d = {str(row[0]): row for row in sheets_28d["Ülkeler"][1:]}
    by_country_7d = {str(row[0]): row for row in sheets_7d["Ülkeler"][1:]}

    def aggregate(period: str) -> dict[str, dict[str, int]]:
        result = {
            "ABD": {"clicks": 0, "impressions": 0},
            "ABD dışı": {"clicks": 0, "impressions": 0},
        }
        countries = set(by_country_28d) | set(by_country_7d)
        for country in countries:
            row_28 = by_country_28d.get(country, [country, 0, 0, 0, 0])
            row_7 = by_country_7d.get(country, [country, 0, 0, 0, 0])
            if period == "7d":
                clicks = int(row_7[1] or 0)
                impressions = int(row_7[2] or 0)
            else:
                clicks = int(row_28[1] or 0) - int(row_7[1] or 0)
                impressions = int(row_28[2] or 0) - int(row_7[2] or 0)
            segment = "ABD" if country == "Amerika Birleşik Devletleri" else "ABD dışı"
            result[segment]["clicks"] += clicks
            result[segment]["impressions"] += impressions
        return result

    previous = aggregate("prior21")
    current = aggregate("7d")
    previous_total = sum(item["impressions"] for item in previous.values())
    current_total = sum(item["impressions"] for item in current.values())
    segments = []
    mix_effect = 0.0
    within_effect = 0.0
    for segment in ("ABD", "ABD dışı"):
        old = previous[segment]
        new = current[segment]
        old_rate = ratio(old["clicks"], old["impressions"])
        new_rate = ratio(new["clicks"], new["impressions"])
        old_share = ratio(old["impressions"], previous_total)
        new_share = ratio(new["impressions"], current_total)
        mix_effect += 0.5 * (new_share - old_share) * (old_rate + new_rate)
        within_effect += 0.5 * (new_rate - old_rate) * (old_share + new_share)
        segments.append({
            "segment": segment,
            "prior21_clicks": old["clicks"],
            "prior21_impressions": old["impressions"],
            "prior21_ctr": old_rate,
            "prior21_share": old_share,
            "last7_clicks": new["clicks"],
            "last7_impressions": new["impressions"],
            "last7_ctr": new_rate,
            "last7_share": new_share,
        })
    prior_ctr = ratio(
        sum(item["clicks"] for item in previous.values()), previous_total
    )
    current_ctr = ratio(
        sum(item["clicks"] for item in current.values()), current_total
    )
    return {
        "baseline": "2026-07-12–2026-08-01 (önceki 21 gün)",
        "current": "2026-08-02–2026-08-08 (son 7 gün)",
        "prior_ctr": prior_ctr,
        "current_ctr": current_ctr,
        "total_change": current_ctr - prior_ctr,
        "mix_effect": mix_effect,
        "within_segment_effect": within_effect,
        "reconciliation_error": current_ctr - prior_ctr - mix_effect - within_effect,
        "segments": segments,
    }


def daily_rows(sheets: dict[str, list[list]]) -> list[dict]:
    return [
        {
            "date": str(row[0]),
            "clicks": int(row[1] or 0),
            "impressions": int(row[2] or 0),
            "ctr": float(row[3] or 0),
            "position": float(row[4] or 0),
        }
        for row in sheets["Grafik"][1:]
    ]


def weekly_rows(daily: list[dict]) -> list[dict]:
    grouped: dict[str, list[dict]] = defaultdict(list)
    for row in daily:
        parsed = date.fromisoformat(row["date"][:10])
        iso_year, iso_week, _ = parsed.isocalendar()
        grouped[f"{iso_year}-W{iso_week:02d}"].append(row)
    result = []
    for week, rows in grouped.items():
        clicks = sum(row["clicks"] for row in rows)
        impressions = sum(row["impressions"] for row in rows)
        result.append({
            "week": week,
            "start": rows[0]["date"][:10],
            "end": rows[-1]["date"][:10],
            "days": len(rows),
            "clicks": clicks,
            "impressions": impressions,
            "ctr": ratio(clicks, impressions),
            "position": ratio(
                sum(row["impressions"] * row["position"] for row in rows),
                impressions,
            ),
        })
    return result


def anomaly_summary(daily: list[dict]) -> dict:
    values = [row["impressions"] for row in daily]
    quartiles = statistics.quantiles(values, n=4, method="inclusive")
    q1, q3 = quartiles[0], quartiles[2]
    threshold = q3 + 1.5 * (q3 - q1)
    anomalies = [row for row in daily if row["impressions"] > threshold]
    focal = next(row for row in daily if row["date"] == "2026-08-05")
    total_clicks = sum(row["clicks"] for row in daily)
    total_impressions = sum(row["impressions"] for row in daily)
    excluding_clicks = total_clicks - focal["clicks"]
    excluding_impressions = total_impressions - focal["impressions"]
    return {
        "q1": q1,
        "q3": q3,
        "iqr_threshold": threshold,
        "anomaly_days": anomalies,
        "aug5_impression_share": ratio(focal["impressions"], total_impressions),
        "aug5_click_share": ratio(focal["clicks"], total_clicks),
        "ctr_all": ratio(total_clicks, total_impressions),
        "ctr_excluding_aug5": ratio(excluding_clicks, excluding_impressions),
        "ctr_lift_excluding_aug5": ratio(
            ratio(excluding_clicks, excluding_impressions),
            ratio(total_clicks, total_impressions),
        ) - 1,
    }


def priority_pages(workbooks: dict[str, dict[str, list[list]]]) -> list[dict]:
    indexed = {}
    for key, sheets in workbooks.items():
        indexed[key] = {str(row[0]): row for row in sheets["Sayfa sayısı"][1:]}
    rows_3m = workbooks["3m"]["Sayfa sayısı"][1:]
    candidates = [
        row for row in rows_3m
        if int(row[2] or 0) >= 100 and float(row[4] or 99) <= 10
    ]
    candidates.sort(key=lambda row: int(row[2] or 0), reverse=True)
    result = []
    for row in candidates[:12]:
        url = str(row[0])
        item = {"url": url, "group": page_group(url)}
        for key in ("3m", "28d", "7d", "24h"):
            source = indexed[key].get(url)
            item[f"{key}_clicks"] = int(source[1] or 0) if source else 0
            item[f"{key}_impressions"] = int(source[2] or 0) if source else 0
            item[f"{key}_ctr"] = ratio(item[f"{key}_clicks"], item[f"{key}_impressions"])
            item[f"{key}_position"] = float(source[4] or 0) if source else None
        result.append(item)
    return result


def top_queries(sheets: dict[str, list[list]], limit: int = 30) -> list[dict]:
    rows = sorted(sheets["Sorgular"][1:], key=lambda row: int(row[2] or 0), reverse=True)
    return [
        {
            "query": str(row[0]).replace("\n", " "),
            "clicks": int(row[1] or 0),
            "impressions": int(row[2] or 0),
            "ctr": ratio(float(row[1] or 0), float(row[2] or 0)),
            "position": float(row[4] or 0),
        }
        for row in rows[:limit]
    ]


def query_signal_clusters(sheets: dict[str, list[list]]) -> list[dict]:
    rows = sheets["Sorgular"][1:]
    rules = [
        (
            'Exact "official docs"',
            'query contains the exact phrase "official docs"',
            lambda q: "official docs" in q,
        ),
        (
            "Official/docs modifier",
            "query contains official, docs, or documentation",
            lambda q: any(token in q for token in ("official", " docs", "documentation")),
        ),
        (
            "Angular HttpClient cancellation",
            "query contains angular + httpclient + cancel/abort/unsubscribe",
            lambda q: "angular" in q
            and "httpclient" in q
            and any(token in q for token in ("cancel", "abort", "unsubscribe")),
        ),
        (
            "RADIO framework",
            "query contains radio",
            lambda q: "radio" in q,
        ),
    ]
    result = []
    for cluster, definition, rule in rules:
        matches = [row for row in rows if rule(str(row[0]).lower())]
        totals = dimension_totals(matches)
        result.append({
            "cluster": cluster,
            "definition": definition,
            "query_rows": len(matches),
            **totals,
            "note": "Clusters overlap; values are visible-query lower bounds.",
        })
    return result


def url_shape_checks(sheets: dict[str, list[list]]) -> list[dict]:
    rows = sheets["Sayfa sayısı"][1:]
    checks = [
        ("Fragment URL", lambda url: "#" in url),
        ("Query-string URL", lambda url: "?" in url),
        ("HTTP URL", lambda url: url.startswith("http://")),
        ("www host", lambda url: "://www." in url),
        ("Trailing slash", lambda url: urlparse(url).path not in ("", "/") and urlparse(url).path.endswith("/")),
    ]
    result = []
    for label, predicate in checks:
        matches = [row for row in rows if predicate(str(row[0]))]
        totals = dimension_totals(matches)
        result.append({"check": label, "rows": len(matches), **totals})
    return result


def main() -> None:
    missing = [str(path) for path in FILES.values() if not path.exists()]
    if missing:
        raise FileNotFoundError("Missing input workbook(s): " + ", ".join(missing))

    workbooks = {key: read_workbook(path) for key, path in FILES.items()}
    extract = {
        key: {"file": FILES[key].name, "sheets": sheets}
        for key, sheets in workbooks.items()
    }
    (OUTPUT_DIR / "source_extract.json").write_text(
        json.dumps(extract, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    daily_3m = daily_rows(workbooks["3m"])
    analysis = {
        "generated_at": "2026-08-10T00:00:00+03:00",
        "periods": [period_summary(key, workbooks[key]) for key in FILES],
        "daily_3m": daily_3m,
        "weekly_3m": weekly_rows(daily_3m),
        "anomaly_3m": anomaly_summary(daily_3m),
        "anomaly_7d": anomaly_summary(daily_rows(workbooks["7d"])),
        "country_mix": [
            row for key in ("3m", "28d", "7d", "24h")
            for row in country_mix(key, workbooks[key])
        ],
        "device_mix": [
            row for key in ("3m", "28d", "7d", "24h")
            for row in device_mix(key, workbooks[key])
        ],
        "recent_country_decomposition": recent_country_decomposition(
            workbooks["28d"], workbooks["7d"]
        ),
        "page_groups_3m": summarize_page_groups(workbooks["3m"]["Sayfa sayısı"][1:]),
        "page_groups_28d": summarize_page_groups(workbooks["28d"]["Sayfa sayısı"][1:]),
        "page_groups_7d": summarize_page_groups(workbooks["7d"]["Sayfa sayısı"][1:]),
        "position_bands_3m": summarize_position_bands(workbooks["3m"]["Sayfa sayısı"][1:]),
        "position_bands_28d": summarize_position_bands(workbooks["28d"]["Sayfa sayısı"][1:]),
        "priority_pages": priority_pages(workbooks),
        "top_queries_3m": top_queries(workbooks["3m"]),
        "top_queries_28d": top_queries(workbooks["28d"]),
        "top_queries_7d": top_queries(workbooks["7d"]),
        "query_signal_clusters_3m": query_signal_clusters(workbooks["3m"]),
        "url_shape_checks_3m": url_shape_checks(workbooks["3m"]),
    }
    (OUTPUT_DIR / "analysis_results.json").write_text(
        json.dumps(analysis, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps({
        "outputs": ["source_extract.json", "analysis_results.json"],
        "periods": analysis["periods"],
        "aug5": analysis["anomaly_7d"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
