/* eslint-disable */
// Screen components for the Prompt Builder Tool

// ──────────────────────────────
// Shared chrome wrapper
// ──────────────────────────────
function AppShell({ children, secondaryNav }) {
  return (
    <div className="pl">
      <PortalHeader />
      <div className="pl-shell">
        <PortalSidebar active="prompts" />
        <main className="pl-content">
          {secondaryNav}
          <div className="pl-panel">{children}</div>
        </main>
      </div>
    </div>);

}

function SecondaryNav({ current }) {
  const items = [
  { id: "library", label: "Library", path: "/library" }];

  return (
    <nav className="secnav">
      {items.map((it) =>
      <a key={it.id}
      href={"#" + it.path}
      className={"secnav-item" + (it.id === current ? " is-active" : "")}>
          {it.label}
        </a>
      )}
    </nav>);

}

const CUSTOM_PROMPTS_KEY = "nyris-custom-prompts-v1";
const PROMPT_CATEGORIES = [
{ id: "hybrid", label: "Hybrid Search", tabLabel: "Hybrid" },
{ id: "grounding", label: "Grounding", tabLabel: "Grounding" },
{ id: "filters", label: "Filters", tabLabel: "Filters" }];

const FALLBACK_PROMPT_DETAIL = {
  id: "fallback-hybrid-search",
  cat: "HYBRID SEARCH",
  catKey: "hybrid",
  title: "Hybrid Search",
  desc: "Combines semantic embeddings with keyword retrieval to produce a balanced ranked list of products.",
  ver: "v2.4",
  date: "May 17, 2026",
  accountId: "mechatech",
  isFallback: true,
  promptBody: `**TASK**: Combine semantic embeddings with keyword retrieval to produce a balanced ranked list of products.

STEPS:
1. Normalize the user query and detect language.
2. Compute the dense vector representation of the query using the configured embedding model.
3. Run a kNN search against the product index, retrieving the top 200 candidates by cosine similarity.
4. In parallel, run a BM25 keyword search over the same index using the original query.
5. Merge candidate sets using reciprocal-rank fusion with weights alpha=0.6 and beta=0.4.
6. Apply the configured smart filters before final ranking.
7. Return the top N hits as a JSON array with id, score and matched fields.

CONSTRAINTS:
- The response must be valid JSON.
- Scores must be normalized to the [0, 1] interval.
- Never include products that fail the smart-filter step.`
};

function loadCustomPrompts() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_PROMPTS_KEY)) || []; }
  catch { return []; }
}

function saveCustomPrompts(list) {
  localStorage.setItem(CUSTOM_PROMPTS_KEY, JSON.stringify(list));
}

function upsertCustomPrompt(prompt) {
  const list = loadCustomPrompts();
  const idx = list.findIndex((p) => p.id === prompt.id);
  if (idx >= 0) list[idx] = prompt; else list.unshift(prompt);
  saveCustomPrompts(list);
  window.dispatchEvent(new CustomEvent("nyris-custom-prompts-changed"));
}

function findLibraryPrompt(id) {
  return loadCustomPrompts().find((p) => p.id === id) || PROMPTS.find((p) => p.id === id);
}

function useLibraryPrompts() {
  const [prompts, setPrompts] = React.useState(loadCustomPrompts);
  const refresh = React.useCallback(() => setPrompts(loadCustomPrompts()), []);

  React.useEffect(() => {
    const onStorage = (e) => { if (e.key === CUSTOM_PROMPTS_KEY) refresh(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("nyris-custom-prompts-changed", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("nyris-custom-prompts-changed", refresh);
    };
  }, [refresh]);

  const create = React.useCallback((prompt) => {
    upsertCustomPrompt(prompt);
  }, []);

  return { prompts, create };
}

// ──────────────────────────────
// Library page
// ──────────────────────────────
function LibraryPage() {
  const [filter, setFilter] = React.useState("all");
  const { prompts } = useLibraryPrompts();
  const counts = React.useMemo(() => {
    const c = { all: prompts.length };
    prompts.forEach((p) => {c[p.catKey] = (c[p.catKey] || 0) + 1;});
    return c;
  }, [prompts]);
  const filtered = filter === "all" ?
  prompts :
  prompts.filter((p) => p.catKey === filter);
  const tabs = [
  { id: "all", label: "All" },
  ...PROMPT_CATEGORIES.map((cat) => ({ id: cat.id, label: cat.tabLabel }))];
  const hasPrompts = prompts.length > 0;

  return (
    <AppShell secondaryNav={<SecondaryNav current="library" />}>
      <h1 className="pl-title">Prompts Library</h1>
      <p className="pl-subtitle">Read-only reference prompts. Select one to view details or create a customer prompt.</p>

      <div className="pl-tabs">
        <span className="pl-tabs-label">Filter by</span>
        {tabs.map((t) =>
        <button key={t.id} type="button"
        className={"pl-tab" + (filter === t.id ? " is-active" : "")}
        onClick={() => setFilter(t.id)}>
            {t.label} <span className="count">{counts[t.id] || 0}</span>
          </button>
        )}
      </div>

      {!hasPrompts ?
      <div className="empty">
          <div className="empty-art">
            <svg width="160" height="130" viewBox="0 0 160 130" fill="none" aria-hidden="true">
              <rect x="36" y="28" width="88" height="74" rx="14" fill="#F3F4F8" stroke="#DDDEE7" strokeWidth="1.5" />
              <rect x="54" y="44" width="38" height="7" rx="3.5" fill="#E5D0FF" />
              <rect x="54" y="58" width="58" height="6" rx="3" fill="#DDDEE7" />
              <rect x="54" y="72" width="34" height="13" rx="4" fill="#FFFFFF" stroke="#DDDEE7" />
              <rect x="92" y="72" width="45" height="13" rx="4" fill="#7114E6" />
              <circle cx="124" cy="36" r="12" fill="#FFFFFF" stroke="#9745FF" strokeWidth="2" />
              <path d="M124 30.5V37" stroke="#7114E6" strokeWidth="2" strokeLinecap="round" />
              <circle cx="124" cy="42" r="1.4" fill="#7114E6" />
            </svg>
          </div>
          <h2 className="empty-h">No prompts yet</h2>
          <p className="empty-p">The reference library is empty right now. Once nyris publishes prompts, they will appear here ready to view and customise.</p>
          <button type="button" className="btn btn--primary"
          style={{ flex: "0 0 auto", minWidth: 180 }}
          onClick={() => go("/request")}>
            Request a prompt
          </button>
        </div> :
      filtered.length === 0 ?
      <div className="empty">
          <h2 className="empty-h">No prompts match this filter</h2>
          <p className="empty-p">Try another category.</p>
        </div> :

      <div className="pl-grid">
          {filtered.map((p) => <LibraryCard key={p.id} p={p} />)}
        </div>
      }
    </AppShell>);

}

function RequestPromptPage() {
  return <CustomerPromptWizard />;
}

function LibraryCard({ p }) {
  return (
    <article className="pcard">
      <div className="pcard-catrow">
        <span className="pcard-cat">{p.cat}</span>
        <span className="pcard-lock">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 4.5V3a2.5 2.5 0 1 1 5 0v1.5M2 4.5h6v4H2z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
          Read-only
        </span>
      </div>
      <h3 className="pcard-title">{p.title}</h3>
      <p className="pcard-desc">{p.desc}</p>
      <div className="pcard-meta">
        <span>Updated {p.date}</span>
      </div>
      <div className="pcard-actions">
        <button type="button" className="btn btn--primary"
        onClick={() => go("/builder/" + p.id)}>Create Customer Prompt</button>
        <button type="button" className="btn btn--outline"
        onClick={() => go("/detail/" + p.id)}>View Details</button>
      </div>
    </article>);

}

// ──────────────────────────────
// Detail page
// ──────────────────────────────
const OUTPUT_FORMAT_BODY = `{
  "query_intent": "<string>",
  "results": [
    {
      "id":      "<string>",
      "score":   <number 0..1>,
      "title":   "<string>",
      "matched": ["<string>", ...]
    }
  ],
  "filters_applied": ["<string>", ...]
}`;

async function copyTextToClipboard(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

// Detail view: only prompt body (task + steps + constraints) and output format —
// no customer-context / terminology / examples sections (those remain in the builder).
function DetailPromptEditor({ promptBody }) {
  const sectionsList = [
  { key: "PROMPT_BODY", title: "", body: promptBody || buildDetailViewPromptBody(), copyable: true },
  { key: "OUTPUT_FORMAT_BLOCK", title: "Output format", body: OUTPUT_FORMAT_BODY }];

  const [copiedKey, setCopiedKey] = React.useState(null);
  const copyTimers = React.useRef({});

  const onCopySection = React.useCallback((key, body) => {
    copyTextToClipboard(body).
    then(() => {
      const prevId = copyTimers.current[key];
      if (prevId) window.clearTimeout(prevId);
      setCopiedKey(key);
      copyTimers.current[key] = window.setTimeout(() => {
        setCopiedKey(null);
        delete copyTimers.current[key];
      }, 2000);
    }).
    catch(() => {
      window.alert("Could not copy to clipboard.");
    });
  }, []);

  React.useEffect(() => () => {
    Object.values(copyTimers.current).forEach((id) => window.clearTimeout(id));
  }, []);

  return (
    <div className="det-prompt-stack">
      {sectionsList.map((s) => {
        const body = s.body !== undefined ? s.body : ORIGINAL_BODIES[s.key] || "";
        const showCopied = copiedKey === s.key;
        return (
          <div key={s.key} className="dpe-block dpe-block--locked">
            <div className="dpe-head">
              {s.title ?
              <span className="dpe-title">{s.title}</span> :

              <span className="dpe-title" style={{ flex: 1 }} aria-hidden="true" />
              }
              <div className="dpe-head-actions">
                {s.copyable &&
                <button type="button"
                className={"dpe-copy-btn" + (showCopied ? " is-done" : "")}
                title={showCopied ? "Copied" : "Copy prompt body"}
                aria-label={showCopied ? "Copied to clipboard" : "Copy prompt body"}
                onClick={() => onCopySection(s.key, body)}>
                    {showCopied ?
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg> :

                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M8 4.5v12A1.5 1.5 0 009.5 18H18a1.5 1.5 0 001.5-1.5V6A1.5 1.5 0 0018 4.5H8z" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M6 7.5H5A1.5 1.5 0 003.5 9v10.5A1.5 1.5 0 005 21h9a1.5 1.5 0 001.5-1.5V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                  }
                  </button>
                }
                <span className="dpe-lock" aria-label="Locked">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M3 5V3.5a2.5 2.5 0 1 1 5 0V5M2.5 5h6v4.5h-6z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/></svg>
                </span>
              </div>
            </div>
            <pre className="dpe-body" tabIndex={-1}>{body}</pre>
          </div>);

      })}
    </div>);

}

function DetailPage({ id, showImprove, showAction }) {
  const [isImproveOpen, setIsImproveOpen] = React.useState(Boolean(showImprove));
  const [improveRequest, setImproveRequest] = React.useState(`The image_description field is too vague. Push the AI to include the
object type, condition, and any visible text or markings. Also, can we
add a confidence level field to the JSON output?`);
  const p = findLibraryPrompt(id) || FALLBACK_PROMPT_DETAIL;
  const account = PROMPTS_BUILDER_ACCOUNTS.find((a) => a.id === p.accountId);
  const accountLabel = account ? account.label : "All accounts";
  const customPromptBody = String(p.id).startsWith("custom_") || p.isFallback ? (p.promptBody || p.what) : p.promptBody;
  const isCustomPrompt = String(p.id).startsWith("custom_");
  const detailPath = showAction ? "/created/" + p.id : "/detail/" + p.id;
  const closeImproveModal = () => {
    setIsImproveOpen(false);
    go(detailPath);
  };

  React.useEffect(() => {
    setIsImproveOpen(Boolean(showImprove));
  }, [showImprove, id]);

  if (showAction && (isCustomPrompt || p.isFallback)) {
    const body = customPromptBody || buildDefaultPromptBodyForCreateModal();
    return (
      <AppShell secondaryNav={<SecondaryNav current="library" />}>
        <button type="button" className="det-back" onClick={() => go("/library")}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back to Library
        </button>

        <div className="det-head">
          <div className="det-head-left">
            <div className="det-cat">{p.cat}</div>
            <div className="det-name-row">
              <h1 className="det-name">{p.title}</h1>
              <span className="det-info" title={p.desc}>i</span>
            </div>
            <p className="det-account">{accountLabel}</p>
          </div>
        </div>

        <div className="det-bar">
          <span className="det-ver">
            Version {p.ver || "v1"} <span className="muted">(latest)</span>
            <span className="det-ver-dot"></span>
          </span>
          <div className="det-bar-actions">
            <button type="button" className="btn btn--outline btn--pill"
            onClick={() => go("/improve/" + p.id)}>
              Improve Prompt with AI
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5L8 4.5L11 5.5L8 6.5L7 9.5L6 6.5L3 5.5L6 4.5L7 1.5Z" fill="currentColor"/><path d="M11 9L11.5 10.5L13 11L11.5 11.5L11 13L10.5 11.5L9 11L10.5 10.5L11 9Z" fill="currentColor"/></svg>
            </button>
            <button type="button" className="btn btn--outline btn--pill">
              Test Prompt
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 2H2.5C2 2 1.5 2.4 1.5 3V10.5C1.5 11 2 11.5 2.5 11.5H10C10.6 11.5 11 11 11 10.5V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M8 1.5H11.5V5M11.5 1.5L6.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        <div className="det-section">
          <div className="codeblock-wrap">
            <div className="codeblock-actions">
              <button type="button" className="codeblock-icon" aria-label="Copy prompt">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M8 4.5v12A1.5 1.5 0 009.5 18H18a1.5 1.5 0 001.5-1.5V6A1.5 1.5 0 0018 4.5H8z" stroke="currentColor" strokeWidth="1.5" /><path d="M6 7.5H5A1.5 1.5 0 003.5 9v10.5A1.5 1.5 0 005 21h9a1.5 1.5 0 001.5-1.5V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
              <button type="button" className="codeblock-icon" aria-label="Expand prompt">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4.5 2H2V4.5M8.5 2H11V4.5M4.5 11H2V8.5M8.5 11H11V8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <pre className="codeblock-light">{body}</pre>
          </div>
        </div>

        <div className="det-footer">
          <button type="button" className="btn btn--dark btn--bar" onClick={() => go("/library")}>Discard</button>
          <button type="button" className="btn btn--primary btn--bar">Push to Index</button>
        </div>

        {isImproveOpen &&
        <div className="improve-scrim">
          <div className="improve-modal" role="dialog" aria-modal="true" aria-labelledby="improve-prompt-title">
            <div className="improve-head">
              <h2 id="improve-prompt-title" className="improve-title">Improve Prompt with AI</h2>
              <button type="button" className="improve-close" aria-label="Close"
              onClick={closeImproveModal}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="improve-body">
              <textarea
              className="improve-textarea"
              value={improveRequest}
              onChange={(e) => setImproveRequest(e.target.value)}
              placeholder="Describe how you'd like to improve this prompt..."
              />
            </div>
            <div className="improve-foot">
              <button type="button" className="btn btn--dark btn--bar"
              onClick={closeImproveModal}>Cancel</button>
              <button type="button" className="btn btn--primary btn--bar"
              onClick={closeImproveModal}>Improve</button>
            </div>
          </div>
        </div>
        }
      </AppShell>);
  }

  const detailCards = [
  {
    label: "What it does",
    value: isCustomPrompt ? p.desc || "Defines a custom prompt for the selected account." : p.what
  },
  {
    label: "Where it's used",
    value: isCustomPrompt ? p.where || "Used on " + accountLabel + "." : p.where
  },
  {
    label: "Impact on search",
    value: isCustomPrompt ?
    p.impact || "Helps tailor search behavior to the account's catalogue and terminology." :
    p.impact
  }];

  return (
    <AppShell secondaryNav={<SecondaryNav current="library" />}>
      <button type="button" className="det-back" onClick={() => go("/library")}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Back to Library
      </button>

      <div className="det-head">
        <div className="det-head-left">
          <div className="det-cat">{p.cat}</div>
          <div className="det-name-row">
            <h1 className="det-name">{p.title}</h1>
          </div>
          <p className="det-account">{p.desc}</p>
        </div>
        <div className="det-actions">
          <button type="button" className="btn btn--primary"
          onClick={() => go("/builder/" + p.id)}>Create Customer Prompt</button>
        </div>
      </div>

      <div className="det-bar">
        <div className="det-bar-meta">
          <span className="item">Updated {p.date}</span>
          <span className="sep"></span>
          <span className="item">Read-only reference</span>
        </div>
      </div>

      <div className="det-meta-grid">
        {detailCards.map((card) =>
        <div key={card.label} className="det-meta-card">
          <div className="det-meta-h">{card.label}</div>
          <p>{card.value}</p>
        </div>
        )}
      </div>

      <div className="det-section">
        <div className="det-section-head">
          <span className="det-section-title">Prompt body</span>
          <span className="det-section-hint">Read-only reference. Use Create Customer Prompt to add customer context, terminology, and examples.</span>
        </div>
        <DetailPromptEditor promptBody={customPromptBody} />
      </div>
    </AppShell>);

}

// ──────────────────────────────
// Prompt Builder — split-view editor
// ──────────────────────────────
const SECTIONS = [
{ key: "TASK", title: "Task", locked: true, editable: false },
{ key: "CUSTOMER_CONTEXT", title: "Customer Context", locked: false, editable: true,
  placeholder: "MechaTech sells industrial pumps and replacement parts to maintenance teams across DACH. Customers usually upload phone photos of nameplates and ask for the matching spare part.",
  default: "" },
{ key: "TERMINOLOGY", title: "Domain Terminology", locked: false, editable: true,
  placeholder: "MX-2400 = our flagship hydraulic pump series\nHSK = Hydraulic Service Kit\nViton = high-temperature elastomer used for seal variants",
  default: "" },
{ key: "EXAMPLES", title: "Examples", locked: false, editable: true,
  placeholder: "Input: \"shaft seal for MX-2400\"\nExpected: MX-2400-SEAL-04, MX-2400-SEAL-04A, PMP-HSK-MX2400\n\nInput: \"black 12V industrial pump\"\nExpected: PMP-12V-CMP, PMP-12V-IND",
  default: "" },
{ key: "STEPS", title: "Steps", locked: true, editable: false },
{ key: "OUTPUT_FORMAT", title: "Output Format (JSON Schema)", locked: true, editable: false },
{ key: "CONSTRAINTS", title: "Constraints", locked: true, editable: false }];


const ORIGINAL_BODIES = {
  TASK: `You are given an input from the user. Follow the steps below to produce
a structured response.`,
  STEPS: `1. Normalize the user query and detect language.
2. Compute the dense vector representation of the query.
3. Run a kNN search against the product index for top 200 candidates.
4. In parallel, run a BM25 keyword search over the same index.
5. Merge candidate sets using reciprocal-rank fusion (alpha=0.6, beta=0.4).
6. Apply the configured smart filters before final ranking.
7. Return the top N hits as JSON matching the schema below.`,
  CUSTOMER_CONTEXT: `{{ Add customer-specific context — domain, typical users,
   surface where the prompt runs. }}`,
  TERMINOLOGY: `{{ Add domain-specific terms, abbreviations, and how they
   should be interpreted. }}`,
  EXAMPLES: `{{ Add a few canonical query → expected result pairs from
   real customer traffic. }}`,
  OUTPUT_FORMAT: `{
  "query_intent": "<string>",
  "results": [
    {
      "id":      "<string>",
      "score":   <number 0..1>,
      "matched": ["<string>", ...]
    }
  ]
}`,
  CONSTRAINTS: `- The response must be valid JSON.
- Scores must be normalized to the [0, 1] interval.
- Never include products that fail the smart-filter step.`
};

function buildDetailViewPromptBody() {
  return [ORIGINAL_BODIES.TASK, ORIGINAL_BODIES.STEPS, ORIGINAL_BODIES.CONSTRAINTS].
  filter(Boolean).
  join("\n\n");
}

/** Default “Prompt body” for the Create Customer Prompt modal (TASK / STEPS / CONSTRAINTS). */
function buildDefaultPromptBodyForCreateModal() {
  return `**TASK**: Combine semantic embeddings with keyword retrieval to produce a balanced ranked list of products.

STEPS:
${ORIGINAL_BODIES.STEPS}

CONSTRAINTS:
${ORIGINAL_BODIES.CONSTRAINTS}`;
}

const PROMPTS_BUILDER_ACCOUNTS = [
{ id: "mechatech", label: "MechaTech / mechatech_solutions_testing" },
{ id: "acme", label: "Acme Industries / acme_main" },
{ id: "northbay", label: "NorthBay Tools / northbay_prod" }];

function newDraftId() {
  return "d_" + Math.random().toString(36).slice(2, 9);
}

function BuilderPage({ id }) {
  const template = findLibraryPrompt(id);
  if (!template) return <NotFound back="/library" />;
  return (
    <CustomerPromptWizard
      initialBaseId={id}
      initialStep={1}
      cancelPath="/library"
    />
  );
}


function formatRelative(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return Math.floor(diff / 60) + " min ago";
  if (diff < 86400) return Math.floor(diff / 3600) + " hr ago";
  return d.toLocaleDateString();
}

function NotFound({ back }) {
  return (
    <AppShell>
      <div className="empty">
        <h2 className="empty-h">Prompt not found</h2>
        <p className="empty-p">The prompt you were looking for doesn't exist or was removed.</p>
        <button type="button" className="btn btn--primary"
        style={{ flex: "0 0 auto", minWidth: 180 }}
        onClick={() => go(back || "/library")}>Back to library</button>
      </div>
    </AppShell>);

}

// ──────────────────────────────
// Root
// ──────────────────────────────
function PromptApp() {
  const { route, arg } = useRoute();
  if (route === "library") return <LibraryPage />;
  if (route === "request") return <RequestPromptPage />;
  if (route === "detail") return <DetailPage id={arg} />;
  if (route === "created") return <DetailPage id={arg} showAction />;
  if (route === "improve") return <DetailPage id={arg} showAction showImprove />;
  if (route === "builder") return <BuilderPage key={arg || "new"} id={arg} />;
  if (route === "compare") return <ComparePage id={arg} />;
  if (route === "sandbox") return <SandboxPage id={arg} />;
  if (route === "history") return <HistoryPage id={arg} />;
  if (route === "review") return <ReviewPage id={arg} />;
  return <LibraryPage />;
}

window.PromptApp = PromptApp;
window.buildDefaultPromptBodyForCreateModal = buildDefaultPromptBodyForCreateModal;