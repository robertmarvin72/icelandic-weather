# #485 iteration4 — Correction v7: enforced-local testing and atomic terminal lifecycle

2026-11-02. Ripley REVISE after Jonesy v6 result review R1–R7. Read README/CURRENT, immutablev5/v6, full latest result-review and CC report. Execute only owner Prompt approved/CURRENT READY_FOR_CC here; set CC_IN_PROGRESS first. Only existing iteration4 researchclient/tests/docs, root cc-report-iteration-4.md and CURRENT writes. Preserve older prompts/reviews/iterations/provider data. NO realkey/presence/secret-env access, provider/externalDNS/network/accounts/install/subagents/production/GitHub/commit/push/deploy/MVP/publication. Fakefixtures and guardedloopback only. ProductPARTIAL, paidforecastNOT_TESTED, candidatePARTIAL until independentreview. Unrelated464 modification preserve untouched.

## R1 — close external-DNS breach BEFORE running ANY existing socket suite

Don't rerun old url-injection/mutation suites until fixed. Put test-only failclosed guard in EVERY test process/child before candidate imports: deny nonloopback getaddrinfo AND connect/connect_ex/create_connection, allow only explicit literal loopbackaddresses and allocated localtestports. Unknown hostname/port fails with fixedcategory without resolvercall. Guard before all lookup/connection, not just mocked socket.connect after realgetaddrinfo. Spawned children must install guard independently; prove inheritance/activation rather than assume monkeypatch propagates. Do not import realkey or provider env. In copies retarget provider_target constants to loopback BEFORE actual run_request/child_worker test; fake URL in error message may name invalid.test but never resolve it. No change to realproviderconstants in source.

Add retained negative guardtest: attempted externalhostname captured/refused before underlyingresolver/socket, underlying externalcalls=0. Include library routes and child workers. Keep guard instrumentation and coverage separate from providerinterface; testcode never imported by provider. Old v6 zeroexternalDNS claim cannot stand: correct report to say lookup may have occurred (Jonesy observed in sandbox; actual historical Windows DNS not independently established). No actual customerHTTP/provider/key access established; don't falsely claim none/specificcontact from missing logs. New guard no newproviderproof.

## R2 — atomic outcome+terminal and incomplete recovery

Reserve refuses any unresolved reserved/inflight record on recovery. Do not treat uncompletedrow as permission to consume remainingcount. Atomic locked update completes outcome AND terminal flag/category together; no crashgap between record_outcome and mark_terminal. Persist failclosed intent before unsafeoutputexception/return. Sample shape/rejection/disclosure, malformedchild, auth/rate, deadline/workerfailure all explicit safe categories with sample_written status. A wrongshape200 cannot return indistinguishableOK or be retried as ordinarysuccess. Any uncertain failed/pendingwrite=>refuse nextdispatch. Test via copied actual run_request: parentkilled after childreceipt, crashbetweenoutcome/terminal transition, malformed200, restartsecondprocess; assert newrequestcount0 afterterminal/incomplete. Parent soleledgerwriter; workernever writes durableledger.

## R3 — non-signalling Windows locks

Remove automatic stale-lock reclaim for this correction; if exclusive lock exists return LedgerBusy/LedgerAmbiguous, manualtestcleanup only after test-ownedprocessjoined. NO os.kill(pid,0) or other signal as livenessprobe on Windows. No productioncalibration invoking it. Test live contention refuses safely without killing/signallingowner; dead/ambiguouslock blocks until explicit fixturecleanup. POSIX-only liveness is not crossplatformevidence. Adjust concurrencytest to accept safeBusy (not falsely sixsuccesses), caps/lostupdates remain checked. Document availabilitytradeoff; realrun manualdecision outside scope.

## R4 — conservative bytes and actual global remainder

Partial transfer/transportfailure must not be bytesknownTrue/charged0. Record observed decodedbytes if available and conservative chargedreservedcap for incomplete/errorunknown paths. Terminaltransferfailure can refuse futurework, but still truthful accounting. Cleancomplete response may reconcile reservedbytes only safely. Worker cap =MIN(perbody, remainingglobal) from durable pre-dispatchreservation; test actualsocket sendingnearcap thenreset and globalremainder<perbody, restartledger remains conservative. No arithmetic-only check as streamingproof. Persist bytesobserved/charged/known separately and no secret-bearingbody.

## R5 — real pipeline kill/receipt proof, test hooks only in copies

Replace test_real_kill duplicatePopen/kill proof with realcopied run_request+child_worker intentionally stalled beyond cooperative deadline. Assert productionparentTimeoutExpired branch, childdead/joined, terminalrestartrefusal, elapsedbounded includingdeclaredcleanup. Test childacknowledgesrequestreceipt via nonsecret testmarker, kill parent atthatpoint, recoveryrefuses reservedrow. Faultinjection hooks inserted ONLY into copiedscratchcode; remove _post_fsync_pre_replace_hook from candidateledger. Persist exactRED/GREEN scripts/output/sourcehashes, classify STATIC/SYNTHETIC/REAL_SOCKET truthfully. No standalonekillroutine as acceptance of actualpipeline.

## R6 — unique safe samples and bounded scanner limits

Sample save in parentpipeline after safeclassification, uniqueattemptID filename, nooverwrite. _dispatch remains sideeffectfree returningvalidatedsample-or-category; validates decodedfields/types/arrays/units and scans finalserialisation before parentwrite. Atomic publication/sample_written outcome ordering, crashgap yields pending/incomplete=>refusal. Test twocleansuccessfulattempts preserve2distinctsamples; malformed200 leaves nosample and terminalcategory. The chosen failclosed malformedescape policy may reject harmlessnonJSONbackslashes; document falsepositive/terminalcost honestly. You may implement tokenlocal unescape if all existingmalformedescape and encodedsecret tests stayfailclosed; no need to broadenencodings or promise universalcoverage.

## R7 — evidence and preservation

Correct 'all Rfixed'/zeroexternalDNS/killproof/sampleclaims to actualhistory and newevidence, supersededvisible. One independentlycomputed before/aftertable for oldimmutableinputs plus before/finalcandidatehashes. Explain actualschemaedits not 'pre-dates visiblewindow'. Finalreview only exactnewhashes. Capture OS/runtime/testdurations, actualcommandoutcomes, guardlogs booleans/counts. No unexplainedWindowsclaims from Linuxtests.

## Test and handoff

First staticreview guard/testentry coverage, then puretests, then guardedcopiedpipeline/socket/mutation/crashsuites (<=180s per fullrun, <=10s fixturedeadlines). Failure refuses acceptance, no skipasPASS. No externalresolver probes even to test deny; use failifcalled underlyingfakeinstrumentation. Cleanup test-ownedPID/paths only with resolvedworkspacechecks. Preserve rawpriorstdout/history, don't rerun oldunguardedscripts. No OpenSSL externalnetwork/trustfetch; syntheticTLSerror acceptable as before.

No rearchitecture/dependencies/geometry/providerprobe. Targeted candidatefixes only; newadjacentissues report against scope. Write CC correction mappingR1–R7, candidateverdict limited tofake/local, immutablepreservationtable+finalmanifest+READMEhardgate. git status/HEAD/diff--check; CC_COMPLETE reportpath, owner->Jonesy independent source/resultreview->Ripley. No realkey until reviewedfixedhashes plus separatelyreviewedliveprobe and ownerhandoff. No commit/push/publication.
