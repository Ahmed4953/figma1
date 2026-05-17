/* eslint-disable */
// Five inside-view screens for Prompts Library.
// Each is a self-contained component. Shared chrome from portal-chrome.jsx.

// -------- Sample data --------
const PROMPTS = [
  { cat: "Hybrid Search", catKey: "hybrid", title: "Hybrid Search", desc: "Combines vector similarity with keyword matching to balance semantic understanding with precise term recall across product catalogues.", ver: "v2.4", date: "Apr 18" },
  { cat: "Hybrid Search", catKey: "hybrid", title: "Visual + Text Matching", desc: "Blends image embeddings with extracted OCR tokens to find products when the user provides a photo with partial text overlays.", ver: "v1.7", date: "Mar 02" },
  { cat: "Hybrid Search", catKey: "hybrid", title: "Multimodal Reranking", desc: "Re-scores an initial candidate set using a cross-encoder that jointly considers image features, attribute metadata and query intent.", ver: "v3.1", date: "May 04" },
  { cat: "Grounding", catKey: "grounding", title: "Internet Search Identification", desc: "Detects when a user request needs fresh web context, formulates a targeted search query and returns grounded source URLs alongside the answer.", ver: "v2.0", date: "Apr 29" },
  { cat: "Grounding", catKey: "grounding", title: "Knowledge Augmentation", desc: "Pulls supporting passages from a connected knowledge index and injects them into the answer context with inline citations.", ver: "v1.4", date: "Mar 21" },
  { cat: "Grounding", catKey: "grounding", title: "Source Citation Builder", desc: "Assembles citation footnotes from retrieved documents and formats them consistently into the final response payload.", ver: "v1.1", date: "Feb 11" },
  { cat: "Smart Filters", catKey: "filters", title: "Smart Category Filter", desc: "Infers the most likely product category from a free-text query and narrows the candidate set before similarity scoring runs.", ver: "v2.2", date: "Apr 09" },
  { cat: "Smart Filters", catKey: "filters", title: "Attribute-Based Filter", desc: "Extracts structured attributes — color, size, material, brand — from natural language and applies them as exact-match facet filters.", ver: "v1.9", date: "Mar 17" },
  { cat: "Smart Filters", catKey: "filters", title: "Intent Classification", desc: "Routes incoming requests into one of: identification, comparison, support or browsing — so downstream prompts can specialise accordingly.", ver: "v2.6", date: "May 06" },
];

// -------- Card --------
function PCard({ p }) {
  return (
    <article className="pcard">
      <div className="pcard-catrow">
        <span className="pcard-cat">{p.cat}</span>
        <span className="pcard-lock">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 4.5V3a2.5 2.5 0 1 1 5 0v1.5M2 4.5h6v4H2z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/></svg>
          Read-only
        </span>
      </div>
      <h3 className="pcard-title">{p.title}</h3>
      <p className="pcard-desc">{p.desc}</p>
      <div className="pcard-meta">
        <span className="ver"><span className="ver-dot"></span>{p.ver} · latest</span>
        <span className="dotsep"></span>
        <span>Updated {p.date}</span>
      </div>
      <div className="pcard-actions">
        <button type="button" className="btn btn--outline">View Details</button>
        <button type="button" className="btn btn--primary">Create Customer Prompt</button>
      </div>
    </article>
  );
}

// -------- Screen 1: Detail View --------
function DetailScreen() {
  const promptText = `**TASK**: Combine semantic embeddings with keyword retrieval to produce a
balanced ranked list of products.

STEPS:
1. Normalize the user query and detect language.
2. Compute the dense vector representation of the query using the
   configured embedding model.
3. Run a kNN search against the product index, retrieving the top
   200 candidates by cosine similarity.
4. In parallel, run a BM25 keyword search over the same index using
   the original (non-normalized) query.
5. Merge candidate sets using reciprocal-rank fusion with weights
   alpha=0.6 (dense) and beta=0.4 (sparse).
6. Apply the configured smart filters (category, attributes) before
   final ranking.
7. Return the top N hits as a JSON array with id, score and matched
   fields.

CONSTRAINTS:
- The response must be valid JSON.
- Scores must be normalized to the [0, 1] interval.
- Never include products that fail the smart-filter step.`;

  return (
    <div className="pl">
      <PortalHeader />
      <div className="pl-shell">
        <PortalSidebar active="prompts" />
        <main className="pl-content">
          <div className="pl-panel">
            <button type="button" className="det-back">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back to Library
            </button>

            <div className="det-head">
              <div className="det-head-left">
                <div className="det-cat">Hybrid Search</div>
                <div className="det-name-row">
                  <h1 className="det-name">Hybrid Search</h1>
                  <button className="det-info" type="button" aria-label="About this prompt">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6.2V10M7 4V4.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  </button>
                </div>
                <p className="det-account">MechaTech / mechatech_solutions_testing</p>
              </div>
            </div>

            <div className="det-bar">
              <span className="det-ver">
                Version 2.4 <span className="muted">(latest)</span>
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
                  <button type="button" className="codeblock-icon" aria-label="Copy">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="3" y="3" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/><path d="M5 3V2.2A0.5 0.5 0 0 1 5.5 1.7H9A1.5 1.5 0 0 1 10.5 3.2V8" stroke="currentColor" strokeWidth="1.3"/></svg>
                  </button>
                  <button type="button" className="codeblock-icon" aria-label="Expand">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 5V2.5H5M8 2.5H10.5V5M10.5 8V10.5H8M5 10.5H2.5V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  </button>
                </div>
                <pre className="codeblock-light">{promptText}</pre>
              </div>
            </div>

            <div className="det-footer">
              <button type="button" className="btn btn--dark btn--bar">Discard</button>
              <button type="button" className="btn btn--primary btn--bar">Push to Index</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// -------- Screen 2: Create Customer Prompt Modal --------
function CreateModalScreen() {
  return (
    <div className="pl">
      <PortalHeader />
      <div className="pl-shell">
        <PortalSidebar active="prompts" />
        <main className="pl-content">
          <div className="pl-panel" style={{overflow: "hidden"}}>
            {/* dimmed library backdrop */}
            <div style={{filter: "blur(0.5px)", opacity: 0.5}}>
              <h1 className="pl-title">Prompts Library</h1>
              <p className="pl-subtitle">Read-only reference prompts. Select one to view details or create a customer prompt.</p>
              <div className="pl-tabs">
                <span className="pl-tabs-label">Filter by</span>
                <button type="button" className="pl-tab is-active">All <span className="count">9</span></button>
                <button type="button" className="pl-tab">Hybrid <span className="count">3</span></button>
                <button type="button" className="pl-tab">Grounding <span className="count">3</span></button>
                <button type="button" className="pl-tab">Filters <span className="count">3</span></button>
              </div>
              <div className="pl-grid">
                {PROMPTS.slice(0, 3).map((p, i) => <PCard key={i} p={p} />)}
              </div>
            </div>

            {/* modal */}
            <div className="modal-scrim">
              <div className="modal" role="dialog" aria-modal="true">
                <div className="modal-head">
                  <div>
                    <h2 className="modal-title">Create Customer Prompt</h2>
                    <p className="modal-sub">Customise the template for a specific account. Edits stay scoped to that account.</p>
                  </div>
                  <button className="modal-close" type="button" aria-label="Close">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </div>

                <div className="modal-tmpl">
                  <span className="badge">Template</span>
                  <span>Hybrid Search · v2.4</span>
                </div>

                <div className="field">
                  <label className="field-label">Prompt name</label>
                  <input className="field-input" type="text" placeholder="e.g. MechaTech — Hybrid Search v1" defaultValue="MechaTech — Hybrid Search v1" />
                </div>

                <div className="field">
                  <label className="field-label">Description</label>
                  <input className="field-input" type="text" placeholder="Short summary for your team" defaultValue="Tuned for spare parts catalogue with extended attribute filters." />
                </div>

                <div className="field">
                  <label className="field-label">Account</label>
                  <select className="field-select" defaultValue="mechatech">
                    <option value="mechatech">MechaTech / mechatech_solutions_testing</option>
                    <option value="acme">Acme Industries / acme_main</option>
                    <option value="northbay">NorthBay Tools / northbay_prod</option>
                  </select>
                </div>

                <div className="field">
                  <label className="field-label">Prompt body</label>
                  <textarea className="field-textarea" defaultValue={"**TASK**: Combine semantic embeddings with keyword retrieval...\n\nSTEPS:\n1. Normalize the user query and detect language.\n2. Compute the dense vector representation...\n"} />
                </div>

                <div className="modal-foot">
                  <button type="button" className="btn btn--ghost" style={{flex: "0 0 auto", minWidth: 100}}>Cancel</button>
                  <button type="button" className="btn btn--primary">Save Prompt</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// -------- Screen 3: Empty State --------
function EmptyScreen() {
  return (
    <div className="pl">
      <PortalHeader />
      <div className="pl-shell">
        <PortalSidebar active="prompts" />
        <main className="pl-content">
          <div className="pl-panel">
            <h1 className="pl-title">Prompts Library</h1>
            <p className="pl-subtitle">Read-only reference prompts. Select one to view details or create a customer prompt.</p>
            <div className="pl-tabs">
              <span className="pl-tabs-label">Filter by</span>
              <button type="button" className="pl-tab is-active">All <span className="count">0</span></button>
              <button type="button" className="pl-tab">Hybrid <span className="count">0</span></button>
              <button type="button" className="pl-tab">Grounding <span className="count">0</span></button>
              <button type="button" className="pl-tab">Filters <span className="count">0</span></button>
            </div>

            <div className="empty">
              <div className="empty-art">
                <svg width="160" height="130" viewBox="0 0 160 130" fill="none">
                  <rect x="22" y="22" width="116" height="92" rx="14" fill="#F3F4F8" stroke="#DDDEE7" strokeWidth="1.5"/>
                  <rect x="34" y="36" width="46" height="8" rx="3" fill="#E5D0FF"/>
                  <rect x="34" y="50" width="72" height="6" rx="2" fill="#DDDEE7"/>
                  <rect x="34" y="62" width="60" height="6" rx="2" fill="#DDDEE7"/>
                  <rect x="34" y="82" width="40" height="14" rx="5" fill="#FFFFFF" stroke="#DDDEE7"/>
                  <rect x="80" y="82" width="50" height="14" rx="5" fill="#7114E6"/>
                  <g transform="translate(108, 16)">
                    <circle cx="14" cy="14" r="13" fill="#FFFFFF" stroke="#9745FF" strokeWidth="1.5"/>
                    <path d="M14 8V14M14 18.5V19.5" stroke="#7114E6" strokeWidth="1.8" strokeLinecap="round"/>
                  </g>
                </svg>
              </div>
              <h2 className="empty-h">No prompts yet</h2>
              <p className="empty-p">The reference library is empty right now. Once nyris publishes prompts, they will appear here ready to view and customise.</p>
              <div style={{display: "flex", gap: 10}}>
                <button type="button" className="btn btn--primary" style={{flex: "0 0 auto", minWidth: 170}}>Request a prompt</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// -------- Screen 4: Filter Active (Hybrid only) --------
function FilterActiveScreen() {
  const filtered = PROMPTS.filter(p => p.catKey === 'hybrid');
  return (
    <div className="pl">
      <PortalHeader />
      <div className="pl-shell">
        <PortalSidebar active="prompts" />
        <main className="pl-content">
          <div className="pl-panel">
            <h1 className="pl-title">Prompts Library</h1>
            <p className="pl-subtitle">Read-only reference prompts. Select one to view details or create a customer prompt.</p>
            <div className="pl-tabs">
              <span className="pl-tabs-label">Filter by</span>
              <button type="button" className="pl-tab">All <span className="count">9</span></button>
              <button type="button" className="pl-tab is-active">Hybrid <span className="count">3</span></button>
              <button type="button" className="pl-tab">Grounding <span className="count">3</span></button>
              <button type="button" className="pl-tab">Filters <span className="count">3</span></button>
            </div>
            <div className="pl-grid">
              {filtered.map((p, i) => <PCard key={i} p={p} />)}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// -------- Screen 5: Mobile --------
function MobileScreen() {
  return (
    <div className="pl pl--mobile">
      <PortalHeader mobile />
      <div className="pl-shell">
        <main className="pl-content">
          <div className="pl-panel">
            <h1 className="pl-title">Prompts Library</h1>
            <p className="pl-subtitle">Read-only reference prompts. Select one to view details or create a customer prompt.</p>
            <div className="pl-tabs">
              <button type="button" className="pl-tab is-active">All <span className="count">9</span></button>
              <button type="button" className="pl-tab">Hybrid <span className="count">3</span></button>
              <button type="button" className="pl-tab">Grounding <span className="count">3</span></button>
              <button type="button" className="pl-tab">Filters <span className="count">3</span></button>
            </div>
            <div className="pl-grid">
              {PROMPTS.slice(0, 3).map((p, i) => <PCard key={i} p={p} />)}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

window.DetailScreen = DetailScreen;
window.CreateModalScreen = CreateModalScreen;
window.EmptyScreen = EmptyScreen;
window.FilterActiveScreen = FilterActiveScreen;
window.MobileScreen = MobileScreen;

// -------- Screen 7: Improve Prompt with AI modal --------
function ImproveModalScreen() {
  return (
    <div style={{position: "relative", width: "100%", height: "100%"}}>
      <DetailScreen />
      <div className="improve-scrim">
        <div className="improve-modal" role="dialog" aria-modal="true">
          <div className="improve-head">
            <h2 className="improve-title">Improve Prompt with AI</h2>
            <button type="button" className="improve-close" aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
          </div>
          <div className="improve-body">
            <textarea
              className="improve-textarea"
              defaultValue={`The image_description field is too vague. Push the AI to include the
object type, condition, and any visible text or markings. Also, can we
add a confidence level field to the JSON output?`}
              placeholder="Describe how you'd like to improve this prompt…"
            />
          </div>
          <div className="improve-foot">
            <button type="button" className="btn btn--dark btn--bar">Cancel</button>
            <button type="button" className="btn btn--primary btn--bar">Improve</button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ImproveModalScreen = ImproveModalScreen;

// -------- Screen 8: Improving Prompt (loading state) --------
function ImprovingLoadingScreen() {
  return (
    <div className="pl pl--improving">
      <PortalHeader />
      <div className="pl-shell">
        <PortalSidebar active="prompts" />
        <main className="pl-content">
          <div className="pl-panel">
            <button type="button" className="det-back">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back to Library
            </button>

            <div className="det-head">
              <div className="det-head-left">
                <div className="det-cat">Hybrid Search</div>
                <div className="det-name-row">
                  <h1 className="det-name">Hybrid Search</h1>
                  <button className="det-info" type="button" aria-label="About this prompt">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6.2V10M7 4V4.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  </button>
                </div>
                <p className="det-account">MechaTech / mechatech_solutions_testing</p>
              </div>
            </div>

            <div className="det-bar">
              <span className="det-ver">
                Version 2.4 <span className="muted">(latest)</span>
                <span className="det-ver-dot"></span>
              </span>
              <div className="det-bar-actions">
                <button type="button" className="btn btn--outline btn--pill is-disabled" disabled>
                  Improve Prompt with AI
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5L8 4.5L11 5.5L8 6.5L7 9.5L6 6.5L3 5.5L6 4.5L7 1.5Z" fill="currentColor"/></svg>
                </button>
                <button type="button" className="btn btn--outline btn--pill is-disabled" disabled>
                  Test Prompt
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 2H2.5C2 2 1.5 2.4 1.5 3V10.5C1.5 11 2 11.5 2.5 11.5H10C10.6 11.5 11 11 11 10.5V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M8 1.5H11.5V5M11.5 1.5L6.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>

            <div className="det-section">
              <div className="codeblock-wrap is-loading">
                <pre className="codeblock-light">{`# TASK
You are given an image. Follow the steps below to produce a structured data
response.

# STEPS
1. Analyze the image.
2. Generate a single JSON object that strictly conforms to the schema below.
3. Include all required fields from the schema.
4. Adhere to the specified types and enumerations exactly.
5. Return only the JSON object (no extra explanations or text).

# JSON SCHEMA
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Image Analysis Schema",
  "description": "Schema for extracting structured data from an image, including
explanations for value assignments.",
  "properties": {
    "image_description": {
      "type": "string",
      "description": "A short and concise description of the image."
    },
    "visual_information_type": {
      "type": "string",
      "enum": ["primary", "secondary", "incomprehensible"],`}</pre>
                <div className="improving-overlay">
                  <div className="improving-spinner" aria-hidden="true"></div>
                  <div className="improving-label">Improving Prompt</div>
                </div>
              </div>
            </div>

            <div className="det-footer is-loading">
              <button type="button" className="btn btn--dark btn--bar is-disabled" disabled>Discard</button>
              <button type="button" className="btn btn--primary btn--bar is-disabled" disabled>Push to Index</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

window.ImprovingLoadingScreen = ImprovingLoadingScreen;

// -------- Screen 8: Test Prompt --------
function TestPromptScreen() {
  return (
    <div className="pl">
      <PortalHeader />
      <div className="pl-shell">
        <PortalSidebar active="prompts" />
        <main className="pl-content">
          <div className="pl-panel">
            <button type="button" className="det-back">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back to Prompt
            </button>

            <div className="det-head">
              <div className="det-head-left">
                <div className="det-cat">Hybrid Search · v2.4</div>
                <div className="det-name-row">
                  <h1 className="det-name">Test Prompt</h1>
                </div>
                <p className="det-account">Run this prompt against a sample input and inspect the response.</p>
              </div>
              <div className="det-actions">
                <button type="button" className="btn btn--outline" style={{minWidth: 110}}>Reset</button>
                <button type="button" className="btn btn--primary" style={{minWidth: 140}}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4 3L10 6.5L4 10V3Z" fill="currentColor"/></svg>
                  Run Test
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

                <div className="test-dropzone">
                  <div className="test-dz-thumb">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <rect x="3" y="6" width="34" height="28" rx="3" stroke="currentColor" strokeWidth="1.6"/>
                      <circle cx="13" cy="16" r="3" fill="currentColor"/>
                      <path d="M3 28L13 20L22 27L30 21L37 26" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="test-dz-text">
                    <strong>Drop an image here</strong>
                    <span>or <a href="#" className="test-link">browse files</a> · PNG, JPG, up to 10 MB</span>
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Query (optional)</label>
                  <input className="field-input" type="text" placeholder="e.g. black industrial pump 12V"
                    defaultValue="hydraulic pump shaft seal MX-2400" />
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
                      <option>5</option>
                      <option>10</option>
                      <option>25</option>
                      <option>50</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="test-card">
                <div className="test-card-head">
                  <span className="test-card-title">Response</span>
                  <div className="test-meta">
                    <span className="test-pill test-pill--ok">
                      <span className="test-dot"></span> 200 OK
                    </span>
                    <span className="test-meta-item">412 ms</span>
                    <span className="test-meta-sep"></span>
                    <span className="test-meta-item">1,284 tokens</span>
                  </div>
                </div>

                <pre className="test-response">{`{
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
    },
    {
      "id": "PMP-HSK-MX2400",
      "title": "Hydraulic Service Kit · MX-2400",
      "score": 0.81,
      "matched": ["title", "service_kit"]
    }
  ],
  "filters_applied": ["category=spare_parts", "brand=mechatech"]
}`}</pre>

                <div className="test-foot">
                  <button type="button" className="codeblock-icon" aria-label="Copy">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="3" y="3" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/><path d="M5 3V2.2A0.5 0.5 0 0 1 5.5 1.7H9A1.5 1.5 0 0 1 10.5 3.2V8" stroke="currentColor" strokeWidth="1.3"/></svg>
                  </button>
                  <button type="button" className="codeblock-icon" aria-label="Download">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 2V8M3.5 6L6.5 9L9.5 6M2.5 10.5H10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button type="button" className="btn btn--outline btn--sm" style={{flex: "0 0 auto", marginLeft: "auto"}}>View raw</button>
                </div>
              </section>
            </div>

            <section className="test-history">
              <div className="test-history-head">
                <span className="det-section-title">Recent runs</span>
                <button type="button" className="btn btn--ghost btn--sm" style={{flex: "0 0 auto"}}>Clear history</button>
              </div>
              <table className="test-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Input</th>
                    <th>Status</th>
                    <th>Latency</th>
                    <th>Tokens</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Just now</td>
                    <td>pump-shaft-seal.png · "hydraulic pump shaft seal MX-2400"</td>
                    <td><span className="test-pill test-pill--ok"><span className="test-dot"></span>200</span></td>
                    <td>412 ms</td>
                    <td>1,284</td>
                    <td><a href="#" className="test-link">View</a></td>
                  </tr>
                  <tr>
                    <td>2 min ago</td>
                    <td>"black industrial pump 12V"</td>
                    <td><span className="test-pill test-pill--ok"><span className="test-dot"></span>200</span></td>
                    <td>389 ms</td>
                    <td>1,102</td>
                    <td><a href="#" className="test-link">View</a></td>
                  </tr>
                  <tr>
                    <td>14 min ago</td>
                    <td>gearbox-front.jpg</td>
                    <td><span className="test-pill test-pill--warn"><span className="test-dot"></span>Empty</span></td>
                    <td>521 ms</td>
                    <td>980</td>
                    <td><a href="#" className="test-link">View</a></td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

window.TestPromptScreen = TestPromptScreen;

// -------- Screen 6: Read Documentation --------
function DocsScreen() {
  const sections = [
    { id: "intro",     title: "Introduction",          active: true },
    { id: "what",      title: "What is a prompt?" },
    { id: "anatomy",   title: "Anatomy of a prompt" },
    { id: "kinds",     title: "Prompt categories" },
    { id: "customer",  title: "Customer prompts" },
    { id: "versions",  title: "Versioning" },
    { id: "publish",   title: "Publishing & rollback" },
    { id: "best",      title: "Best practices" },
    { id: "faq",       title: "FAQ" },
  ];
  return (
    <div className="pl">
      <PortalHeader />
      <div className="pl-shell">
        <PortalSidebar active="prompts" />
        <main className="pl-content">
          <div className="pl-panel pl-panel--docs">
            <div className="docs-topbar">
              <button type="button" className="det-back" style={{margin: 0}}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back to Library
              </button>
              <div className="docs-crumbs">
                <span>Help</span>
                <span className="docs-crumb-sep">/</span>
                <span>Prompts</span>
                <span className="docs-crumb-sep">/</span>
                <span className="is-current">Getting Started</span>
              </div>
            </div>

            <div className="docs-layout">
              <aside className="docs-toc">
                <div className="docs-toc-label">On this page</div>
                <ul>
                  {sections.map(s => (
                    <li key={s.id} className={s.active ? "is-active" : ""}>
                      <a href={"#" + s.id}>{s.title}</a>
                    </li>
                  ))}
                </ul>
                <div className="docs-toc-cta">
                  <div className="docs-toc-cta-title">Need help?</div>
                  <p>Reach out to your account manager or open a support ticket.</p>
                  <button type="button" className="btn btn--outline btn--sm" style={{flex: "0 0 auto"}}>Contact support</button>
                </div>
              </aside>

              <article className="docs-article">
                <div className="docs-hero">
                  <div className="det-cat" style={{marginBottom: 10}}>Prompts · Getting Started</div>
                  <h1 className="docs-h1">How the Prompts Library works</h1>
                  <p className="docs-lede">
                    The Prompts Library is your source of truth for the prompts nyris uses to power
                    hybrid search, grounding and smart filtering. Reference prompts are read-only —
                    fork one to build a customer-specific version.
                  </p>
                  <div className="docs-meta">
                    <span className="ver-mini">Updated May 8, 2026</span>
                    <span className="docs-dot"></span>
                    <span>Reading time · 6 min</span>
                    <span className="docs-dot"></span>
                    <span>Audience · Solution Engineers</span>
                  </div>
                </div>

                <section id="intro" className="docs-section">
                  <h2 className="docs-h2">Introduction</h2>
                  <p>
                    Every nyris search request runs through one or more prompts. The library
                    organises them into three families: <strong>Hybrid Search</strong>,
                    <strong> Grounding</strong> and <strong>Smart Filters</strong>. Each family
                    serves a specific stage of the retrieval pipeline.
                  </p>
                  <div className="docs-callout">
                    <div className="docs-callout-icon">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M7 6V10M7 4V4.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    </div>
                    <div>
                      <strong>Read-only by default.</strong> Reference prompts live in this library
                      and can't be edited in place. Always create a customer prompt before pushing
                      changes to an index.
                    </div>
                  </div>
                </section>

                <section id="anatomy" className="docs-section">
                  <h2 className="docs-h2">Anatomy of a prompt</h2>
                  <p>
                    A prompt is a single, versioned text body wrapped with metadata. Open a card and
                    you'll see four parts working together:
                  </p>
                  <div className="docs-grid">
                    <div className="docs-tile">
                      <div className="docs-tile-num">01</div>
                      <div className="docs-tile-h">Category</div>
                      <p>One of Hybrid, Grounding or Smart Filters — drives where the prompt slots into the pipeline.</p>
                    </div>
                    <div className="docs-tile">
                      <div className="docs-tile-num">02</div>
                      <div className="docs-tile-h">Body</div>
                      <p>The prompt text itself. Markdown is supported. Keep TASK / STEPS / CONSTRAINTS sections.</p>
                    </div>
                    <div className="docs-tile">
                      <div className="docs-tile-num">03</div>
                      <div className="docs-tile-h">Version</div>
                      <p>Bumped automatically each time a customer prompt is pushed to an index. Earlier versions stay browsable.</p>
                    </div>
                    <div className="docs-tile">
                      <div className="docs-tile-num">04</div>
                      <div className="docs-tile-h">Scope</div>
                      <p>Reference prompts apply globally; customer prompts are scoped to one account and one index.</p>
                    </div>
                  </div>
                </section>

                <section id="customer" className="docs-section">
                  <h2 className="docs-h2">Creating a customer prompt</h2>
                  <p>
                    From any reference card click <strong>Create Customer Prompt</strong>. You'll
                    get a copy of the body that you can edit freely. The new prompt is scoped to the
                    account you select and won't affect other tenants.
                  </p>
                  <ol className="docs-list">
                    <li>Pick the reference prompt that's closest to what you need.</li>
                    <li>Click <em>Create Customer Prompt</em> on the card or detail page.</li>
                    <li>Edit name, description and body in the create modal.</li>
                    <li>Save as a draft, or push directly to an index when you're ready.</li>
                  </ol>
                  <pre className="codeblock-light" style={{marginTop: 16}}>{`POST /accounts/{account_id}/prompts
{
  "name": "MechaTech — Hybrid Search v1",
  "template": "hybrid-search@2.4",
  "body": "**TASK**: Combine semantic embeddings ...",
  "scope": { "index": "mechatech_solutions_testing" }
}`}</pre>
                </section>

                <section id="versions" className="docs-section">
                  <h2 className="docs-h2">Versioning &amp; rollback</h2>
                  <p>
                    Every push creates an immutable version. The version chip at the top of a
                    detail page always shows the active version. Use <em>Push to Index</em> to
                    promote the current draft; use <em>Discard</em> to revert local edits without
                    affecting the live prompt.
                  </p>
                  <div className="docs-callout docs-callout--warn">
                    <div className="docs-callout-icon">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2L13 12H1L7 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M7 6V8.5M7 10V10.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    </div>
                    <div>
                      Pushing to a production index takes effect within ~30 seconds. Test in a
                      staging index first whenever the prompt shape changes meaningfully.
                    </div>
                  </div>
                </section>
              </article>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

window.DocsScreen = DocsScreen;
