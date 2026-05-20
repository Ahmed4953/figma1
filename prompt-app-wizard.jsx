/* eslint-disable */
// Customer prompt creation wizard — used by Request a prompt flow

const CPW_STEPS = [
  { id: "base", label: "Select Base" },
  { id: "review", label: "Review" },
  { id: "metadata", label: "Metadata" },
  { id: "sections", label: "Prompt Sections" },
  { id: "generate", label: "Generate" }];

const CPW_SECTION_GUIDE = {
  "hybrid-search": [
    { name: "Task", status: "locked", description: "Role, OCR placeholder, and JSON-only priority rules" },
    { name: "Visual classification", status: "editable", description: "Primary versus secondary image classification" },
    { name: "OCR text classification", status: "editable", description: "Primary, secondary, or not relevant OCR text" },
    { name: "BM25 query construction", status: "editable", description: "Concise catalog query rules and examples" },
    { name: "Specification extraction", status: "editable", description: "Fixed specification keys, VIN and tire fields" },
    { name: "JSON schema", status: "locked", description: "Strict output contract — auto-injected from schema registry" },
    { name: "Custom context", status: "editable", description: "Optional customer context and extra rules" }] };

const CPW_RUNTIME_DEFAULT = {
  model: "gemini-flash-lite-latest",
  temperature: "0.0",
  tools: "none" };

const CPW_ACCOUNTS = [
  { id: "mechatech", label: "MechaTech / mechatech_solutions_testing" },
  { id: "acme", label: "Acme Industries / acme_main" },
  { id: "northbay", label: "NorthBay Tools / northbay_prod" }];

const CPW_PROMPT_SECTIONS = [
  {
    key: "VISUAL_CLASSIFICATION",
    title: "Visual classification",
    placeholder: "Define when an image signal is primary vs secondary for this account's catalogue."
  },
  {
    key: "OCR_TEXT_CLASSIFICATION",
    title: "OCR text classification",
    placeholder: "Rules for primary, secondary, or not-relevant OCR text on nameplates and labels."
  },
  {
    key: "BM25_QUERY",
    title: "BM25 query construction",
    placeholder: "Concise catalog query rules, token limits, and 1–2 worked examples."
  },
  {
    key: "SPECIFICATION_EXTRACTION",
    title: "Specification extraction",
    placeholder: "Fixed keys to extract (e.g. VIN, tire size, thread) and how to normalize them."
  },
  {
    key: "CUSTOM_CONTEXT",
    title: "Custom context",
    placeholder: "Optional customer-specific context, terminology, or extra constraints."
  }
];

const CPW_EDITABLE_SECTIONS_DEFAULT = CPW_PROMPT_SECTIONS;

const CPW_EDITABLE_SECTIONS_BY_BASE = {
  "hybrid-search": CPW_PROMPT_SECTIONS
};

function cpwGetEditableSections(baseId) {
  return CPW_EDITABLE_SECTIONS_BY_BASE[baseId] || CPW_EDITABLE_SECTIONS_DEFAULT;
}

function cpwInitSectionValues(baseId) {
  const init = {};
  cpwGetEditableSections(baseId).forEach((s) => {
    init[s.key] = s.defaultValue != null ? s.defaultValue : "";
  });
  return init;
}

const CPW_FALLBACK_BASE = {
  id: "hybrid-search",
  cat: "Hybrid Search",
  catKey: "hybrid",
  title: "Hybrid Search",
  desc: "Combines semantic embeddings with keyword retrieval to produce a balanced ranked list of products.",
  ver: "v2.4",
  date: "Apr 18, 2026",
  what: "Classifies an image as primary or secondary, extracts structured attributes, and builds a BM25 search query from the visual signals before fusing with vector retrieval.",
  impact: "Determines whether visual or textual search is primary for a given request. Misclassification here routes the query down the wrong retrieval path."
};

function cpwGetBaseOptions() {
  if (typeof PROMPTS !== "undefined" && PROMPTS.length > 0) return PROMPTS;
  return [CPW_FALLBACK_BASE];
}

function cpwGetSectionGuide(promptId) {
  if (CPW_SECTION_GUIDE[promptId]) return CPW_SECTION_GUIDE[promptId];
  return [
    { name: "Task", status: "locked", description: "Defines the prompt role and JSON output contract" },
    { name: "Customer context", status: "editable", description: "Domain, users, and where the prompt runs" },
    { name: "Domain terminology", status: "editable", description: "Abbreviations and how terms should be interpreted" },
    { name: "Examples", status: "editable", description: "Canonical query → expected result pairs" },
    { name: "Steps", status: "locked", description: "Ordered pipeline steps from the reference template" },
    { name: "Output format", status: "locked", description: "JSON schema for downstream consumers" },
    { name: "Constraints", status: "locked", description: "Hard rules the model must follow" }];
}

const CPW_BASE_COPY = {
  "hybrid-search": {
    purpose: "Classifies an image and its OCR text into visual/text categories, builds a BM25 search query, and extracts fixed product specifications like VIN and tire attributes.",
    impact: "Determines whether visual or textual search is primary for a given request. A wrong classification degrades recall for that image."
  }
};

function cpwGetBasePreset(baseId) {
  const prompt = cpwGetBaseOptions().find((p) => p.id === baseId) || cpwGetBaseOptions()[0];
  const copy = CPW_BASE_COPY[prompt.id];
  return {
    id: prompt.id,
    title: prompt.title,
    cat: prompt.cat,
    catKey: prompt.catKey,
    ver: prompt.ver || "v1",
    purpose: copy?.purpose || prompt.what || prompt.desc,
    impact: copy?.impact || prompt.impact ||
    "Helps tailor search behavior to the account catalogue and expected result format.",
    runtime: { ...CPW_RUNTIME_DEFAULT },
    sectionGuide: cpwGetSectionGuide(prompt.id)
  };
}

function CpwStepper({ currentStep }) {
  return (
    <ol className="cpw-stepper" aria-label="Creation progress">
      {CPW_STEPS.map((step, index) => {
        const isDone = index < currentStep;
        const isActive = index === currentStep;
        const state = isDone ? "is-done" : isActive ? "is-active" : "";
        return (
          <li key={step.id} className={"cpw-step " + state}>
            <span className="cpw-step-marker" aria-hidden="true">
              {isDone ?
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg> :
              index + 1}
            </span>
            <span className="cpw-step-label">{step.label}</span>
            {index < CPW_STEPS.length - 1 && <span className="cpw-step-line" aria-hidden="true" />}
          </li>);

      })}
    </ol>);

}

function CpwSectionGuide({ rows }) {
  return (
    <div className="cpw-guide">
      <div className="cpw-guide-head">Section guide</div>
      <div className="cpw-guide-table" role="table">
        <div className="cpw-guide-row cpw-guide-row--head" role="row">
          <span role="columnheader">Section</span>
          <span role="columnheader">Access</span>
          <span role="columnheader">Description</span>
        </div>
        {rows.map((row) =>
        <div key={row.name} className="cpw-guide-row" role="row">
            <span className="cpw-guide-name" role="cell">{row.name}</span>
            <span role="cell">
              <span className={"cpw-tag cpw-tag--" + row.status}>
                {row.status === "locked" ? "Locked" : "Editable"}
              </span>
            </span>
            <span className="cpw-guide-desc" role="cell">{row.description}</span>
          </div>
        )}
      </div>
    </div>);

}

function cpwFormatDisplayDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return mm + "/" + dd + "/" + yyyy;
}

function CustomerPromptWizard({ initialBaseId, initialStep, cancelPath, sessionId: sessionIdProp, syncUrl = true }) {
  const lockedBaseId = initialBaseId || null;
  const startStep = typeof initialStep === "number" ? initialStep : 0;
  const exitPath = cancelPath || "/library";
  const { route, arg } = useRoute();
  const routeStep = typeof cpwStepFromRoute === "function" ? cpwStepFromRoute(route) : null;

  const { create } = useLibraryPrompts();
  const baseOptions = React.useMemo(() => cpwGetBaseOptions(), []);
  const [step, setStep] = React.useState(() =>
  routeStep != null ? routeStep : startStep);
  const [baseId, setBaseId] = React.useState(
    () => lockedBaseId || baseOptions[0]?.id || "hybrid-search");
  const [customerName, setCustomerName] = React.useState("");
  const [promptName, setPromptName] = React.useState("");
  const [ownerAuthor, setOwnerAuthor] = React.useState("");
  const [createdDate, setCreatedDate] = React.useState(() => cpwFormatDisplayDate(new Date()));
  const [metadataNotes, setMetadataNotes] = React.useState("");
  const [accountId] = React.useState("mechatech");
  const editableSections = React.useMemo(() => cpwGetEditableSections(baseId), [baseId]);
  const [sectionValues, setSectionValues] = React.useState(() =>
  cpwInitSectionValues(lockedBaseId || baseOptions[0]?.id || "hybrid-search"));
  const defaultBodyFn = typeof buildDefaultPromptBodyForCreateModal === "function" ?
  buildDefaultPromptBodyForCreateModal :
  () => "";
  const [promptBody, setPromptBody] = React.useState(defaultBodyFn);

  const base = React.useMemo(() => cpwGetBasePreset(baseId), [baseId]);
  const account = CPW_ACCOUNTS.find((a) => a.id === accountId);
  const sessionId = sessionIdProp || arg || lockedBaseId || baseId;

  const goToStep = React.useCallback((nextStep) => {
    setStep(nextStep);
    if (syncUrl && typeof cpwPathForStep === "function") {
      const path = cpwPathForStep(nextStep, sessionId);
      const current = window.location.hash || "";
      if (current !== "#" + path && current !== path) go(path);
    }
  }, [sessionId, syncUrl]);

  React.useEffect(() => {
    const syncFromHash = () => {
      if (typeof parseHash !== "function" || typeof cpwStepFromRoute !== "function") return;
      const s = cpwStepFromRoute(parseHash().route);
      if (s != null) setStep(s);
    };
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  React.useEffect(() => {
    const defaultName = base.title + " – Custom";
    setPromptName((prev) => {
      if (!prev.trim() || prev.endsWith(" – Custom") || prev.endsWith(" — Custom")) return defaultName;
      return prev;
    });
  }, [baseId, base.title]);

  React.useEffect(() => {
    setSectionValues(cpwInitSectionValues(baseId));
  }, [baseId]);

  const goBack = () => {
    const minStep = lockedBaseId ? startStep : 0;
    if (step <= minStep) go(exitPath);
    else goToStep(step - 1);
  };

  const goNext = () => goToStep(Math.min(step + 1, CPW_STEPS.length - 1));

  const savePrompt = () => {
    const now = new Date();
    const title = promptName.trim() || base.title + " – Custom";
    const desc = metadataNotes.trim() ||
    "Tuned for spare parts catalogue with extended attribute filters.";
    const id = "custom_" + Math.random().toString(36).slice(2, 9);
    const accountLabel = account ? account.label : "the selected account";

    create({
      id,
      cat: base.cat,
      catKey: base.catKey,
      title,
      desc,
      ver: "v1",
      date: createdDate.trim() || cpwFormatDisplayDate(now),
      what: desc,
      where: "Used for " + base.cat.toLowerCase() + " workflows on " + accountLabel + ".",
      impact: base.impact,
      promptBody,
      accountId,
      templateId: base.id,
      templateTitle: base.title,
      templateVersion: base.ver,
      customerName: customerName.trim(),
      ownerAuthor: ownerAuthor.trim(),
      metadataNotes: metadataNotes.trim(),
      status: "draft",
      sectionValues
    });
    go("/created/" + id);
  };

  const nextLabels = ["Next: Review", "Next: Metadata", "Next: Prompt Sections", "Next: Generate", "Save prompt"];

  return (
    <AppShell secondaryNav={<SecondaryNav current="library" />}>
      <div className={"cpw" + (step === 3 ? " cpw--prompt-sections" : "")}>
        <button type="button" className="det-back cpw-cancel" onClick={goBack}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {(step === 0 && !lockedBaseId) || (lockedBaseId && step === startStep) ? "Cancel" : "Back"}
        </button>

        <div className="cpw-head">
          <div className="cpw-eyebrow">Customer prompt creation</div>
          <h1 className="cpw-title">{base.title} – Custom</h1>
        </div>

        <CpwStepper currentStep={step} />

        <div className={"cpw-card" + (step === 3 ? " cpw-card--prompt-sections" : "")}>
          {step === 0 && !lockedBaseId &&
          <div className="cpw-panel">
              <h2 className="cpw-panel-title">Select base prompt</h2>
              <p className="cpw-panel-lead">
                Choose the nyris reference prompt your customer version will extend. You can review
                purpose, runtime, and locked sections before customising.
              </p>
              <div className="cpw-base-grid">
                {baseOptions.map((p) =>
                <button key={p.id} type="button"
                className={"cpw-base-card" + (baseId === p.id ? " is-selected" : "")}
                onClick={() => setBaseId(p.id)}>
                    <span className="cpw-base-cat">{p.cat}</span>
                    <span className="cpw-base-name">{p.title}</span>
                    <span className="cpw-base-desc">{p.desc}</span>
                    <span className="cpw-base-meta">{p.ver} · {p.date}</span>
                  </button>
                )}
              </div>
            </div>}

          {step === 1 &&
          <div className="cpw-panel">
              <CpwSectionGuide rows={base.sectionGuide} />
            </div>}

          {step === 2 &&
          <div className="cpw-panel">
              <h2 className="cpw-panel-title">Customer metadata</h2>
              <p className="cpw-panel-lead">Enter identifying information for this customer prompt.</p>
              <div className="cpw-meta-grid">
                <div className="field">
                  <label className="field-label" htmlFor="cpw-customer-name">Customer name</label>
                  <input id="cpw-customer-name" className="field-input" type="text"
                  placeholder="e.g. RS Components"
                  value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="cpw-prompt-name">Prompt name</label>
                  <input id="cpw-prompt-name" className="field-input" type="text"
                  placeholder={base.title + " – Custom"}
                  value={promptName} onChange={(e) => setPromptName(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="cpw-owner">Owner / author</label>
                  <input id="cpw-owner" className="field-input" type="text"
                  placeholder="Your name"
                  value={ownerAuthor} onChange={(e) => setOwnerAuthor(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="cpw-created-date">Created date</label>
                  <input id="cpw-created-date" className="field-input" type="text"
                  placeholder="MM/DD/YYYY"
                  value={createdDate} onChange={(e) => setCreatedDate(e.target.value)} />
                </div>
              </div>
              <div className="field cpw-meta-notes">
                <label className="field-label" htmlFor="cpw-notes">Notes</label>
                <textarea id="cpw-notes" className="field-textarea"
                placeholder="Optional context about this customization"
                value={metadataNotes} onChange={(e) => setMetadataNotes(e.target.value)} />
              </div>
              <div className="cpw-meta-summary">
                <span className="badge">Template</span>
                <span>{base.title} · {base.ver}</span>
              </div>
            </div>}

          {step === 3 &&
          <div className="cpw-panel cpw-panel--prompt-sections">
              <h2 className="cpw-panel-title">Prompt sections</h2>
              <p className="cpw-panel-lead">
                Customize each editable section for this customer prompt. Locked sections and the
                output schema cannot be changed.
              </p>
              <div className="cpw-prompt-sections-block">
                <div className="cpw-prompt-sections-head">Prompt sections</div>
                <div className="cpw-sections">
                  {editableSections.map((s) =>
                  <div key={s.key} className="cpw-section-field">
                      <label className="field-label" htmlFor={"cpw-sec-" + s.key}>{s.title}</label>
                      <textarea id={"cpw-sec-" + s.key} className="field-textarea"
                      placeholder={s.placeholder}
                      value={sectionValues[s.key] || ""}
                      onChange={(e) => setSectionValues((prev) => ({ ...prev, [s.key]: e.target.value }))} />
                    </div>
                  )}
                </div>
              </div>
            </div>}

          {step === 4 &&
          <div className="cpw-panel">
              <h2 className="cpw-panel-title">Generate prompt</h2>
              <p className="cpw-panel-lead">
                Review the assembled prompt body. You can edit it before saving to your library.
              </p>
              <div className="field">
                <label className="field-label" htmlFor="cpw-prompt-body">Prompt body</label>
                <textarea id="cpw-prompt-body" className="field-textarea field-textarea--prompt-body"
                value={promptBody} onChange={(e) => setPromptBody(e.target.value)} />
              </div>
              <div className="cpw-generate-summary">
                <div className="cpw-generate-row"><span>Base</span><strong>{base.title}</strong></div>
                <div className="cpw-generate-row"><span>Account</span><strong>{account ? account.label : accountId}</strong></div>
                <div className="cpw-generate-row"><span>Name</span><strong>{promptName.trim() || "—"}</strong></div>
              </div>
            </div>}

          <div className="cpw-foot">
            {step > 0 &&
            <button type="button" className="btn btn--ghost" style={{ flex: "0 0 auto", minWidth: 100 }}
            onClick={goBack}>Back</button>}
            <button type="button" className="btn btn--primary"
            style={{ flex: "0 0 auto", minWidth: step === 4 ? 140 : 168, marginLeft: "auto" }}
            onClick={step === 4 ? savePrompt : goNext}>
              {nextLabels[step]}
            </button>
          </div>
        </div>
      </div>
    </AppShell>);

}

window.CustomerPromptWizard = CustomerPromptWizard;
