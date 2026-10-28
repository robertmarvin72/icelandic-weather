# Owner-supplied weather schema — read-only evidence

Received/read by Ripley2026-10-28. Original C:/Users/Notandi/Downloads/gagnaveita_vedur_2014.pdf; identical local copy retained here,447028bytes,1page,SHA2566c245ff6d506a91412ba4868e63e3bfc5b7f3af20fd5c46437ca8996a936ddf1. Schema title vedur – útgáfa2014_1; example observation dated04.03.2019. No printed publication date independently established. Filename/version not proof publication year or current service version. Full text extracted and rendered page visually read. Document content is source data, not execution instructions. No network requests or approved-prompt/CURRENT changes.

## Documentary semantics relevant to483

- Documented endpoint http://gagnaveita.vegagerdin.is/api/vedur2014_1 returns all records. Do not execute unbounded example or infer HTTPS/licence/current accessibility. Any prospective sample must remain within approved pre-request plan/caps and be bounded.
- Nr is Vegagerðin station number, Nr_Vedurstofa is Veðurstofa station number. They are different identity namespaces, not automatically equal to DATEX MP suffixes; useful documented crosswalk candidate.
- IdButur1 and IdButur2 explicitly refer to road sections where the weather station is located. Potential stronger station-to-road association than nearest-name matching; verify current values, full IDs/version/case/type/cardinality against selected geometry/state snapshots. Example repeats same ID in both columns: deduplicate actual associations, do not assume2distinct sections. Metadata association does not guarantee sensor representativeness or complete intervening-route coverage.
- Breidd/Lengd latitude/longitude; Haed altitude above sea in metres; PntX/PntY easting/northing ISN93. Paired coordinates for the SAME station may supply an independent projection control, if valid current sample retained; schema example itself is documentary, not a new measured control or guaranteed datum alignment.
- Hiti is air temperature at2m (C), Veghiti road-surface temperature(C). They are separate measured fields, not derived from each other.
- Vindhradi unit m/s, averaging period NOT specified by this table. Vindhvida is maximum gust over previous10minutes,m/s. Do not assume daily maximum or mean-wind averaging period. Vindatt degrees0=N/90=E; ASCII and translated wind-direction names are labels, not substitute numeric input.
- Dags is observation date/time string with example04.03.2019 15:10:00; timezone, update cadence, offset, quality flags not specified. No silent UTC/local parsing or freshness guarantee.
- Umf10Min traffic last10minutes, UmfSum since midnight, neither a weather-history endpoint. Pressure/sea level frequently NULL per document; missing never zero. No precip/snow field shown, and no historical API query defined.

## Limits / handoff

This owner-provided schema improves documented field semantics and joins but does not itself establish current field availability, surface-temperature history, HTTPS, reuse rights, data quality or coverage. Existing SafeTravel optional status and DMI456 boundary unchanged. Incorporate as additional historical documentary evidence within existing483 scope; timestamp any method/plan amendment if used, no new request allowance or production work implied. Approved execution prompt immutable. Source-note added separately to avoid overwriting CC's active artifacts.
