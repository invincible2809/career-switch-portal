"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/field";
import { ALLOWED_ENDPOINTS, API_BASE, isAllowed } from "@/lib/lab/api-allowlist";

interface Res {
  status: number;
  statusText: string;
  contentType: string | null;
  body: string;
  ms: number;
}

const urlFor = (path: string) => `${API_BASE}${path.replace(":id", "mug")}`;

/** A simple request builder that can only call the portal's own mock ShopEasy API (CLAUDE.md rule 3). */
export function ApiSandbox() {
  const [choice, setChoice] = useState(0);
  const [method, setMethod] = useState(ALLOWED_ENDPOINTS[0].method);
  const [url, setUrl] = useState(urlFor(ALLOWED_ENDPOINTS[0].path));
  const [headers, setHeaders] = useState([{ name: "Accept", value: "application/json" }, { name: "", value: "" }]);
  const [body, setBody] = useState("");
  const [res, setRes] = useState<Res | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const pick = (i: number) => {
    const e = ALLOWED_ENDPOINTS[i];
    setChoice(i);
    setMethod(e.method);
    setUrl(urlFor(e.path));
    setBody(e.exampleBody ?? "");
    setRes(null);
    setError(null);
  };

  const send = async () => {
    setRes(null);
    if (!isAllowed(method, url.trim())) {
      setError(`Blocked: only the ShopEasy mock API addresses listed in "Endpoint" are allowed (they start with ${API_BASE}). Requests to other addresses aren't sent.`);
      return;
    }
    const h = new Headers();
    for (const { name, value } of headers) {
      if (!name.trim()) continue;
      if (!/^[A-Za-z][A-Za-z0-9-]{0,40}$/.test(name.trim())) {
        setError(`"${name}" isn't a valid header name.`);
        return;
      }
      h.set(name.trim(), value.slice(0, 200));
    }
    let payload: string | undefined;
    if (method !== "GET" && body.trim()) {
      try {
        payload = JSON.stringify(JSON.parse(body));
      } catch {
        setError("The body isn't valid JSON. Check for missing quotes, commas or brackets.");
        return;
      }
      h.set("Content-Type", "application/json");
    }
    setError(null);
    setPending(true);
    const started = performance.now();
    try {
      const r = await fetch(url.trim(), { method, headers: h, body: payload, credentials: "same-origin", redirect: "error" });
      const text = await r.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {}
      setRes({ status: r.status, statusText: r.statusText, contentType: r.headers.get("content-type"), body: pretty, ms: Math.round(performance.now() - started) });
    } catch {
      setError("The request couldn't be sent.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="api-endpoint" className="block font-semibold">
          Endpoint
        </label>
        <Select id="api-endpoint" value={choice} onChange={(e) => pick(Number(e.target.value))}>
          {ALLOWED_ENDPOINTS.map((e, i) => (
            <option key={i} value={i}>
              {e.method} {e.path} – {e.description}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <div>
          <label htmlFor="api-method" className="block font-semibold">
            Method
          </label>
          <Select id="api-method" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
            <option>GET</option>
            <option>POST</option>
            <option>DELETE</option>
          </Select>
        </div>
        <div>
          <label htmlFor="api-url" className="block font-semibold">
            URL
          </label>
          <Input id="api-url" value={url} onChange={(e) => setUrl(e.target.value)} spellCheck={false} className="font-mono text-sm" />
        </div>
      </div>
      <fieldset className="space-y-2">
        <legend className="font-semibold">Headers</legend>
        {headers.map((h, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-2">
            <div>
              <label htmlFor={`hname-${i}`} className="block text-sm font-semibold">
                Header {i + 1} name
              </label>
              <Input id={`hname-${i}`} value={h.name} onChange={(e) => setHeaders(headers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            </div>
            <div>
              <label htmlFor={`hvalue-${i}`} className="block text-sm font-semibold">
                Header {i + 1} value
              </label>
              <Input id={`hvalue-${i}`} value={h.value} onChange={(e) => setHeaders(headers.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
            </div>
          </div>
        ))}
      </fieldset>
      {method !== "GET" ? (
        <div>
          <label htmlFor="api-body" className="block font-semibold">
            JSON body
          </label>
          <Textarea id="api-body" value={body} onChange={(e) => setBody(e.target.value)} className="min-h-28 font-mono text-sm" spellCheck={false} />
        </div>
      ) : null}
      <Button type="button" onClick={send} disabled={pending}>
        {pending ? "Sending…" : "Send request"}
      </Button>
      {error ? (
        <Alert tone="danger" role="alert">
          {error}
        </Alert>
      ) : null}
      {res ? (
        <section aria-label="Response" className="space-y-2" data-testid="api-response">
          <p role="status">
            <strong>Status:</strong> <span data-testid="api-status">{res.status}</span> {res.statusText} · {res.ms} ms
            {res.contentType ? ` · ${res.contentType}` : ""}
          </p>
          <pre className="max-h-96 overflow-auto rounded-md border border-border bg-surface-muted p-3 text-sm" tabIndex={0} aria-label="Response body">
            {res.body}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
