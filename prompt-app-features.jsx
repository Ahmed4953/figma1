/* eslint-disable */
// Additional feature screens for Prompt Builder Tool:
// Compare View, Test Sandbox, Version History, Review screen, Export Modal.

function findDraft(id) {
  return loadDrafts().find(d => d.id === id);
}

// ──────────────────────────────
// Compare View
// ──────────────────────────────
function ComparePage({ id }) {
  const draft = findDraft(id);
  if (!draft) return <NotFound back="/library" />;
  const template = PROMPTS.find(x => x.id === draft.templateId);

  const refFullBody =
    typeof window.buildDefaultPromptBodyForCreateModal === "function"
      ? window.buildDefaultPromptBodyForCreateModal()
      : "";

  const editable = SECTIONS.filter(s => s.editable);
  const sectionDiffs = editable.map(s => {
    const left  = ORIGINAL_BODIES[s.key] || "";
    const right = (draft.values && draft.values[s.key]) || "";
    const ops = diffTokens(left, right);
    return { s, left, right, ops, stats: diffStats(ops) };
  });
  const totals = sectionDiffs.reduce(
    (acc, d) => ({ added: acc.added + d.stats.added, removed: acc.removed + d.stats.removed, changed: acc.changed + (d.stats.added + d.stats.removed > 0 ? 1 : 0) }),
    { added: 0, removed: 0, changed: 0 }
  );

  const promptBodyOps =
    draft.promptBody != null && String(draft.promptBody).trim() !== ""
      ? diffTokens(refFullBody, draft.promptBody)
      : null;
  const promptBodyStats = promptBodyOps ? diffStats(promptBodyOps) : null;

  return (
    <AppShell secondaryNav={<SecondaryNav current="drafts" />}>
      <button type="button" className="det-back" onClick={() => go("/builder/" + draft.templateId)}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back to Builder
      </button>

      <div className="det-head">
        <div className="det-head-left">
          <div className="det-cat">Compare · {template ? template.cat : ""}</div>
          <div className="det-name-row" style={{gap: 14}}>
            <h1 className="det-name">Compare with original</h1>
            <StatusBadge status={draft.status || "draft"} />
          </div>
          <p className="det-account">
            {draft.customerName} · based on {template ? template.title : draft.templateTitle}
          </p>
        </div>
        <div className="det-actions">
          {(draft.status === "review" || draft.status === "draft") && (
            <button type="button" className="btn btn--primary"
                    onClick={() => go("/review/" + draft.id)}>Approve</button>
          )}
        </div>
      </div>

      <div className="cmp-summary">
        <div className="cmp-summary-item">
          <span className="cmp-num">{totals.changed}</span>
          <span className="cmp-lab">sections changed</span>
        </div>
        <div className="cmp-summary-item cmp-summary-add">
          <span className="cmp-num">+{totals.added}</span>
          <span className="cmp-lab">tokens added</span>
        </div>
        <div className="cmp-summary-item cmp-summary-rem">
          <span className="cmp-num">−{totals.removed}</span>
          <span className="cmp-lab">tokens removed</span>
        </div>
        <div className="cmp-summary-spacer"></div>
        <div className="cmp-legend">
          <span className="cmp-legend-chip"><span className="diff-add">added</span></span>
          <span className="cmp-legend-chip"><span className="diff-del">removed</span></span>
        </div>
      </div>

      <div className="cmp-grid">
        <div className="cmp-col-head">
          <span className="builder-col-eyebrow">Original</span>
          <span className="builder-col-title">{template ? template.title : draft.templateTitle}</span>
        </div>
        <div className="cmp-col-head">
          <span className="builder-col-eyebrow">{draft.customerName}'s prompt</span>
          <span className="builder-col-title">Customer version</span>
        </div>

        {promptBodyOps &&
        <React.Fragment key="prompt-body-compare">
            <div className="cmp-block cmp-block--left">
              <div className="cmp-block-head">
                <span className="bblock-num">Prompt body (template default)</span>
                {(promptBodyStats.added + promptBodyStats.removed) === 0
                ? <span className="cmp-tag cmp-tag--same">No changes</span>
                : <span className="cmp-tag cmp-tag--diff">{promptBodyStats.added}+ / {promptBodyStats.removed}−</span>}
              </div>
              <pre className="cmp-body">{renderDiff(promptBodyOps, "left")}</pre>
            </div>
            <div className="cmp-block cmp-block--right">
              <div className="cmp-block-head">
                <span className="bblock-num">Prompt body (your version)</span>
                <span className="bblock-badge is-edit">Edited</span>
              </div>
              <pre className="cmp-body">{renderDiff(promptBodyOps, "right")}</pre>
            </div>
          </React.Fragment>
        }

        {sectionDiffs.map(({ s, ops, stats }) => (
          <React.Fragment key={s.key}>
            <div className="cmp-block cmp-block--left">
              <div className="cmp-block-head">
                <span className="bblock-num">{s.title}</span>
                {(stats.added + stats.removed) === 0
                  ? <span className="cmp-tag cmp-tag--same">No changes</span>
                  : <span className="cmp-tag cmp-tag--diff">{stats.added}+ / {stats.removed}−</span>}
              </div>
              <pre className="cmp-body">{renderDiff(ops, "left")}</pre>
            </div>
            <div className="cmp-block cmp-block--right">
              <div className="cmp-block-head">
                <span className="bblock-num">{s.title}</span>
                <span className="bblock-badge is-edit">Editable</span>
              </div>
              <pre className="cmp-body">{renderDiff(ops, "right")}</pre>
            </div>
          </React.Fragment>
        ))}
      </div>
    </AppShell>
  );
}

// ──────────────────────────────
// Test Sandbox
// ──────────────────────────────
function SandboxPage({ id }) {
  const draft = findDraft(id);
  const [hasInput, setHasInput] = React.useState(false);
  const [query, setQuery] = React.useState("hydraulic pump shaft seal MX-2400");
  const [state, setState] = React.useState("idle"); // idle | running | success | warn | error
  const [latency, setLatency] = React.useState(null);
  const [tokens, setTokens] = React.useState(null);

  if (!draft) return <NotFound back="/library" />;

  const run = () => {
    setState("running");
    setLatency(null); setTokens(null);
    const ms = 800 + Math.random() * 700;
    setTimeout(() => {
      setLatency(Math.round(ms));
      setTokens(1200 + Math.round(Math.random() * 200));
      // simple heuristic: empty editable sections → warning
      const emptySections = SECTIONS.filter(s => s.editable && !(draft.values && draft.values[s.key])).length;
      const hasPromptBody = draft.promptBody != null && String(draft.promptBody).trim().length > 0;
      const empty = !hasPromptBody && emptySections >= 2;
      setState(empty ? "warn" : "success");
    }, ms);
  };

  const statusInfo = {
    idle:    { label: "Ready",   tone: "neutral" },
    running: { label: "Running…", tone: "neutral" },
    success: { label: "Success",  tone: "ok"  },
    warn:    { label: "Warning",  tone: "warn" },
    error:   { label: "Error",    tone: "err" },
  }[state];

  const response = state === "success" || state === "warn" ? `{
  "query_intent": "spare_part_identification",
  "results": [
    {
      "id": "MX-2400-SEAL-04",
      "title": "MX-2400 Hydraulic Pump — Shaft Seal Kit",
      "score": 0.94,
      "matched": ["title", "mx2400", "shaft_seal"]
    },
    {
      "id": "MX-2400-SEAL-04A",
      "title": "MX-2400 Shaft Seal — Viton Variant",
      "score": 0.89,
      "matched": ["title", "shaft_seal"]
    }
  ],
  "filters_applied": ["category=spare_parts", "brand=mechatech"]
}` : null;

  return (
    <AppShell secondaryNav={<SecondaryNav current="drafts" />}>
      <button type="button" className="det-back" onClick={() => go("/builder/" + draft.templateId)}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back to Builder
      </button>

      <div className="det-head">
        <div className="det-head-left">
          <div className="det-cat">Test Sandbox · {draft.templateCategory}</div>
          <div className="det-name-row" style={{gap: 14}}>
            <h1 className="det-name">Test {draft.customerName}'s prompt</h1>
            <StatusBadge status={draft.status || "draft"} />
          </div>
          <p className="det-account">Run this customer prompt against a sample input. Nothing here gets pushed to production.</p>
        </div>
        <div className="det-actions">
          <button type="button" className="btn btn--outline" onClick={() => { setState("idle"); setHasInput(false); }}>Reset</button>
          <button type="button" className="btn btn--primary"
                  onClick={run} disabled={state === "running"}>
            {state === "running" ? "Running…" : (<><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4 3L10 6.5L4 10V3Z" fill="currentColor"/></svg>Run Test</>)}
          </button>
        </div>
      </div>

      <div className="test-grid">
        <section className="test-card">
          <div className="test-card-head">
            <span className="test-card-title">Input</span>
            <div className="test-tabs">
              <button type="button" className="test-tab is-active">Image</button>
              <button type="button" className="test-tab">Text query</button>
              <button type="button" className="test-tab">cURL</button>
            </div>
          </div>

          <div className={"test-dropzone" + (hasInput ? " has-input" : "")}
               onClick={() => setHasInput(true)}>
            <div className="test-dz-thumb">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="3" y="6" width="34" height="28" rx="3" stroke="currentColor" strokeWidth="1.6"/>
                <circle cx="13" cy="16" r="3" fill="currentColor"/>
                <path d="M3 28L13 20L22 27L30 21L37 26" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="test-dz-text">
              <strong>{hasInput ? "pump-shaft-seal.png" : "Drop an image here"}</strong>
              <span>{hasInput ? "1.2 MB · 2048×1536 · click to replace" : <>or <span className="test-link">browse files</span> · PNG, JPG, up to 10 MB</>}</span>
            </div>
          </div>

          <div className="field">
            <label className="field-label">Query (optional)</label>
            <input className="field-input" type="text"
                   value={query} onChange={e => setQuery(e.target.value)} />
          </div>

          <div className="test-row">
            <div className="field" style={{flex: 1}}>
              <label className="field-label">Index</label>
              <select className="field-select" defaultValue="mechatech">
                <option value="mechatech">mechatech_solutions_testing</option>
                <option value="staging">mechatech_solutions_staging</option>
              </select>
            </div>
            <div className="field" style={{flex: 1}}>
              <label className="field-label">Top K</label>
              <select className="field-select" defaultValue="10">
                <option>5</option><option>10</option><option>25</option>
              </select>
            </div>
          </div>
        </section>

        <section className="test-card">
          <div className="test-card-head">
            <span className="test-card-title">Response</span>
            <div className="test-meta">
              <span className={"test-pill test-pill--" + (statusInfo.tone === "ok" ? "ok" : statusInfo.tone === "warn" ? "warn" : statusInfo.tone === "err" ? "err" : "neutral")}>
                <span className="test-dot"></span> {statusInfo.label}
              </span>
              {latency !== null && <span className="test-meta-item">{latency} ms</span>}
              {tokens !== null && <><span className="test-meta-sep"></span><span className="test-meta-item">{tokens.toLocaleString()} tokens</span></>}
            </div>
          </div>

          {state === "running" && (
            <div className="sandbox-loading">
              <div className="improving-spinner"></div>
              <div className="improving-label">Running prompt…</div>
            </div>
          )}

          {state === "idle" && (
            <div className="sandbox-empty">
              <div className="sandbox-empty-art">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                  <rect x="6" y="10" width="44" height="36" rx="6" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M16 22h24M16 28h18M16 34h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="sandbox-empty-text">
                <strong>Run a test to see the response here</strong>
                <span>The customer prompt will be executed against the input above.</span>
              </div>
            </div>
          )}

          {response && <pre className="test-response">{response}</pre>}

          {state === "warn" && (
            <div className="docs-callout docs-callout--warn" style={{marginTop: 0}}>
              <div className="docs-callout-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2L13 12H1L7 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M7 6V8.5M7 10V10.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              </div>
              <div>
                <strong>Customer context is sparse.</strong> Add domain terminology and examples
                to the customer sections — the response above used generic defaults.
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

// ──────────────────────────────
// Version History
// ──────────────────────────────
function HistoryPage({ id }) {
  const draft = findDraft(id);
  const { upsert } = useDrafts();
  const [pickA, setPickA] = React.useState(null);
  const [pickB, setPickB] = React.useState(null);
  const [showCmp, setShowCmp] = React.useState(false);

  if (!draft) return <NotFound back="/library" />;
  const versions = draft.versions || [];

  const restore = (v) => {
    if (!confirm("Restore this version? Your current values will be replaced.")) return;
    const now = new Date().toISOString();
    const next = {
      ...draft,
      values: { ...v.values },
      ...(v.promptBody !== undefined ? { promptBody: v.promptBody } : {}),
      ...(v.promptDescription !== undefined ? { promptDescription: v.promptDescription } : {}),
      ...(v.accountId !== undefined ? { accountId: v.accountId } : {}),
      updatedAt: now,
      versions: [
        { n: versions.length + 1, at: now, by: "You",
          note: "Restored from v" + v.n, values: { ...v.values },
          ...(v.promptBody !== undefined ? { promptBody: v.promptBody } : {}),
          ...(v.promptDescription !== undefined ? { promptDescription: v.promptDescription } : {}),
          ...(v.accountId !== undefined ? { accountId: v.accountId } : {}),
          status: draft.status },
        ...versions,
      ],
    };
    upsert(next);
    go("/builder/" + draft.templateId);
  };

  const a = versions.find(v => v.n === pickA);
  const b = versions.find(v => v.n === pickB);

  return (
    <AppShell secondaryNav={<SecondaryNav current="drafts" />}>
      <button type="button" className="det-back" onClick={() => go("/builder/" + draft.templateId)}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back to Builder
      </button>

      <div className="det-head">
        <div className="det-head-left">
          <div className="det-cat">Version History · {draft.templateCategory}</div>
          <div className="det-name-row" style={{gap: 14}}>
            <h1 className="det-name">{draft.customerName}</h1>
            <StatusBadge status={draft.status || "draft"} />
          </div>
          <p className="det-account">Every save creates a version. Restore an earlier one or compare any two side-by-side.</p>
        </div>
        <div className="det-actions">
          <button type="button" className="btn btn--outline"
                  disabled={!a || !b || pickA === pickB}
                  onClick={() => setShowCmp(true)}>
            Compare selected
          </button>
        </div>
      </div>

      <ol className="vh-list">
        {versions.map((v, i) => {
          const isLatest = i === 0;
          return (
            <li key={v.n} className={"vh-item" + (isLatest ? " is-latest" : "")}>
              <div className="vh-rail">
                <span className="vh-dot"></span>
                {i < versions.length - 1 && <span className="vh-line"></span>}
              </div>
              <div className="vh-card">
                <div className="vh-head">
                  <span className="vh-version">v{v.n}{isLatest ? " · latest" : ""}</span>
                  <StatusBadge status={v.status || "draft"} size="sm" />
                  <span className="vh-meta">{formatRelative(v.at)} · {v.by}</span>
                </div>
                <p className="vh-note">{v.note}</p>
                <div className="vh-foot">
                  <label className="vh-pick">
                    <input type="radio" name="vh-a" checked={pickA === v.n}
                           onChange={() => setPickA(v.n)} />
                    A
                  </label>
                  <label className="vh-pick">
                    <input type="radio" name="vh-b" checked={pickB === v.n}
                           onChange={() => setPickB(v.n)} />
                    B
                  </label>
                  <button type="button" className="btn btn--outline btn--sm"
                          style={{flex: "0 0 auto", marginLeft: "auto"}}
                          disabled={isLatest}
                          onClick={() => restore(v)}>Restore</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {showCmp && a && b && (
        <VersionDiffModal a={a} b={b} onClose={() => setShowCmp(false)} />
      )}
    </AppShell>
  );
}

function VersionDiffModal({ a, b, onClose }) {
  const editable = SECTIONS.filter(s => s.editable);
  return (
    <div className="modal-scrim" style={{position: "fixed", inset: 0, borderRadius: 0, zIndex: 50}}>
      <div className="modal" style={{width: 980, maxHeight: "82vh", overflow: "auto"}}>
        <div className="modal-head">
          <div>
            <h2 className="modal-title">Compare v{a.n} ↔ v{b.n}</h2>
            <p className="modal-sub">{formatRelative(a.at)} · {a.by}  vs.  {formatRelative(b.at)} · {b.by}</p>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: 12}}>
          {editable.map(s => {
            const left  = (a.values && a.values[s.key]) || "";
            const right = (b.values && b.values[s.key]) || "";
            const ops = diffTokens(left, right);
            return (
              <div key={s.key} className="vh-diff-row">
                <div className="bblock-num" style={{marginBottom: 6}}>{s.title}</div>
                <div className="cmp-grid" style={{gap: 10}}>
                  <pre className="cmp-body">{renderDiff(ops, "left")}</pre>
                  <pre className="cmp-body">{renderDiff(ops, "right")}</pre>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────
// Review screen
// ──────────────────────────────
function ReviewPage({ id }) {
  const draft = findDraft(id);
  const { upsert } = useDrafts();
  const [feedback, setFeedback] = React.useState("");

  if (!draft) return <NotFound back="/library" />;
  const editable = SECTIONS.filter(s => s.editable);

  const setStatus = (status, note) => {
    const now = new Date().toISOString();
    const versions = (draft.versions || []).slice();
    versions.unshift({ n: versions.length + 1, at: now, by: "Reviewer",
                       note, values: { ...draft.values },
                       promptBody: draft.promptBody,
                       promptDescription: draft.promptDescription,
                       accountId: draft.accountId,
                       status });
    upsert({ ...draft, status, updatedAt: now, versions });
    go("/library");
  };

  return (
    <AppShell secondaryNav={<SecondaryNav current="library" />}>
      <button type="button" className="det-back" onClick={() => go("/library")}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back to Library
      </button>

      <div className="det-head">
        <div className="det-head-left">
          <div className="det-cat">Review · {draft.templateCategory}</div>
          <div className="det-name-row" style={{gap: 14}}>
            <h1 className="det-name">Review {draft.customerName}</h1>
            <StatusBadge status={draft.status || "draft"} />
          </div>
          <p className="det-account">Approve to mark this prompt ready for promotion to live. Request changes to send it back for edits.</p>
        </div>
        <div className="det-actions">
          <button type="button" className="btn btn--outline"
                  onClick={() => go("/compare/" + draft.id)}>Open Compare view</button>
        </div>
      </div>

      <div className="rev-grid">
        <section>
          <div className="det-section-head">
            <span className="det-section-title">Customer-edited sections</span>
            <span className="det-section-hint">{editable.length} sections</span>
          </div>
          {draft.promptBody &&
          <div className="rev-section" style={{ marginBottom: 16 }}>
              <div className="rev-section-head">
                <span className="bblock-num">Prompt body</span>
                <span className="bblock-badge is-edit">Full text</span>
              </div>
              <pre className="bblock-body">{draft.promptBody}</pre>
            </div>
          }

          {editable.map(s => (
            <div key={s.key} className="rev-section">
              <div className="rev-section-head">
                <span className="bblock-num">{s.title}</span>
                <span className="bblock-badge is-edit">Editable</span>
              </div>
              <pre className="bblock-body">{(draft.values && draft.values[s.key]) || <em style={{opacity:0.6}}>— empty —</em>}</pre>
            </div>
          ))}
        </section>

        <aside className="rev-aside">
          <div className="rev-card">
            <div className="rev-card-h">Decision</div>
            <textarea className="field-textarea"
                      placeholder="Optional reviewer note (visible in version history)"
                      value={feedback} onChange={e => setFeedback(e.target.value)} />
            <div className="rev-actions">
              <button type="button" className="btn btn--outline"
                      onClick={() => setStatus("draft", feedback || "Changes requested")}>
                Request Changes
              </button>
              <button type="button" className="btn btn--primary"
                      onClick={() => setStatus("approved", feedback || "Approved")}>
                Approve
              </button>
            </div>
            {draft.status === "approved" && (
              <button type="button" className="btn btn--dark btn--bar" style={{marginTop: 10}}
                      onClick={() => setStatus("live", "Promoted to live")}>
                Promote to Live
              </button>
            )}
          </div>

          <div className="rev-card">
            <div className="rev-card-h">Customer</div>
            <div className="rev-row"><span>Account</span><strong>{draft.customerName}</strong></div>
            <div className="rev-row"><span>Template</span><strong>{draft.templateTitle}</strong></div>
            <div className="rev-row"><span>Category</span><strong>{draft.templateCategory}</strong></div>
            <div className="rev-row"><span>Last edited</span><strong>{formatRelative(draft.updatedAt)}</strong></div>
            <div className="rev-row"><span>Versions</span><strong>{(draft.versions || []).length}</strong></div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

// ──────────────────────────────
// Export modal
// ──────────────────────────────
function buildPromptText(values) {
  return SECTIONS.map(s => {
    const body = s.editable
      ? (values[s.key] || s.placeholder || "")
      : ORIGINAL_BODIES[s.key];
    return `# ${s.title.toUpperCase()}\n${body}`;
  }).join("\n\n");
}

function buildExportedPromptBody(draft) {
  if (draft.promptBody != null && String(draft.promptBody).trim() !== "") {
    return String(draft.promptBody).trim();
  }
  return buildPromptText(draft.values || {});
}

function ExportModal({ draft, onClose }) {
  const [tab, setTab] = React.useState("json"); // json | text | clipboard
  const [copied, setCopied] = React.useState(false);
  const text = buildExportedPromptBody(draft);
  const json = JSON.stringify({
    customer: draft.customerName,
    template: draft.templateId,
    template_title: draft.templateTitle,
    description: draft.promptDescription ?? "",
    account: draft.accountId ?? "",
    body: text,
    exported_at: new Date().toISOString(),
  }, null, 2);

  const payload = tab === "json" ? json : text;
  const ext     = tab === "json" ? "json" : "md";
  const mime    = tab === "json" ? "application/json" : "text/plain";

  const download = () => {
    const blob = new Blob([payload], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (draft.customerName.replace(/\W+/g, "_") || "customer") + "_" + draft.templateId + "." + ext;
    a.click();
    URL.revokeObjectURL(url);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className="modal-scrim" style={{position: "fixed", inset: 0, borderRadius: 0, zIndex: 50}}>
      <div className="modal export-modal">
        <div className="modal-head">
          <div>
            <h2 className="modal-title">Export prompt</h2>
            <p className="modal-sub">{draft.customerName} · based on {draft.templateTitle}</p>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="export-tabs">
          {[
            { id: "json", label: "JSON" },
            { id: "text", label: "Plain text" },
            { id: "clipboard", label: "Copy to clipboard" },
          ].map(t => (
            <button key={t.id} type="button"
                    className={"export-tab" + (tab === t.id ? " is-active" : "")}
                    onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="export-preview-label">Preview</div>
        <pre className="export-preview">{tab === "json" ? json : text}</pre>

        <div className="export-foot">
          <button type="button" className="btn btn--ghost" style={{flex: "0 0 auto", minWidth: 100}}
                  onClick={onClose}>Cancel</button>
          {tab === "clipboard" ? (
            <button type="button" className="btn btn--primary"
                    style={{flex: "0 0 auto", minWidth: 180}}
                    onClick={copy}>{copied ? "Copied ✓" : "Copy to clipboard"}</button>
          ) : (
            <button type="button" className="btn btn--primary"
                    style={{flex: "0 0 auto", minWidth: 180}}
                    onClick={download}>Download .{ext}</button>
          )}
        </div>
      </div>
    </div>
  );
}

window.ComparePage = ComparePage;
window.SandboxPage = SandboxPage;
window.HistoryPage = HistoryPage;
window.ReviewPage = ReviewPage;
window.ExportModal = ExportModal;
