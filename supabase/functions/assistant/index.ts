// Pete's Notes helper: web clipping and AI features.
// Deploy in Supabase → Edge Functions → Deploy a new function → Via Editor, name it "assistant", paste this file.
// Needs one secret: ANTHROPIC_API_KEY (Edge Functions → Secrets). Optional: CLAUDE_MODEL.
import { DOMParser } from "jsr:@b-fuze/deno-dom@0.1.48";

const ALLOWED_ORIGINS = ["https://notes.archimedia.ie", "http://localhost:8123"];
const MODEL = Deno.env.get("CLAUDE_MODEL") ?? "claude-sonnet-5-5";

function corsFor(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// Only signed-in users of this project may use the function.
async function signedIn(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return false;
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_ANON_KEY") ?? req.headers.get("apikey") ?? "";
  const r = await fetch(`${url}/auth/v1/user`, { headers: { Authorization: auth, apikey: key } });
  return r.ok;
}

/* ---------- web clipping ---------- */
const KEEP = new Set(["p", "h1", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "pre", "code", "table", "thead", "tbody", "tr", "td", "th", "img", "a", "strong", "b", "em", "i", "br", "figure", "figcaption", "hr"]);
const DROP = "script,style,noscript,nav,footer,header,aside,form,iframe,svg,button,input,select,template,[role=navigation],[aria-hidden=true],.share,.social,.comments,.advert,.ad,.cookie,.newsletter";

function clean(el: any, base: URL): string {
  let out = "";
  for (const node of el.childNodes) {
    if (node.nodeType === 3) { out += escapeHTML(node.textContent ?? ""); continue; }
    if (node.nodeType !== 1) continue;
    const tag = node.tagName.toLowerCase();
    const inner = clean(node, base);
    if (!KEEP.has(tag)) { out += inner; continue; }
    if (tag === "img") {
      const src = node.getAttribute("src") || node.getAttribute("data-src") || "";
      try { if (src && !src.startsWith("data:")) out += `<img src="${escapeAttr(new URL(src, base).href)}" alt="${escapeAttr(node.getAttribute("alt") ?? "")}">`; } catch { /* skip */ }
      continue;
    }
    if (tag === "a") {
      const href = node.getAttribute("href") ?? "";
      try { out += `<a href="${escapeAttr(new URL(href, base).href)}">${inner}</a>`; } catch { out += inner; }
      continue;
    }
    if (tag === "br" || tag === "hr") { out += `<${tag}>`; continue; }
    if (!inner.trim() && tag !== "td" && tag !== "th") continue;
    out += `<${tag}>${inner}</${tag}>`;
  }
  return out;
}
const escapeHTML = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
const escapeAttr = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

async function clip(url: string) {
  const base = new URL(url);
  if (!/^https?:$/.test(base.protocol)) throw new Error("Only web pages can be clipped");
  const r = await fetch(base.href, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15", "Accept-Language": "en-IE,en;q=0.9" }, redirect: "follow" });
  if (!r.ok) throw new Error(`The page returned ${r.status}`);
  const type = r.headers.get("content-type") ?? "";
  if (!type.includes("html")) return { title: base.hostname, html: `<p><a href="${escapeAttr(base.href)}">${escapeHTML(base.href)}</a></p>` };
  const text = (await r.text()).slice(0, 3_000_000);
  const doc = new DOMParser().parseFromString(text, "text/html");
  if (!doc) throw new Error("Could not read the page");
  const meta = (n: string) => doc.querySelector(`meta[property="${n}"],meta[name="${n}"]`)?.getAttribute("content") ?? "";
  const title = (meta("og:title") || doc.querySelector("title")?.textContent || base.hostname).trim();
  doc.querySelectorAll(DROP).forEach((n: any) => n.remove());
  // choose the element holding the most paragraph text
  const candidates = [...doc.querySelectorAll("article, main, [role=main], .post, .entry-content, .content, #content")];
  let best: any = doc.body, bestLen = 0;
  for (const c of candidates as any[]) {
    const len = [...c.querySelectorAll("p")].reduce((s: number, p: any) => s + (p.textContent?.length ?? 0), 0);
    if (len > bestLen) { best = c; bestLen = len; }
  }
  let html = clean(best, base).replace(/\s+/g, " ").slice(0, 400_000);
  const lead = meta("og:image");
  if (lead && !html.includes(lead)) { try { html = `<img src="${escapeAttr(new URL(lead, base).href)}" alt="">` + html; } catch { /* skip */ } }
  return { title, html, site: meta("og:site_name") || base.hostname };
}

/* ---------- AI ---------- */
async function claude(system: string, user: string, maxTokens = 1200) {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("AI isn't set up yet: add ANTHROPIC_API_KEY in Supabase");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message ?? `AI request failed (${r.status})`);
  return (j.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n").trim();
}

async function ask(question: string, notes: { title: string; notebook: string; date: string; text: string }[]) {
  const today = new Date().toISOString().slice(0, 10);
  const system = `You answer questions for Peter using only his own notes, which are given below. Today is ${today}. ` +
    `Answer in plain, short sentences in Irish/UK English. When you use a note, cite it with its number in square brackets, like [2]. ` +
    `If the notes don't contain the answer, say so plainly and suggest what to search for. Do not invent facts. ` +
    `Never repeat passwords, PINs or card numbers even if a note contains them; say which note holds them instead.`;
  const body = notes.map((n, i) => `[${i + 1}] ${n.title} (notebook: ${n.notebook}; edited ${n.date})\n${n.text}`).join("\n\n---\n\n");
  return await claude(system, `My notes:\n\n${body}\n\n===\nQuestion: ${question}`);
}

async function summarise(title: string, text: string) {
  const system = "Summarise the note for its owner in Irish/UK English. Give 2-4 short bullet points starting with '- ', then, if the note contains open actions or to-dos, a line 'To do:' followed by bullets. No preamble. Never repeat passwords or card numbers.";
  return await claude(system, `Title: ${title}\n\n${text}`, 600);
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (!(await signedIn(req))) return json({ error: "Please sign in again" }, 401);
    const b = await req.json();
    if (b.action === "clip") return json(await clip(String(b.url)));
    if (b.action === "ask") return json({ answer: await ask(String(b.question).slice(0, 2000), (b.notes ?? []).slice(0, 20)) });
    if (b.action === "summarise") return json({ summary: await summarise(String(b.title ?? ""), String(b.text ?? "").slice(0, 30000)) });
    if (b.action === "ping") return json({ ok: true, ai: !!Deno.env.get("ANTHROPIC_API_KEY") });
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 400);
  }
});
