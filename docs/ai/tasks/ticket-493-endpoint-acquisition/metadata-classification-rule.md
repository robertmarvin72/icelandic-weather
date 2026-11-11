# #493 endpoint-acquisition — Metadata `discovery_candidate` classification rule (EA7)

2026-11-11, CC. Written and hashed (`metadata-classification-rule.sha256`)
BEFORE the `ACCESS-CAPABILITIES` call, before any capabilities response
is seen. This rule is applied mechanically to the parsed capabilities
document; `discovery_candidate` is never set by hand after reading the
response.

## Rule

For every `FeatureType` enumerated in the `GetCapabilities` response
(`discovery-gaps.json`'s own full mechanical listing, per EA7), set
`discovery_candidate = true` if, after lower-casing and stripping
diacritics, the layer's own `Name` **or** `Title` matches any of the
following keyword patterns (Python `re`, case-insensitive, substring
match — a hit anywhere in the string counts):

```
veg          (road/way -- also matches vegur, vegagerd, vegskra, ...)
faerd        (already known to match gis:faerdferlar2017_1 itself --
              included for completeness, not because it is informative
              on its own)
akstur       (driving)
stefna       (direction)
einstefna    (one-way)
tengi        (connection/junction)
umferd       (traffic)
samgong      (transport)
network
direction
traffic
access
road
```

This is deliberately broad (it will almost certainly also match layers
that turn out to be irrelevant, including `faerdferlar2017_1` itself)
— `discovery_candidate = true` means "worth a human or future prompt
looking at," not "proven relevant." A layer name matching this rule
does **not** by itself establish content, licence, one-way status, or
driving access of any kind (EA7's own explicit instruction) — it is
recorded in `discovery-gaps.json` as a discovery candidate only.

`discovery-gaps.json` also mechanically enumerates **every** `FeatureType`
regardless of this rule's outcome (name, title, default/other SRS,
operations) — the rule only sets the one boolean flag; it does not
filter what gets listed.

## What this rule does not do

- It does not run until after `ACCESS-CAPABILITIES`'s own response has
  passed the EA7 safety gate (rejecting any body containing `<!DOCTYPE`
  or `<!ENTITY` before any parsing is attempted).
- It triggers no further network call, `DescribeFeatureType` request,
  or feature query of any kind in this round, regardless of outcome.
- It never changes `driving_access_both_directions`'s own status
  (`EXACT_GAP`, per RP2) or R1's own unselected state.
