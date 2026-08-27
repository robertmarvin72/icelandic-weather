// src/hooks/useAuroraDecision.js
//
// Canonical request/data boundary for POST /api/aurora-decision (Ticket 4,
// approved prompt §3). Identical request for Free and Pro given identical
// context; never scores/re-ranks/mutates the response. When `enabled` is
// false (seasonally hidden or feature disabled), no fetch is ever issued —
// status stays "idle".

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeLocationIds, buildAuroraRequestKey } from "../lib/auroraCandidateRequest";
import { getOrCreateAuroraDecision, invalidateAuroraDecision } from "../lib/auroraDecisionCache";

export async function performAuroraDecisionFetch(fetchImpl, evening, locationIds) {
  const res = await fetchImpl("/api/aurora-decision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ evening, locationIds }),
  });
  const body = await res.json().catch(() => null);
  return { httpOk: res.ok, httpStatus: res.status, body };
}

export function useAuroraDecision({ enabled, evening, locationIds, fetchImpl = fetch }) {
  const normalizedIds = normalizeLocationIds(locationIds || []);
  const key = enabled && evening ? buildAuroraRequestKey(evening, normalizedIds) : null;

  const [status, setStatus] = useState("idle"); // idle | loading | resolved
  const [outcome, setOutcome] = useState(null);
  const keyRef = useRef(key);
  keyRef.current = key;

  const load = useCallback(
    (requestKey, ev, ids, { forceFresh = false } = {}) => {
      if (forceFresh) invalidateAuroraDecision(requestKey);

      setStatus("loading");
      const promise = getOrCreateAuroraDecision(requestKey, () => performAuroraDecisionFetch(fetchImpl, ev, ids));

      promise.then(
        (result) => {
          if (keyRef.current !== requestKey) return; // obsolete completion — identity moved on
          setOutcome(result);
          setStatus("resolved");
        },
        () => {
          if (keyRef.current !== requestKey) return;
          setOutcome({ transportError: true });
          setStatus("resolved");
        },
      );
    },
    [fetchImpl],
  );

  useEffect(() => {
    if (!key) {
      setStatus("idle");
      setOutcome(null);
      return;
    }
    load(key, evening, normalizedIds);
    // key already encodes (evening, normalizedIds) deterministically.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, load]);

  const retry = useCallback(() => {
    if (!key) return;
    load(key, evening, normalizedIds, { forceFresh: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, load]);

  return { status, outcome, retry, requestKey: key };
}
