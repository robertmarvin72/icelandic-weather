#!/usr/bin/env python3
"""
#499 base endpoints -- written and hashed BEFORE the ACCESS-CAPABILITIES
call, before any capabilities response is seen (same discipline as
ticket-493-endpoint-acquisition/metadata-classification-rule.md's own
EA7, which this module reuses verbatim -- the keyword list and match
rule are NOT redefined here, only applied mechanically).

Safety gate (EA7, cited): a capabilities body containing `<!DOCTYPE`
or `<!ENTITY` is rejected BEFORE any XML parsing is attempted (XXE/
billion-laughs defense) -- `defusedxml` is not a repo dependency, so
this is a textual pre-check, not a parser-level mitigation; the
pre-check running on raw bytes before any parser sees them is exactly
what makes it sufficient here.

discovery_candidate does not establish content, licence, one-way
status, or driving access of any kind. It triggers no further network
call, DescribeFeatureType request, or feature query of any kind.
"""
import re
import unicodedata
import xml.etree.ElementTree as ET

KEYWORDS = [
    "veg", "faerd", "akstur", "stefna", "einstefna", "tengi", "umferd",
    "samgong", "network", "direction", "traffic", "access", "road",
]
WFS_NS = {"wfs": "http://www.opengis.net/wfs"}


def _strip_diacritics(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def is_discovery_candidate(name_or_title: str) -> bool:
    if not name_or_title:
        return False
    norm = _strip_diacritics(name_or_title).lower()
    return any(re.search(kw, norm) for kw in KEYWORDS)


def safety_gate_ok(body_bytes: bytes) -> bool:
    """Rejects a body containing a DOCTYPE or ENTITY declaration
    BEFORE any XML parser ever sees it (EA7)."""
    return b"<!DOCTYPE" not in body_bytes and b"<!ENTITY" not in body_bytes


def _find_first(element, local_tag):
    """`Element.find() or Element.find()` is WRONG for this purpose --
    an ElementTree Element's own __bool__ reflects its CHILD COUNT, not
    whether find() matched, so a found-but-childless leaf element
    (e.g. `<Name>text</Name>`) is falsy and `or` would skip right past
    it. Always compare the find() result to `None` explicitly instead.
    Tries the WFS-namespaced tag first, then the bare tag."""
    found = element.find(f"{{http://www.opengis.net/wfs}}{local_tag}")
    if found is not None:
        return found
    return element.find(local_tag)


def enumerate_feature_types(body_bytes: bytes):
    """Returns (feature_types, error). feature_types is a list of
    {"name", "title", "default_srs", "other_srs", "operations",
    "discovery_candidate"}. Never raises past this function -- any
    parse failure is returned as an error string, never a traceback
    escaping to the caller."""
    if not safety_gate_ok(body_bytes):
        return [], "REJECTED_BY_SAFETY_GATE: DOCTYPE or ENTITY declaration present"
    try:
        root = ET.fromstring(body_bytes)
    except ET.ParseError as e:
        return [], f"XML_PARSE_ERROR: {type(e).__name__}: {e}"

    out = []
    feature_type_list = root.find(".//{http://www.opengis.net/wfs}FeatureTypeList")
    if feature_type_list is None:
        feature_type_list = root.find(".//FeatureTypeList")
    if feature_type_list is None:
        return [], "NO_FEATURETYPELIST_ELEMENT_FOUND"

    for ft in feature_type_list:
        tag = ft.tag.rsplit("}", 1)[-1]
        if tag != "FeatureType":
            continue
        name_el = _find_first(ft, "Name")
        title_el = _find_first(ft, "Title")
        default_srs_el = _find_first(ft, "DefaultSRS")
        other_srs_els = ft.findall("{http://www.opengis.net/wfs}OtherSRS")
        if not other_srs_els:
            other_srs_els = ft.findall("OtherSRS")
        name = name_el.text if name_el is not None else None
        title = title_el.text if title_el is not None else None
        operations = []
        ops_el = _find_first(ft, "Operations")
        if ops_el is not None:
            for op in ops_el:
                operations.append(op.tag.rsplit("}", 1)[-1])
        out.append({
            "name": name,
            "title": title,
            "default_srs": default_srs_el.text if default_srs_el is not None else None,
            "other_srs": [e.text for e in other_srs_els],
            "operations": operations,
            "discovery_candidate": is_discovery_candidate(name) or is_discovery_candidate(title),
        })
    return out, None
