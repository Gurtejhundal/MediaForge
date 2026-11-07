import { lookup } from "node:dns/promises";
import { request as httpRequest, type IncomingMessage } from "node:http";
import { request as httpsRequest } from "node:https";
import ipaddr from "ipaddr.js";

export class RequestError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}

export function isPublicAddress(address: string) {
  try {
    // process() also normalizes IPv4-mapped IPv6 before applying reserved ranges.
    return ipaddr.process(address).range() === "unicast";
  } catch { return false; }
}

export function publicUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) throw new RequestError("Enter a public HTTP or HTTPS URL.");
  let url: URL;
  try { url = new URL(value); } catch { throw new RequestError("Enter a valid public URL."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || (url.port && !["80", "443"].includes(url.port))) {
    throw new RequestError("Use HTTP or HTTPS on a standard port without embedded credentials.");
  }
  return url;
}

async function openPublic(url: URL, signal: AbortSignal, method: "GET" | "POST", payload?: string): Promise<IncomingMessage> {
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new RequestError("Private, loopback, and reserved network addresses are not allowed.");
  }
  signal.throwIfAborted();
  const pinned = addresses[0];
  return new Promise((resolve, reject) => {
    const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(url, {
      method,
      signal,
      // Pin the inspected DNS result at connection time; a second resolution is unsafe.
      lookup: (_hostname, options, callback) => {
        if (options.all) callback(null, [pinned]);
        else callback(null, pinned.address, pinned.family);
      },
      headers: { Accept: "*/*", "User-Agent": "MediaForge/0.2", ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}) },
    }, resolve);
    request.on("error", reject);
    request.end(payload);
  });
}

export async function fetchPublic(value: string, options: { maxBytes?: number; timeoutMs?: number; json?: unknown; allowedTypes?: RegExp } = {}) {
  const signal = AbortSignal.timeout(options.timeoutMs ?? 20_000);
  const maxBytes = options.maxBytes ?? 50 * 1024 * 1024;
  let url = publicUrl(value);
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const response = await openPublic(url, signal, options.json === undefined ? "GET" : "POST", options.json === undefined ? undefined : JSON.stringify(options.json));
    if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0)) {
      const location = response.headers.location;
      response.destroy();
      // Don't send provider payloads to redirect targets.
      if (!location || redirects === 3 || options.json !== undefined) throw new RequestError("The remote server returned an unsupported redirect.");
      url = publicUrl(new URL(location, url).href);
      continue;
    }
    if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
      response.destroy();
      throw new RequestError("The remote server could not provide this file.", 502);
    }
    const contentType = (response.headers["content-type"] || "application/octet-stream").split(";")[0].toLowerCase();
    if (options.allowedTypes && !options.allowedTypes.test(contentType)) {
      response.destroy();
      throw new RequestError("The URL did not return a supported media file.");
    }
    if (Number(response.headers["content-length"]) > maxBytes) {
      response.destroy();
      throw new RequestError(`Remote file exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit.`, 413);
    }
    const chunks: Buffer[] = [];
    let bytes = 0;
    for await (const chunk of response) {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        response.destroy();
        throw new RequestError("Remote response exceeds the download size limit.", 413);
      }
      chunks.push(Buffer.from(chunk));
    }
    return { bytes: Buffer.concat(chunks), contentType, url };
  }
  throw new RequestError("Too many redirects.");
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const origin = request.headers.get("origin");
  if (origin) {
    let sameOrigin = false;
    try {
      const parsed = new URL(origin);
      // Next standalone can construct request.url with its internal hostname.
      // Browser Host is the actual destination; Origin must match that authority.
      sameOrigin = ["http:", "https:"].includes(parsed.protocol) && parsed.host === (request.headers.get("host") || new URL(request.url).host);
    } catch { /* Invalid and opaque origins are rejected. */ }
    if (!sameOrigin) throw new RequestError("Cross-origin requests are not allowed.", 403);
  }
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new RequestError("Send an application/json request.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError("Send a JSON object.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16_384) { await reader.cancel(); throw new RequestError("Request body is too large.", 413); }
      chunks.push(value);
    }
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError("Send a valid JSON object.");
  }
}

export function errorResponse(error: unknown) {
  return Response.json({ error: error instanceof RequestError ? error.message : "The remote request failed or timed out. Please try again." }, { status: error instanceof RequestError ? error.status : 502 });
}
