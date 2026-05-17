/* eslint-disable */
// Prompt Builder Tool — main app
// Hash-based routing over four screens.

const PROMPTS = [
  // Hybrid Search
  { id: "hybrid-search", cat: "Hybrid Search", catKey: "hybrid",
    title: "Hybrid Search",
    desc: "Combines vector similarity with keyword matching to balance semantic understanding with precise term recall across product catalogues.",
    ver: "v2.4", date: "Apr 18, 2026",
    what: "Combines a dense vector retriever with a sparse keyword retriever, then fuses the two candidate lists with reciprocal-rank fusion. Returns the top N hits as a ranked JSON array.",
    where: "Default retrieval prompt for any account that has both an embedding index and a keyword index configured. Runs as step 1 of the search pipeline.",
    impact: "Lifts recall on long-tail catalogues where customers mix free-text descriptions with exact part numbers. Typical +12% nDCG@10 over keyword-only baseline." },
  { id: "visual-text", cat: "Hybrid Search", catKey: "hybrid",
    title: "Visual + Text Matching",
    desc: "Blends image embeddings with extracted OCR tokens to find products when the user provides a photo with partial text overlays.",
    ver: "v1.7", date: "Mar 02, 2026",
    what: "Extracts OCR tokens from the input image, computes a CLIP-style image embedding, then runs both signals against the product index and fuses the results.",
    where: "Image-first search flows. Activated when the request includes an image and the OCR step finds at least one alphanumeric token.",
    impact: "Useful for nameplates, type plates and product labels. Reduces 'no result' rate by ~22% on photo-based queries." },
  { id: "rerank", cat: "Hybrid Search", catKey: "hybrid",
    title: "Multimodal Reranking",
    desc: "Re-scores an initial candidate set using a cross-encoder that jointly considers image features, attribute metadata and query intent.",
    ver: "v3.1", date: "May 04, 2026",
    what: "Takes the top 50 candidates from the initial retriever and re-ranks them with a cross-encoder model that ingests query, image features, and structured attributes together.",
    where: "Optional second stage. Enabled per-account in the Indexes settings. Slightly higher latency in exchange for better top-3 precision.",
    impact: "Pushes the correct match into the top 3 results 28% more often on the MechaTech benchmark set." },

  // Grounding
  { id: "internet-search", cat: "Grounding", catKey: "grounding",
    title: "Internet Search Identification",
    desc: "Detects when a user request needs fresh web context, formulates a targeted search query and returns grounded source URLs alongside the answer.",
    ver: "v2.0", date: "Apr 29, 2026",
    what: "Classifies each request for time-sensitivity. If the query needs fresh information, it crafts a search query, fetches sources, and merges them with the answer as inline citations.",
    where: "Conversational search surfaces where the user asks 'is this still available' / 'latest model' type questions. Off by default for catalogue search.",
    impact: "Provides verifiable sources and reduces hallucination rate by 41% on time-sensitive prompts in internal evaluations." },
  { id: "knowledge", cat: "Grounding", catKey: "grounding",
    title: "Knowledge Augmentation",
    desc: "Pulls supporting passages from a connected knowledge index and injects them into the answer context with inline citations.",
    ver: "v1.4", date: "Mar 21, 2026",
    what: "Retrieves up to 5 passages from the linked knowledge index, ranks them by relevance to the query, then inserts the top 3 into the LLM context as a numbered citation list.",
    where: "Used whenever a knowledge index is attached to the account. Powers documentation chat, support bots and FAQ surfaces.",
    impact: "Doubles factual-accuracy scores on internal QA evaluations versus answering from the LLM's parametric memory alone." },
  { id: "citations", cat: "Grounding", catKey: "grounding",
    title: "Source Citation Builder",
    desc: "Assembles citation footnotes from retrieved documents and formats them consistently into the final response payload.",
    ver: "v1.1", date: "Feb 11, 2026",
    what: "Takes the source documents emitted by upstream grounding steps and renders them into a consistent footnote schema with title, URL, snippet, and confidence.",
    where: "Runs as the last step before the response is returned to the client whenever any grounding source was used.",
    impact: "Standardises citation formatting across all answer surfaces — UI can render them uniformly without per-prompt handling." },

  // Vizo
  { id: "vizo-detect", cat: "Vizo", catKey: "vizo",
    title: "Vizo Object Detection",
    desc: "Detects and segments individual products in a multi-product photo, returning bounding boxes and per-region embeddings.",
    ver: "v1.2", date: "May 09, 2026",
    what: "Runs Vizo's segmentation model over the input image, isolates each detected object, then computes an independent embedding for each region.",
    where: "First step for any image with more than one product (e.g. shelf photos, parts bins). Each segmented region is searched independently downstream.",
    impact: "Unlocks multi-product photos as input. On the MechaTech shelf benchmark, recall on individual SKUs goes from 41% (single embedding) to 84% (per-object)." },
  { id: "vizo-caption", cat: "Vizo", catKey: "vizo",
    title: "Vizo Caption Generation",
    desc: "Generates a structured, search-friendly caption from an input image — object type, materials, colour, distinguishing marks.",
    ver: "v2.3", date: "Apr 22, 2026",
    what: "Produces a structured caption with fields for object_type, material, colour and visible_text. The caption is then used by the semantic-text branch of hybrid search.",
    where: "Activated whenever the input is image-only (no user text query). Feeds the text retriever with an LLM-generated query.",
    impact: "Restores text-search recall on pure-image queries. Improves overall hit-rate by 18% on photo-first traffic." },
  { id: "vizo-quality", cat: "Vizo", catKey: "vizo",
    title: "Vizo Quality Gate",
    desc: "Filters out blurry, obstructed or low-information images before they enter the search pipeline, with a structured reason code.",
    ver: "v1.0", date: "Mar 30, 2026",
    what: "Scores each image on blur, occlusion and information density. If the score falls below the configured threshold, the request is short-circuited with a reason code.",
    where: "Runs first thing in the pipeline. Configurable per-account threshold; defaults to 'permissive' for new accounts.",
    impact: "Prevents wasted compute on unusable images and gives the UI a structured reason to surface back to the user ('please retake the photo')." },

  // Smart Filters
  { id: "category-filter", cat: "Smart Filters", catKey: "filters",
    title: "Smart Category Filter",
    desc: "Infers the most likely product category from a free-text query and narrows the candidate set before similarity scoring runs.",
    ver: "v2.2", date: "Apr 09, 2026",
    what: "Predicts the most likely top-level category for a query, then restricts the retrieval index to candidates in that category before similarity scoring.",
    where: "Runs as a pre-filter for any account that has a category taxonomy attached. Off by default until categories are configured.",
    impact: "Reduces candidate-set noise dramatically. Cuts p95 latency by ~30% and pushes top-3 precision up 9 points." },
  { id: "attr-filter", cat: "Smart Filters", catKey: "filters",
    title: "Attribute-Based Filter",
    desc: "Extracts structured attributes — color, size, material, brand — from natural language and applies them as exact-match facet filters.",
    ver: "v1.9", date: "Mar 17, 2026",
    what: "Identifies attribute mentions in the query ('black, 12V, M8 thread') and binds them to the index's facet schema, applying exact-match filters before scoring.",
    where: "Useful on catalogues with rich structured attributes. Runs after the category filter, before the retriever.",
    impact: "Eliminates obviously-wrong matches at retrieval time. Customers report ~3x reduction in 'wrong colour' complaints." },
  { id: "intent", cat: "Smart Filters", catKey: "filters",
    title: "Intent Classification",
    desc: "Routes incoming requests into one of: identification, comparison, support or browsing — so downstream prompts can specialise accordingly.",
    ver: "v2.6", date: "May 06, 2026",
    what: "Classifies each request into one of four intent buckets, then routes it to the prompt chain best suited to that intent.",
    where: "Runs first whenever multi-intent traffic is expected. Powers the dispatcher that decides which downstream prompts execute.",
    impact: "Enables specialised prompt chains per intent. Identification queries see +14% precision, support queries see -28% no-result rate." },
];

const PROMPT_BODY_TEMPLATE = `# TASK
You are given an input from the user. Follow the steps below to produce
a structured response.

# CUSTOMER CONTEXT
{{CUSTOMER_CONTEXT}}

# DOMAIN TERMINOLOGY
{{TERMINOLOGY}}

# EXAMPLES
{{EXAMPLES}}

# STEPS
1. Normalize the user query and detect language.
2. Compute the dense vector representation of the query.
3. Run a kNN search against the product index for top 200 candidates.
4. In parallel, run a BM25 keyword search over the same index.
5. Merge candidate sets using reciprocal-rank fusion (alpha=0.6, beta=0.4).
6. Apply the configured smart filters before final ranking.
7. Return the top N hits as JSON matching the schema below.

# OUTPUT FORMAT
{
  "query_intent": "<string>",
  "results": [
    {
      "id":      "<string>",
      "score":   <number 0..1>,
      "matched": ["<string>", ...]
    }
  ]
}

# CONSTRAINTS
- The response must be valid JSON.
- Scores must be normalized to the [0, 1] interval.
- Never include products that fail the smart-filter step.`;

// ────────────────────────────────────────────────────────────────────
// Routing
// ────────────────────────────────────────────────────────────────────
function parseHash() {
  const h = (window.location.hash || "#/library").replace(/^#/, "");
  const parts = h.split("/").filter(Boolean);
  return { route: parts[0] || "library", arg: parts[1] || null };
}
function useRoute() {
  const [r, setR] = React.useState(parseHash);
  React.useEffect(() => {
    const on = () => setR(parseHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return r;
}
function go(path) {
  window.location.hash = path;
}

// ────────────────────────────────────────────────────────────────────
// Drafts (localStorage)
// ────────────────────────────────────────────────────────────────────
const DRAFTS_KEY = "nyris-prompt-drafts-v1";
function loadDrafts() {
  try { return JSON.parse(localStorage.getItem(DRAFTS_KEY)) || []; }
  catch { return []; }
}
function saveDrafts(list) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(list));
}
function useDrafts() {
  const [drafts, setDrafts] = React.useState(loadDrafts);
  const refresh = React.useCallback(() => setDrafts(loadDrafts()), []);
  React.useEffect(() => {
    const on = (e) => { if (e.key === DRAFTS_KEY) refresh(); };
    window.addEventListener("storage", on);
    window.addEventListener("nyris-drafts-changed", refresh);
    return () => {
      window.removeEventListener("storage", on);
      window.removeEventListener("nyris-drafts-changed", refresh);
    };
  }, [refresh]);
  const upsert = React.useCallback((d) => {
    const list = loadDrafts();
    const idx = list.findIndex(x => x.id === d.id);
    if (idx >= 0) list[idx] = d; else list.unshift(d);
    saveDrafts(list);
    window.dispatchEvent(new CustomEvent("nyris-drafts-changed"));
  }, []);
  const remove = React.useCallback((id) => {
    saveDrafts(loadDrafts().filter(x => x.id !== id));
    window.dispatchEvent(new CustomEvent("nyris-drafts-changed"));
  }, []);
  return { drafts, upsert, remove };
}

window.PROMPTS = PROMPTS;
window.PROMPT_BODY_TEMPLATE = PROMPT_BODY_TEMPLATE;
window.useRoute = useRoute;
window.go = go;
window.useDrafts = useDrafts;
window.loadDrafts = loadDrafts;

// ────────────────────────────────────────────────────────────────────
// Status model
// ────────────────────────────────────────────────────────────────────
const STATUSES = {
  draft:    { id: "draft",    label: "Draft",     tone: "grey"   },
  review:   { id: "review",   label: "In Review", tone: "yellow" },
  approved: { id: "approved", label: "Approved",  tone: "green"  },
  live:     { id: "live",     label: "Live",      tone: "purple" },
};

function StatusBadge({ status, size }) {
  const s = STATUSES[status] || STATUSES.draft;
  return (
    <span className={"sbadge sbadge--" + s.tone + (size === "sm" ? " sbadge--sm" : "")}>
      <span className="sbadge-dot"></span>
      {s.label}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────
// Word-level diff (token-set based — illustrative for the design)
// ────────────────────────────────────────────────────────────────────
function tokenize(s) {
  return (s || "").split(/(\s+|[.,;:!?(){}\[\]])/).filter(Boolean);
}
function diffTokens(left, right) {
  // Build longest-common-subsequence on tokens, then walk to produce ops.
  const a = tokenize(left), b = tokenize(right);
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1
                               : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { ops.push({ type: "same", token: a[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ type: "del", token: a[i] }); i++; }
    else { ops.push({ type: "add", token: b[j] }); j++; }
  }
  while (i < n) { ops.push({ type: "del", token: a[i++] }); }
  while (j < m) { ops.push({ type: "add", token: b[j++] }); }
  return ops;
}
function diffStats(ops) {
  let added = 0, removed = 0;
  ops.forEach(o => {
    if (o.type === "add" && o.token.trim()) added++;
    else if (o.type === "del" && o.token.trim()) removed++;
  });
  return { added, removed };
}
function renderDiff(ops, side) {
  // side: "left" shows removals, "right" shows additions, both show "same"
  return ops.map((o, i) => {
    if (o.type === "same") return <span key={i}>{o.token}</span>;
    if (side === "left" && o.type === "del")
      return <span key={i} className="diff-del">{o.token}</span>;
    if (side === "right" && o.type === "add")
      return <span key={i} className="diff-add">{o.token}</span>;
    return null;
  });
}

window.STATUSES = STATUSES;
window.StatusBadge = StatusBadge;
window.diffTokens = diffTokens;
window.diffStats = diffStats;
window.renderDiff = renderDiff;
