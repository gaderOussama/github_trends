// Collects trending/fresh GitHub repos (skills, mcp, memory, tooling) -> data/repos.json (+ data/history.json star snapshots)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');
const UA = 'github-trends';
const CAP = 30;
const FRESH = 8;

// repo -> category; always included (bypass cap/filter) and shown only in that category
const WATCH = { 'MemPalace/mempalace': 'memory', 'JuliusBrussee/caveman': 'tooling', 'anthropics/skills': 'skills', 'upstash/context7': 'mcp' };
// generic platforms/databases that tag themselves mcp/memory/agents but are not agent tooling
const EXCLUDE = new Set([
  'n8n-io/n8n', 'langgenius/dify', 'open-webui/open-webui', 'jeecgboot/JeecgBoot', 'flipped-aurora/gin-vue-admin',
  'LibreChat-AI/LibreChat', 'sansan0/TrendRadar', 'PDFMathTranslate/PDFMathTranslate', 'liyupi/ai-guide',
  'pingcap/tidb', 'dolthub/dolt', 'screenpipe/screenpipe', 'xming521/WeClone', 'alibaba/zvec', 'simular-ai/Agent-S',
  'StarTrail-org/PixelRAG', 'HarnessMD/munder-difflin', 'deepset-ai/haystack', 'ruvnet/ruflo', 'ai-boost/awesome-prompts',
  'holaboss-ai/holaOS', 'Marker-Inc-Korea/AutoRAG', 'wanghao-SunSky/cs329z-chinese', 'deeplethe/utopia',
  'TokenRhythm/opensquilla', 't8y2/dbx', 'OtterMind/Chat2DB', 'Evil0ctal/Douyin_TikTok_Download_API',
  'modelscope/FunASR', 'pascalorg/editor', '78/xiaozhi-esp32', 'qybaihe/bla', 'lexifina/global-law',
  'jub0t/Concat', 'tangency-labs/solidcraft', 'FrigadeHQ/yogurt', 'Ebony-Vinyl/EAC-design-world', 'DayuanJiang/next-ai-draw-io',
].map((n) => n.toLowerCase()));
const JUNK = /uncensored|abliterat/i;
// stars above which a topic-only hit is ignored: giants tag themselves mcp to ride the trend
const TOPIC_ONLY_MAX = { mcp: 10000 };
const CATS = ['skills', 'mcp', 'memory', 'tooling'];
const MAX_CATS = 2;
const HISTORY_DAYS = 14;

const QUERIES = {
  skills: ['topic:claude-skills', 'topic:agent-skills', 'topic:claude-code-skills', 'topic:skill claude',
    'topic:claude-code skill', '"claude skill" in:name,description', 'SKILL.md in:readme claude'],
  mcp: ['topic:mcp', 'topic:mcp-server', 'topic:model-context-protocol'],
  memory: ['topic:agent-memory', 'topic:llm-memory', 'topic:ai-memory', 'topic:memory mcp', 'topic:memory agent',
    '"memory palace" in:name,description,readme', 'topic:context-engineering', '"long-term memory" agent in:description'],
  tooling: ['topic:token-optimization', 'topic:claude-code tokens', 'topic:context-compression',
    'topic:ai-gateway claude-code', 'topic:cost-optimization claude', 'topic:code-intelligence claude-code',
    '"token usage" coding agent in:description'],
};
const KEYWORDS = {
  skills: /\bskills?\b/i,
  mcp: /\bmcp\b|model context protocol/i,
  memory: /\bmemor(y|ies)\b|context (engineering|window|management|database)|long[- ]term|knowledge graph/i,
  tooling: /token[- ]?(optimi|sav|reduc|compress|efficien|econom|budget|usage|cost|burn|bill)|(sav|cut|reduc|fewer|less|lower|trim|shrink|cheap)\w*\s+(\w+\s+){0,2}(tokens?|context|cost|bill)|(context|prompt)[- ](compress|optimi|cach)|compaction|ai[- ]gateway|llm[- ](proxy|gateway|router)|cost[- ](optimi|track|reduc|sav|monitor)|code[- ](intelligence|retrieval)|codebase[- ](intelligence|index|graph|context)|claude[- ]code[- ]hooks?/i,
};

let token = process.env.GITHUB_TOKEN;
if (!token) {
  try { token = execSync('gh auth token', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch {}
}
const headers = { 'User-Agent': UA, Accept: 'application/vnd.github+json', ...(token && { Authorization: `Bearer ${token}` }) };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// fetch with up to 2 retries on network errors (rate-limit/HTTP errors are returned as-is)
const get = async (url, opts, n = 2) => {
  try { return await fetch(url, opts); } catch (e) { if (!n) throw e; await sleep(3000); return get(url, opts, n - 1); }
};
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const num = (s) => Number(String(s ?? '').replace(/[^\d]/g, '')) || 0;
const clean = (s) => s?.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim() || null;

const toRepo = (r) => ({
  fullName: r.full_name, url: r.html_url, description: r.description ?? null, stars: r.stargazers_count,
  starsGained: null, gainedPeriod: null, language: r.language ?? null, topics: r.topics ?? [],
  pushedAt: r.pushed_at ?? null, createdAt: r.created_at ?? null, isNew: false, install: null, source: 'search', watched: false,
});

function matches(cat, r) {
  const text = `${r.name} ${r.description ?? ''}`;
  if (r.fork || r.archived || EXCLUDE.has(r.full_name.toLowerCase()) || JUNK.test(text)) return false;
  return KEYWORDS[cat].test(text) ||
    (r.stargazers_count < (TOPIC_ONLY_MAX[cat] ?? Infinity) && KEYWORDS[cat].test((r.topics ?? []).join(' ')));
}

async function search(q) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=100`;
  try {
    const res = await get(url, { headers });
    if (!res.ok) { console.warn(`! ${res.status} for: ${q}`); return []; }
    return (await res.json()).items ?? [];
  } catch (e) { console.warn(`! ${e.message} for: ${q}`); return []; }
}

async function trending(since) {
  try {
    const res = await get(`https://github.com/trending?since=${since}`, { headers: { 'User-Agent': UA } });
    if (!res.ok) { console.warn(`! trending ${since}: ${res.status}`); return []; }
    const html = await res.text();
    return html.split('<article class="Box-row">').slice(1).map((raw) => {
      const row = raw.replace(/<svg[\s\S]*?<\/svg>/g, '');
      const fullName = row.match(/<h2[\s\S]*?href="\/([^"/]+\/[^"/]+)"/)?.[1];
      if (!fullName) return null;
      return {
        fullName,
        description: clean(row.match(/<p class="col-9[^>]*>([\s\S]*?)<\/p>/)?.[1]),
        language: clean(row.match(/itemprop="programmingLanguage">([^<]*)</)?.[1]),
        stars: num(row.match(new RegExp(`href="/${fullName}/stargazers"[^>]*>([\\s\\S]*?)</a>`))?.[1]),
        gained: num(row.match(/([\d,]+)\s*stars\s*(?:today|this week|this month)/)?.[1]),
        period: since === 'daily' ? 'today' : 'week',
      };
    }).filter(Boolean);
  } catch (e) { console.warn(`! trending ${since}: ${e.message}`); return []; }
}

async function main() {
  const t0 = Date.now();
  mkdirSync(DATA, { recursive: true });
  const cats = Object.fromEntries(CATS.map((c) => [c, new Map()]));
  const d7 = daysAgo(7), d30 = daysAgo(30);
  const pause = token ? 2200 : 6500;
  console.log(token ? 'auth: token' : 'auth: none (slow mode)');

  // 1. search API
  for (const [cat, bases] of Object.entries(QUERIES)) {
    for (const base of bases) {
      for (const recency of [`pushed:>=${d7}`, `created:>=${d30}`]) {
        // pace request starts, not request ends, so slow responses don't stack on top of the pause
        const [items] = await Promise.all([search(`${base} ${recency} fork:false archived:false`), sleep(pause)]);
        for (const r of items) {
          if (!matches(cat, r)) continue;
          if (!cats[cat].has(r.full_name)) cats[cat].set(r.full_name, toRepo(r));
        }
      }
    }
  }

  // 2. trending page
  for (const since of ['daily', 'weekly']) {
    for (const t of await trending(since)) {
      const text = `${t.fullName} ${t.description ?? ''}`;
      for (const [cat, re] of Object.entries(KEYWORDS)) {
        if (EXCLUDE.has(t.fullName.toLowerCase()) || !re.test(text)) continue;
        const cur = cats[cat].get(t.fullName);
        // prefer the larger daily/weekly gain only if none yet; daily wins ties by being seen first
        if (cur && cur.starsGained != null) continue;
        const base = cur ?? {
          fullName: t.fullName, url: `https://github.com/${t.fullName}`, description: t.description, stars: t.stars,
          language: t.language, topics: [], pushedAt: null, createdAt: null, isNew: false, install: null, watched: false,
        };
        cats[cat].set(t.fullName, { ...base, starsGained: t.gained, gainedPeriod: t.period, source: 'trending' });
      }
    }
  }

  // 2b. enrich trending-only repos (topics, dates, archived/fork) when we can afford API calls
  if (token) {
    const info = new Map();
    for (const map of Object.values(cats)) {
      for (const [name, r] of map) {
        if (r.createdAt) continue;
        if (!info.has(name)) info.set(name, await get(`https://api.github.com/repos/${name}`, { headers }).then((x) => (x.ok ? x.json() : null)).catch(() => null));
        const j = info.get(name);
        if (!j) continue;
        if (j.fork || j.archived) { map.delete(name); continue; }
        Object.assign(r, { stars: j.stargazers_count, topics: j.topics ?? [], pushedAt: j.pushed_at, createdAt: j.created_at, description: j.description ?? r.description });
      }
    }
  }

  // 2c. watchlist: always included, only in its own category
  for (const [name, cat] of Object.entries(WATCH)) {
    const j = await get(`https://api.github.com/repos/${name}`, { headers }).then((x) => (x.ok ? x.json() : null)).catch(() => null);
    const prev = CATS.map((c) => cats[c].get(name)).find(Boolean);
    const repo = j ? toRepo(j) : prev;
    if (!repo) { console.warn(`! watch ${name} unavailable`); continue; }
    for (const map of Object.values(cats)) map.delete(name);
    cats[cat].set(name, { ...repo, watched: true });
    await sleep(pause / 4);
  }

  // 2d. a repo may sit in at most MAX_CATS categories (CATS order wins), then star history -> weekly gain
  const where = new Map();
  for (const cat of CATS) for (const name of cats[cat].keys()) where.set(name, [...(where.get(name) ?? []), cat]);
  for (const [name, list] of where) for (const cat of list.slice(MAX_CATS)) if (!cats[cat].get(name).watched) cats[cat].delete(name);

  const histFile = join(DATA, 'history.json');
  const prevHist = existsSync(histFile) ? JSON.parse(readFileSync(histFile, 'utf8')) : {};
  const today = daysAgo(0), keepFrom = daysAgo(HISTORY_DAYS);
  const history = {};
  for (const [name, snaps] of Object.entries(prevHist)) {
    const kept = Object.fromEntries(Object.entries(snaps).filter(([d]) => d >= keepFrom));
    if (Object.keys(kept).length) history[name] = kept;
  }
  for (const map of Object.values(cats)) {
    for (const r of map.values()) {
      // no trending gain: stars now minus the oldest snapshot from the last 7 days that is at least a day old
      const old = Object.keys(prevHist[r.fullName] ?? {}).filter((d) => d >= d7 && d <= daysAgo(1)).sort()[0];
      if (r.starsGained == null && old && r.stars > prevHist[r.fullName][old]) {
        Object.assign(r, { starsGained: r.stars - prevHist[r.fullName][old], gainedPeriod: 'week' });
      }
      history[r.fullName] = { ...history[r.fullName], [today]: r.stars };
    }
  }
  writeFileSync(histFile, JSON.stringify(history));

  // 3. seen.json / isNew / install / sort / cap
  const seenFile = join(DATA, 'seen.json');
  const firstRun = !existsSync(seenFile);
  const seen = new Set(firstRun ? [] : JSON.parse(readFileSync(seenFile, 'utf8')));
  const out = { generatedAt: new Date().toISOString(), categories: {} };
  for (const [cat, map] of Object.entries(cats)) {
    const cmp = (a, b) => (b.starsGained != null) - (a.starsGained != null) || (b.starsGained ?? 0) - (a.starsGained ?? 0) || b.stars - a.stars;
    const all = [...map.values()].filter((r) => !r.watched).sort(cmp);
    // reserve up to FRESH slots for repos created in the last 30 days so new ones aren't buried by giants
    const fresh = all.filter((r) => r.createdAt && r.createdAt.slice(0, 10) >= d30).slice(0, FRESH);
    out.categories[cat] = [...fresh, ...all.filter((r) => !fresh.includes(r)).slice(0, CAP - fresh.length),
      ...[...map.values()].filter((r) => r.watched)]
      .sort(cmp)
      .map((r) => {
        const isNew = !firstRun && !seen.has(r.fullName);
        seen.add(r.fullName);
        const skill = cat === 'skills' || (cat === 'tooling' && r.topics.some((t) => /^(claude-)?skills?$/.test(t)));
        return { ...r, isNew, install: skill ? `npx skills add ${r.fullName}` : null };
      });
  }
  writeFileSync(join(DATA, 'repos.json'), JSON.stringify(out, null, 2));
  writeFileSync(seenFile, JSON.stringify([...seen], null, 2));

  for (const [cat, list] of Object.entries(out.categories)) {
    console.log(`${cat}: ${list.length} repos (${list.filter((r) => r.starsGained != null).length} trending, ${list.filter((r) => r.isNew).length} new)`);
  }
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch((e) => { console.error(e); process.exit(1); });
