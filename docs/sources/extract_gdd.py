"""Read the retained DOCX without modifying it; produce stable OOXML locators."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "Demonicute_GDD_Living_Document_v0_1_2.docx"
OUT = Path(__file__).resolve().parent
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
W = "{" + NS["w"] + "}"
paragraph_count = 0
table_count = 0
lines = [
    "# GDD extracted source text",
    "",
    f"Source: `{SOURCE.name}`. The original DOCX is retained unchanged.",
    "",
    "Locators P0001, P0002, etc. enumerate paragraphs in body reading order, including table cells. "
    "T001/R001/C001 identify table, row and cell positions in the OOXML. "
    "These are source text locators, not rendered page numbers. Empty paragraphs are retained. "
    "This extraction does not validate page layout or artwork.",
    "",
]


def paragraph_text(node: ET.Element) -> str:
    pieces = []
    for child in node.iter():
        if child.tag in {W + "t", W + "delText"}:
            pieces.append(child.text or "")
        elif child.tag == W + "tab":
            pieces.append("\t")
        elif child.tag in {W + "br", W + "cr"}:
            pieces.append("\n")
    return "".join(pieces)


def walk_blocks(parent: ET.Element, location: str) -> None:
    global paragraph_count, table_count
    for child in parent:
        if child.tag == W + "p":
            paragraph_count += 1
            locator = f"P{paragraph_count:04d}"
            style_node = child.find("w:pPr/w:pStyle", NS)
            style = style_node.get(W + "val", "") if style_node is not None else ""
            lines.extend([f"### {locator}", "", f"Location: `{location}`. Style: `{style or 'default'}`.", ""])
            text = paragraph_text(child)
            lines.extend(["> " + part for part in (text or "[empty paragraph]").splitlines()])
            lines.append("")
        elif child.tag == W + "tbl":
            table_count += 1
            table_id = f"T{table_count:03d}"
            lines.extend([f"## {table_id}", "", f"Table at `{location}`.", ""])
            for row_no, row in enumerate(child.findall("w:tr", NS), 1):
                for cell_no, cell in enumerate(row.findall("w:tc", NS), 1):
                    walk_blocks(cell, f"{table_id}/R{row_no:03d}/C{cell_no:03d}")
        elif child.tag in {W + "sdt", W + "sdtContent", W + "ins", W + "del"}:
            walk_blocks(child, location + "/" + child.tag.split("}")[-1])


with ZipFile(SOURCE) as archive:
    document = ET.fromstring(archive.read("word/document.xml"))
    body = document.find("w:body", NS)
    if body is None:
        raise ValueError("DOCX body is missing")
    walk_blocks(body, "body")
    main_paragraphs = paragraph_count
    main_tables = table_count
    other_parts = [name for name in archive.namelist() if name.startswith("word/") and
                   (name.startswith("word/header") or name.startswith("word/footer") or
                    name in {"word/footnotes.xml", "word/endnotes.xml", "word/comments.xml"}) and name.endswith(".xml")]
    for part in sorted(other_parts):
        lines.extend([f"## Additional XML part {part}", ""])
        part_root = ET.fromstring(archive.read(part))
        if part_root.tag in {W + "footnotes", W + "endnotes", W + "comments"}:
            for entry in part_root:
                walk_blocks(entry, part + "/id=" + entry.get(W + "id", "unknown"))
        else:
            walk_blocks(part_root, part)
    media = [name for name in archive.namelist() if name.startswith("word/media/")]
    revisions = {
        "insertions": len(document.findall(".//w:ins", NS)),
        "deletions": len(document.findall(".//w:del", NS)),
    }
    stats = {
        "source": SOURCE.name,
        "sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        "body_paragraphs_extracted": main_paragraphs,
        "body_paragraphs_xml": len(body.findall(".//w:p", NS)),
        "body_tables_extracted": main_tables,
        "body_tables_xml": len(body.findall(".//w:tbl", NS)),
        "total_paragraphs_extracted": paragraph_count,
        "additional_xml_parts": other_parts,
        "embedded_media": media,
        "tracked_changes": revisions,
    }
    if stats["body_paragraphs_extracted"] != stats["body_paragraphs_xml"]:
        raise AssertionError("Paragraph coverage differs from OOXML body")
    if stats["body_tables_extracted"] != stats["body_tables_xml"]:
        raise AssertionError("Table coverage differs from OOXML body")

lines.extend(["## Extraction verification", "", "```json", json.dumps(stats, ensure_ascii=False, indent=2), "```", ""])
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "gdd-extracted.md").write_text("\n".join(lines), encoding="utf-8")
(OUT / "gdd-extraction.json").write_text(json.dumps(stats, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(stats, ensure_ascii=False, indent=2))
