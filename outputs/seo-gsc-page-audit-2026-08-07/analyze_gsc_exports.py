#!/usr/bin/env python3
"""Read-only OOXML extractor for the three Google Search Console exports."""

from __future__ import annotations

import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_NS = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
DOC_REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
CELL_REF = re.compile(r"([A-Z]+)([0-9]+)")


FILES = [
    Path("/Users/muslumyilmaz/Downloads/frontendatlas.com-Performance-on-Search-2026-08-07.xlsx"),
    Path("/Users/muslumyilmaz/Downloads/frontendatlas.com-Performance-on-Search-2026-08-07 (1).xlsx"),
    Path("/Users/muslumyilmaz/Downloads/frontendatlas.com-Performance-on-Search-2026-08-07 (2).xlsx"),
]


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
    values = []
    for item in root.findall("m:si", NS):
        values.append("".join(node.text or "" for node in item.findall(".//m:t", NS)))
    return values


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


def read_workbook(path: Path) -> dict:
    with zipfile.ZipFile(path) as archive:
        strings = shared_strings(archive)
        sheets = {
            name: parse_sheet(archive, target, strings)
            for name, target in workbook_sheet_targets(archive)
        }
    return {"file": path.name, "sheets": sheets}


def compact_rows(rows: list[list], limit: int = 8) -> dict:
    return {
        "row_count": len(rows),
        "column_count": max((len(row) for row in rows), default=0),
        "head": rows[:limit],
        "tail": rows[-min(limit, len(rows)):],
    }


def main() -> None:
    workbooks = [read_workbook(path) for path in FILES]
    output_dir = Path(__file__).resolve().parent
    extract_path = output_dir / "source_extract.json"
    extract_path.write_text(json.dumps(workbooks, ensure_ascii=False, indent=2), encoding="utf-8")
    profile = [
        {
            "file": workbook["file"],
            "sheets": {
                name: compact_rows(rows)
                for name, rows in workbook["sheets"].items()
            },
        }
        for workbook in workbooks
    ]
    print(json.dumps(profile, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
