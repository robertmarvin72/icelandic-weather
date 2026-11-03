# #485 iteration4 — Narrow safe-sample correction v8

2026-11-02. Ripley REVISE after Jonesy v7 resultreview R1/R2; R3 conservativebudget decision below. Read README/CURRENT, v5–v7 boundaries and latestreview/report. Execute only owner Prompt approved with CURRENT READY_FOR_CC here; CC_IN_PROGRESS first. Only iteration4 samplevalidation/tests/docs, root cc-report-iteration-4.md/CURRENT writes. Preserve historical prompts/reviews/raw data/otheriterations and unrelated464edit. No realkey/presence/env-secret access, externalDNS/network/provider/accounts/install/subagents/app/API/DB/UI/config/GitHub/commit/push/deploy/MVP/publication. Syntheticfixture and guardedloopbackonly. Do not expand clientarchitecture or geometry. CandidatePARTIAL until reviewed; productPARTIAL/paidforecastNOT_TESTED unchanged.

## R1 — documented response shape without weakening secret gate

Use retained iteration3/samples/openmeteo-docs.html as primary structure source; cite hash/section. Add typed bounded utc_offset_seconds(integer, notbool), timezone/timezone_abbreviation(str<=64) alongside existing latitude/longitude/elevation/hourly_units/hourly/generationtime_ms. No live docsfetch. A normaldocumented200 must save safe sample and leave ledger nonterminal if allrequiredconditions met.

Unknown top-levelfields: rawcomplete boundedbody/parsedvalues must be secret-scanned BEFORE dropping anything; secretreflection anywhere remains terminal. Otherwise discard unknownfields, never store names/values, count only in sample_reason=OK_UNKNOWN_FIELDS_DROPPED:n. Additive harmless fields are not an unsafe terminalreason. Retained safesample only allowedtypedfields and requiredforecaststructure; no arbitrarymetadata. Document bounded encoding scanner falsepositives/limitations unchanged.

Classification precedence: suspectedsecret/undecidableunsafeencoding=>terminal; malformedJSON or structurally invalid type/value of a storedfield=>terminal; top-levelJSONlist for this **singlelocationcandidate**=>nonterminal SAMPLE_UNSUPPORTED_TOP_LEVEL_LIST, chargedreceived/no sample; missingrequiredforecaststructure=>nonterminal SAMPLE_INCOMPLETE (R2), charged/no sample. A scalar/nonobjectnonlist body=>terminalstructuralfailure. Specificlist exception overrides general nonobjectrule. Nonterminalrefusal cannot reportOK, sample_writtenfalse and safe reason persisted atomically in outcome; no rawbody/errors. No automatic retry or forecastgrade implied. Future multipoint liveprobe needs reviewedlist support or singlelocation scope, not hidden expansion now.

## R2 — written sample requires actual forecast arrays

Require hourlyobject with time plus all6 schema.REQUIRED_HOURLY arrays, nonempty equal lengths<=existing cap; missing/empty requiredstructure =>SAMPLE_INCOMPLETE, no sample. Visibility optional, if supplied lengthconsistent; time strings valid bounded ISO-likeUTC hourly timestamps, unique/increasing; invalid supplied values/type/array mismatch=>structuralfailure, not incompleteness. Require corresponding hourly_units for time and allrequiredvariables, boundedstrings; missingunitmetadata=>SAMPLE_INCOMPLETE, invalidtypes=>structuralfailure. Recognised unit/ETA/fullforecast coverage remains separate futureprobe concern; nullrequiredvalues may be safelypreserved and labelled missingdatacount, never a claim of usablevalue/axis4PASS. Numbers finite, notbool; no huge/nonnumeric/secret reflections. Do not call `{}` a validforecastsample. Clearly separate safe sample capture from requiredvariable/horizon/ETA operational acceptance.

## Fixture and persisted tests

Build shared syntheticfixture from retaineddoc example's actual structure: ALL documentedtopfields, timehourlyunits plus6requiredarrays (72hourlypoints), optionalvisibility, appropriate samplelocation/elevation. Label synthetic expansion, not archivedAPIresponse. Use it in all sample-success/e2etests instead of minimal{}fixtures. Document pointcount singlelocation, no silent7pointclaim.

Test through purevalidator AND actualcopied run_request/realchild/guardedloopback: documentedpayload->OK+sample+nonterminal; additiveunknownfield->OK/count/fieldnotstored; same unknownfield containing fakekey->terminal/no sample; top-levellist->nonterminalrefusal/no sample/charged; {} or missingeachrequiredarray/unit->SAMPLE_INCOMPLETE; malformedJSON and invalidstoredfield->terminal; uniqueattemptsamples preserved; no secret anywhere output/ledger. Show sample reason and terminalstate correctness on restart. Persist expected-red copies removingdocumentedfields acceptance and allowing{} again, prove failures thenGREEN sourcehashunchanged. Guard externalDNS/connect in all parent/children BEFORE anynetwork/librarycall, no oldunguardedsuite.

## R3 — conservative accounting intentionally retained

Keep v7 charging: only completeOK responses reconcileknownbytes; nonOK outcomes conservatively consume fullreservedcap, including nonterminalSAMPLE_INCOMPLETE/listrefusal. Two failedattempts may exhaust4MiB even if actualtraffic smaller. This is intended boundedresearchbehavior; document retry implication. Do not resetledger/retry/budgetraise or alterbyteaccounting here. Futureliveprobe scope must explicitly accept thiscost; v8creates no livepermission.

## Acceptance/handoff

No need to modify establishedguard/terminal/lock/deadline protections unless a directlycaused regression requires in-scopefix; report newadjacentissues. Record before/finalcandidatehashes and before/after immutableinputtable. Run focusedsample/e2e/mutation tests then guardedexisting13suite regression if affected (<=180s, testdeadlines). Expected failuresnonzero; tests distinguish immutablefakefixtures from realproviderUNKNOWN. Runtime/OS/commands/stdout/evidencekind explicit. UpdateREADME/acceptanceplan/CCreport mappingR1/R2/R3decision without claims wholeclientproved or actualcustomer200.

git status/HEAD/diff--check, cleanup only verifiedtasklocalpaths/testPIDs; CC_COMPLETE reportpath, owner->Jonesy independentexacthash/source+resultreview->Ripley. No realkeyread until allcarriedgates+separatelyreviewedliveprobe+ownerhandoff. Historicaliteration3client remainsNOTFIT; candidatefakelocalonly pendingreview.
