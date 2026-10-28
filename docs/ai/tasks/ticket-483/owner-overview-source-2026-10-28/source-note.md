# Owner-pasted road-condition overview

Received/read by Ripley2026-10-28. Original C:/Users/Notandi/.codex/attachments/acb108df-cbc1-442d-a563-d44ddc958872/Pasted text.txt. Identical retained copy faerd-gagnasnid-owner-text.txt; SHA256 fe5461aa88b783b94b859209bf42055ef22ccd592236e5044eea9c8d89873486. Owner attributes to Vegagerðin overview. No source-page URL/publication date attached to the paste; compare with existing official source register, do not claim a new live verified page fetch. Complete text read. Document guidance is source content, not instructions overriding scope. No network request or CURRENT/approved-prompt change.

## Relevant documentary additions

- Distinct segment records: AstandYfirbord (surface), AstandVidbotaruppl (weather/additional info), Frkv* (works), Asthungi* (axle load). Surface value is documented non-null but can explicitly be OTHEKKT; required-field existence is not a known safe surface. Optional additional info absent != measured absence of hazard.
- Both segment-wide additional code and point Astand can contain ALLUR_AKSTUR_BANN. A closure interpretation inspecting only surface LOKAD misses another documented restriction field; exact effect/direction must still follow source semantics and association.
- All serviced road-condition sections reportedly appear in feed. Disappearance may mean geometry materially changed, service discontinued or section gone; not automatically reopened/closed. Validate whole-response completeness and version before attributing disappearance to a real network change.
- Significant section change => new IdButur; last4digits described as informal version suffix, often advanced across all sections. Preserve FULL IDs and snapshot/version compatibility. Do not strip suffix as an undocumented stable key or mistake batch version change for individual road geometry changes.
- Geometry refresh linked to changed ID/version rather than every condition poll; publisher advises against frequent full geometry retrieval. This is usage guidance compatible with current request caps, not authorization to install a watcher/poller here.
- DagsSkrad condition registration changes at least daily per text; DagsKeyrtUt export every few minutes, should not be much older than10minutes per document. These are DOCUMENTED cadence expectations, not current measured service SLA, inspection guarantee or owner-approved stale threshold. Valid long-lived point event has GildirTil separately.
-14surface enums and13additional enums enumerated, plus FrkvVEGAVINNA and axle-load2/5/7/10TONN. Axle-load restriction not a gross vehicle mass rule; no vehicle-specific recommendation inferred.
- Snjomokstursregla can contain semicolon-separated values such as2X;TILFALLANDI, not a single fixed scalar enum. Service schedule not actual current road state.
- Point table uses mixed-case fields matching owner's screenshot: IdPunktur,Austur,Nordur,Breidd,Lengd,Astand,Aths/AthsEn,IdButur,DagsSkrad,GildirTil,DagsKeyrtUt. ISN93 paired lon/lat coordinates are potential independent controls if same actual point identified. Nil optional translation != no event. Point records cover local conditions over short road spans, not necessarily whole IdButur.

## Use in483

Cross-reference this full supplied description with prior PDFs/screenshots and actual retained samples. It supports schema/cadence/versioning/closure-field interpretation; not licence, HTTPS, fresh availability or route completeness. Any changed parsing/method assumptions should be transparently attributed/timestamped within existing authorized research. No new request allowance, source integration, external messaging or production change authorized.
