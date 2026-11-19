# #501 — Approved metadata acquisition prompt v1 — 2026-11-17

Jonesy APPROVED acquisition plan with N1–N3. Owner explicitly approved the exact single-call proposal in Ripley chat (“Samþykkt”). Only ROAD-REGISTER-SCHEMA is authorized; this is not a graph/geometry implementation prompt. Prior audit approved-prompt-v1.md stays immutable.

CC executes after owner sends `Prompt approved` and CURRENT references this file at READY_FOR_CC. Set CC_IN_PROGRESS before work, CC_COMPLETE with report path after. Read AGENTS/CLAUDE/README and CURRENT first. Capture HEAD/status; preserve unrelated work. No extra review round before execution is needed: this is within Jonesy N1–N3 and owner-approved exact call.

## Exactly one authorized request

GET https://gagnaveita.vegagerdin.is/geoserver/gis/ows?service=WFS&version=1.0.0&request=DescribeFeatureType&typeName=gis%3Avegakerfi_ist120_2024_1

Source: retained ticket-499/samples/raw-ACCESS-CAPABILITIES.xml lists this layer with vegaskrá Abstract. Read retained evidence offline to confirm layer identity before dispatch. Do not fetch capabilities or faerdferlar schema again: retained #499/#429 already answer those. Documentation GET is NOT PLANNED. No HEAD, probes, redirects, retries, searches or alternative URLs. If exact request was already dispatched during this execution, do not repeat it after interruption.

Bound: max 1 sent HTTP request, 262144 response-body bytes (headers retained separately), 20-second whole-request wall timeout, zero retries, zero redirects. Enforce streaming byte cap (do not just trust Content-Length), abort on overflow; use built-in Node and descriptive non-personal User-Agent. No dependency installation or authenticated/customer endpoints. If transport/tool cannot enforce limits, stop before dispatch, record blocker. DNS/HTTP failure, 429/4xx/5xx, redirect, timeout/cap, auth or unexpected layer/schema => record and stop; never retry or change host. Partial bytes may be retained explicitly marked partial, never interpreted as complete schema.

## Deliverables and bounded interpretation

Under docs/ai/tasks/ticket-501/metadata-acquisition/ retain raw response bytes, headers, request ledger (exact URL/method, UTC client start/end, HTTP status, byte count, server Date separately, complete/partial/failed, SHA256). An offline helper using built-ins may live here; it must have no automatic retries and write only here. Never report secrets/env values. No env files/account access.

Expected success: WFS 1.0.0 DescribeFeatureType XML Schema for exactly gis:vegakerfi_ist120_2024_1. Verify actual schema/target layer, inspect any documented fields/annotations related to node connection, one-way/traversal/access. A field name/type alone is not verified semantics or a driving-direction authority. No matching field means this schema did not answer A, not that no authority exists anywhere. Unexpected/failed response is an honest result, not permission for further discovery.

Write a short metadata-report.md: observed fields/definitions, whether connection/direction/access question is answered or UNKNOWN, exact evidence pointers, and smallest proposed next step requiring separate owner authorization. No expansive plan or new graph work. Write cc-report.md with actual dispatch count/status, limits/outcome, validation, changed paths/HEAD/status and limitations. Validate retained hashes and git diff --check; no app tests/lint/build needed. Do not claim evidence exists for a request not successfully made.

Allowed writes only metadata-acquisition/ and CURRENT lifecycle. Keep proposal as immutable pre-approval artifact; its PROPOSED status is historical, superseded by this prompt's owner approval. Do not edit #500, previous #501 audit/plan/reviews, server_data, src/api/config/tests, dependencies. No geometry requests, bridging/snap/epsilon, direction inference, new routeId/UI, network Phase G, GitHub/commit/push/deploy. CURRENT remains CRLF. No process left running.

After CC_COMPLETE Jonesy reviews actual outcome, then Ripley final assessment. PASS closes only this bounded acquisition task; #501 implementation/GitHub closure and further requests remain separate. No follow-up collection is automatic even if a useful field is found. Stop once the single response and honest conclusion are delivered.