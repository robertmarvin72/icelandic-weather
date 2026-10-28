# Owner-supplied WFS geometry screenshot

Received/read by Ripley2026-10-28. Original C:/Users/Notandi/AppData/Local/Temp/codex-clipboard-01469a1d-ac99-493a-b2c9-1a7725353dd9.png. Identical screenshot retained here, SHA256 5d1b85dfcb89c2c1b74c5cc5b3ccb83f63bc90523fbdef74f16f472e0de2c7f1. Visual evidence, not a parsed raw response. Address shows WFS1.0.0 GetFeature typeName=gis:faerdferlar2017_1; scheme hidden. No fresh network request or execution-prompt/CURRENT change.

Visible WFS FeatureCollection with gml:featureMember, gis:faerdferlar2017_1, gis:SHAPE/gml:LineString. srsName=http://www.opengis.net/gml/srs/epsg.xml#3057. Coordinate values are comma-separated triples within space-separated tuples (decimal=., cs=comma, ts=space); visible z=0 is not validated elevation (owner geometry PDF says often missing height). Do not parse as lat/lon or drop namespace/axis validation.

Visible first feature: OBJECTID4153, IDFERILL21441, IDBUTUR904020037, VEGNR509, KAFLANR01, VEGHLUTI5, NAKVAEMNIFERLIS0, DAGSFERILS2026-10-07T00:00:00Z. Source text names Hringvegur–Akranesvegur; not a Route1 corridor proof (VEGNR509). First and last coordinates repeat, consistent with a closed line/roundabout and VEGHLUTI5 per owner PDF. This is geometry context, not proof an entire road is closed to traffic.

Second feature: OBJECTID1006, IDFERILL3350, IDBUTUR904380037, VEGNR553, KAFLANR01, VEGHLUTI1, NAKVAEMNIFERLIS2, DAGSFERILS2026-10-07T00:00:00Z, source names Langavatnsvegur. IDBUTUR904380037 also visibly occurred as IdButur904380037 in the owner's faerd2017_1 screenshot: a concrete visible cross-representation ID match, not a machine-validated full join/version guarantee.

Third partial feature: OBJECTID2648, IDFERILL2123, IDBUTUR911350037, VEGNR946, KAFLANR02, VEGHLUTI1, NAKVAEMNIFERLIS1, DAGSFERILS2026-10-07T00:00:00Z. Together the screenshot shows precision0/1/2 can coexist in an unfiltered response, agreeing with owner PDF. They are DIFFERENT IDFERILL records here, so this screenshot alone does NOT demonstrate the same geometry duplicated three times; use retained actual-feature grouping before explaining old anomalous lengths.

Key consequences for483:
- Actual visible field spelling NAKVAEMNIFERLIS, distinct from one PDF-table typo NAKVAEMNIFERILS; query actual schema, no blind typo use.
- OBJECTID/fid feature identity, IDFERILL path identity and IDBUTUR road-state join are different concepts.
- Geometry DAGSFERILS is version metadata, not road-condition assessment time; planned service attrs are not live passability.
- gml:boundedBy/gml:null=unknown doesn't mean geometry absent: LineString data visibly exists in members.
- Current service response supports historical schema leads but does not establish total count, route completeness, HTTPS, terms/rights or a coordinate transform/control. Preserve screenshot source grade and no new request allowance. No SafeTravel or DMI scope change.
