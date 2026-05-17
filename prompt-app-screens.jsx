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
  const { create } = useLibraryPrompts();
  const [promptName, setPromptName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("hybrid");
  const [accountId, setAccountId] = React.useState("mechatech");
  const [promptBody, setPromptBody] = React.useState(buildDefaultPromptBodyForCreateModal());

  const closeModal = () => go("/library");

  const savePrompt = () => {
    const category = PROMPT_CATEGORIES.find((cat) => cat.id === categoryId) || PROMPT_CATEGORIES[0];
    const now = new Date();
    const title = promptName.trim() || "Untitled prompt";
    const desc = description.trim() || "Custom prompt for the selected account.";

    const id = "custom_" + Math.random().toString(36).slice(2, 9);
    create({
      id,
      cat: category.label,
      catKey: category.id,
      title,
      desc,
      ver: "v1",
      date: now.toLocaleDateString("en", { month: "short", day: "2-digit", year: "numeric" }),
      what: desc,
      where: "Used for " + category.label.toLowerCase() + " workflows on the selected account.",
      impact: "Helps tailor search behavior to the account's catalogue, terminology, and expected result format.",
      promptBody,
      accountId
    });
    go("/detail/" + id);
  };

  return (
    <AppShell secondaryNav={<SecondaryNav current="library" />}>
      <div className="pl-panel" style={{ overflow: "hidden", minHeight: "min(720px, calc(100vh - 100px))" }}>
        <div
          className="create-prompt-backdrop"
          style={{
            filter: "blur(0.8px)",
            opacity: 0.5,
            pointerEvents: "none",
            userSelect: "none"
          }}>
          <h1 className="pl-title">Prompts Library</h1>
          <p className="pl-subtitle">Read-only reference prompts. Select one to view details or create a customer prompt.</p>
          <div className="pl-tabs" aria-hidden="true">
            <span className="pl-tabs-label">Filter by</span>
            <span className="pl-tab is-active">All <span className="count">0</span></span>
            <span className="pl-tab">Hybrid <span className="count">0</span></span>
            <span className="pl-tab">Grounding <span className="count">0</span></span>
            <span className="pl-tab">Filters <span className="count">0</span></span>
          </div>
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
            <p className="empty-p">The reference library is empty right now.</p>
          </div>
        </div>

        <div className="modal-scrim" style={{ position: "absolute", inset: 0, borderRadius: 16, zIndex: 2 }}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="request-prompt-title">
            <div className="modal-head">
              <div>
                <h2 id="request-prompt-title" className="modal-title">Create Prompt</h2>
                <p className="modal-sub">
                  Create the first prompt and choose which category it belongs to.
                </p>
              </div>
              <button className="modal-close" type="button" aria-label="Close" onClick={closeModal}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="request-prompt-name">Prompt name</label>
              <input id="request-prompt-name" className="field-input" type="text"
              placeholder="e.g. MechaTech - Hybrid Search v1"
              value={promptName} onChange={(e) => setPromptName(e.target.value)} />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="request-prompt-desc">Description</label>
              <input id="request-prompt-desc" className="field-input" type="text"
              placeholder="Short summary for your team"
              value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="request-prompt-category">Category</label>
              <select id="request-prompt-category" className="field-select"
              value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {PROMPT_CATEGORIES.map((cat) =>
                <option key={cat.id} value={cat.id}>{cat.label}</option>
                )}
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="request-prompt-account">Account</label>
              <select id="request-prompt-account" className="field-select"
              value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                {PROMPTS_BUILDER_ACCOUNTS.map((a) =>
                <option key={a.id} value={a.id}>{a.label}</option>
                )}
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="request-prompt-body">Prompt body</label>
              <textarea id="request-prompt-body" className="field-textarea field-textarea--prompt-body"
              value={promptBody} onChange={(e) => setPromptBody(e.target.value)} />
            </div>

            <div className="modal-foot">
              <button type="button" className="btn btn--ghost" style={{ flex: "0 0 auto", minWidth: 100 }}
              onClick={closeModal}>Cancel</button>
              <button type="button" className="btn btn--primary" onClick={savePrompt}>Save Prompt</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>);

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

function DetailPage({ id }) {
  const p = findLibraryPrompt(id) || FALLBACK_PROMPT_DETAIL;
  const account = PROMPTS_BUILDER_ACCOUNTS.find((a) => a.id === p.accountId);
  const accountLabel = account ? account.label : "All accounts";
  const customPromptBody = String(p.id).startsWith("custom_") || p.isFallback ? (p.promptBody || p.what) : p.promptBody;
  const isCustomPrompt = String(p.id).startsWith("custom_");
  if (isCustomPrompt || p.isFallback) {
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
            <button type="button" className="btn btn--outline btn--pill">
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
  const { drafts, upsert } = useDrafts();
  const existing = template ?
  drafts.find((d) => d.templateId === id && d.status !== "live") :
  null;
  const defaultBody = React.useMemo(() => buildDefaultPromptBodyForCreateModal(), []);

  const emptyValues = React.useMemo(() => {
    const init = {};
    SECTIONS.forEach((s) => {
      if (s.editable) init[s.key] = "";
    });
    return init;
  }, []);

  const [promptName, setPromptName] = React.useState(
    () => existing?.customerName || (template ? `MechaTech — ${template.title} v1` : ""));

  const [description, setDescription] = React.useState(
    () => existing?.promptDescription ?? "Tuned for spare parts catalogue with extended attribute filters.");

  const [accountId, setAccountId] = React.useState(() => existing?.accountId ?? "mechatech");
  const [promptBody, setPromptBody] = React.useState(() => existing?.promptBody ?? defaultBody);
  const [values] = React.useState(() =>
  existing?.values ? { ...emptyValues, ...existing.values } : { ...emptyValues });

  const [draftId] = React.useState(existing ? existing.id : newDraftId());
  const [savedAt, setSavedAt] = React.useState(existing ? existing.updatedAt : null);
  const [status] = React.useState(existing ? existing.status || "draft" : "draft");
  const [copiedPrompt, setCopiedPrompt] = React.useState(false);
  const copiedTimerRef = React.useRef(null);

  const closeModal = () => go("/library");

  const onCopyPromptBody = () => {
    copyTextToClipboard(promptBody).
    then(() => {
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
      setCopiedPrompt(true);
      copiedTimerRef.current = window.setTimeout(() => setCopiedPrompt(false), 2000);
    }).
    catch(() => {
      window.alert("Could not copy to clipboard.");
    });
  };

  React.useEffect(() => () => {
    if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
  }, []);

  if (!template) return <NotFound back="/library" />;

  const persist = (overrides = {}) => {
    const now = new Date().toISOString();
    const prev = loadDrafts().find((d) => d.id === draftId);
    const named = promptName.trim() || "Untitled prompt";
    const account = PROMPTS_BUILDER_ACCOUNTS.find((a) => a.id === accountId);
    const customPromptId = "custom_" + draftId;
    const dataChanged =
    !prev ||
    (prev.promptBody || "") !== promptBody ||
    (prev.promptDescription || "") !== description ||
    (prev.accountId || "") !== accountId ||
    (prev.customerName || "") !== named;
    const versions = prev && prev.versions ? prev.versions.slice() : [];
    if (!prev || dataChanged || overrides.forceVersion) {
      versions.unshift({
        n: versions.length + 1,
        at: now,
        by: "You",
        note: overrides.note || (prev ? "Updated prompt" : "Created from " + template.title),
        values: { ...values },
        promptBody,
        promptDescription: description,
        accountId,
        status: overrides.status || status
      });
    }
    const next = {
      id: draftId,
      templateId: template.id,
      templateTitle: template.title,
      templateCategory: template.cat,
      templateVersion: template.ver,
      customerName: named,
      promptDescription: description,
      accountId,
      promptBody,
      values,
      status: overrides.status || status,
      updatedAt: now,
      versions
    };
    upsert(next);
    upsertCustomPrompt({
      id: customPromptId,
      cat: template.cat,
      catKey: template.catKey,
      title: named,
      desc: description,
      ver: template.ver || "v1",
      date: new Date(now).toLocaleDateString("en", { month: "short", day: "2-digit", year: "numeric" }),
      what: description,
      where: "Used for " + template.cat.toLowerCase() + " workflows on " + (account ? account.label : "the selected account") + ".",
      impact: "Helps tailor search behavior to the account's catalogue, terminology, and expected result format.",
      promptBody,
      accountId
    });
    setSavedAt(now);
    go("/detail/" + customPromptId);
  };

  return (
    <AppShell secondaryNav={<SecondaryNav current="library" />}>
      <div className="pl-panel" style={{ overflow: "hidden", minHeight: "min(720px, calc(100vh - 100px))" }}>
        <div
          className="create-prompt-backdrop"
          style={{
            filter: "blur(0.8px)",
            opacity: 0.5,
            pointerEvents: "none",
            userSelect: "none"
          }}>
          <h1 className="pl-title">Prompts Library</h1>
          <p className="pl-subtitle">Read-only reference prompts. Select one to view details or create a customer prompt.</p>
          <div className="pl-tabs" aria-hidden="true">
            <span className="pl-tabs-label">Filter by</span>
            <span className="pl-tab is-active">All <span className="count">{PROMPTS.length}</span></span>
          </div>
          <div className="pl-grid">
            {PROMPTS.slice(0, 3).map((p) =>
            <LibraryCard key={p.id} p={p} />
            )}
          </div>
        </div>

        <div className="modal-scrim" style={{ position: "absolute", inset: 0, borderRadius: 16, zIndex: 2 }}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="create-prompt-title">
            <div className="modal-head">
              <div>
                <h2 id="create-prompt-title" className="modal-title">Create Customer Prompt</h2>
                <p className="modal-sub">
                  Customise the template for a specific account. Edits stay scoped to that account.
                </p>
              </div>
              <button className="modal-close" type="button" aria-label="Close" onClick={closeModal}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>

            <div className="modal-tmpl">
              <span className="badge">Template</span>
              <span>{template.title} · {template.ver}</span>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="prompt-name">Prompt name</label>
              <input id="prompt-name" className="field-input" type="text"
              placeholder={"e.g. MechaTech — " + template.title + " v1"}
              value={promptName} onChange={(e) => setPromptName(e.target.value)} />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="prompt-desc">Description</label>
              <input id="prompt-desc" className="field-input" type="text"
              placeholder="Short summary for your team"
              value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="prompt-account">Account</label>
              <select id="prompt-account" className="field-select"
              value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                {PROMPTS_BUILDER_ACCOUNTS.map((a) =>
                <option key={a.id} value={a.id}>{a.label}</option>
                )}
              </select>
            </div>

            <div className="field">
              <div className="field-label-row">
                <label className="field-label" htmlFor="prompt-body">Prompt body</label>
                <button type="button"
                className={"dpe-copy-btn" + (copiedPrompt ? " is-done" : "")}
                title={copiedPrompt ? "Copied" : "Copy prompt body"}
                aria-label={copiedPrompt ? "Copied" : "Copy prompt body"}
                onClick={onCopyPromptBody}>
                  {copiedPrompt ?
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg> :

                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M8 4.5v12A1.5 1.5 0 009.5 18H18a1.5 1.5 0 001.5-1.5V6A1.5 1.5 0 0018 4.5H8z" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M6 7.5H5A1.5 1.5 0 003.5 9v10.5A1.5 1.5 0 005 21h9a1.5 1.5 0 001.5-1.5V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  }
                </button>
              </div>
              <textarea id="prompt-body" className="field-textarea field-textarea--prompt-body"
              value={promptBody} onChange={(e) => setPromptBody(e.target.value)} />
            </div>

            {savedAt &&
            <div className="create-prompt-saved" style={{ fontSize: 13, color: "var(--text-3)" }}>
                <span className="builder-saved-dot" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }} />
                Saved · {new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            }

            <div className="modal-foot">
              <button type="button" className="btn btn--ghost" style={{ flex: "0 0 auto", minWidth: 100 }}
              onClick={closeModal}>Cancel</button>
              <button type="button" className="btn btn--primary" onClick={() => persist()}>Save Prompt</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>);

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
  if (route === "builder") return <BuilderPage key={arg || "new"} id={arg} />;
  if (route === "compare") return <ComparePage id={arg} />;
  if (route === "sandbox") return <SandboxPage id={arg} />;
  if (route === "history") return <HistoryPage id={arg} />;
  if (route === "review") return <ReviewPage id={arg} />;
  return <LibraryPage />;
}

window.PromptApp = PromptApp;
window.buildDefaultPromptBodyForCreateModal = buildDefaultPromptBodyForCreateModal;