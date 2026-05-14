/**
 * Serializes concurrent identical AI POSTs to a single in-flight request.
 * Mitigates StrictMode double-mount and accidental double-clicks hammering Gemini.
 */
const inflight = new Map();

function hashTextSample(s, max = 8000) {
  const str = String(s ?? "");
  let h = 2166136261;
  const len = Math.min(str.length, max);
  for (let i = 0; i < len; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${h >>> 0}:${str.length}`;
}

/**
 * @param {string} methodKey logical operation id e.g. "decode-career"
 * @param {string} bodyFingerprint from hashTextSample(JSON.stringify(body))
 * @param {() => Promise<any>} factory
 */
export function runDedupedAiRequest(methodKey, bodyFingerprint, factory) {
  const key = `${methodKey}:${bodyFingerprint}`;
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = factory().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}

export function fingerprintImagePayload(payload) {
  const b64 = payload?.imageBase64 || "";
  const head = typeof b64 === "string" ? b64.slice(0, 160) : "";
  const tail =
    typeof b64 === "string" && b64.length > 160
      ? b64.slice(-160)
      : "";
  const meta = `${payload?.mimeType || ""}|${payload?.scope || ""}|${payload?.defaultSeason || ""}`;
  return hashTextSample(`${b64.length}|${head}|${tail}|${meta}`);
}

export { hashTextSample };
