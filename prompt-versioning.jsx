/* eslint-disable */
// Prompt version control — storage, publish/draft, version history UI

const PROMPT_VERSIONS_KEY = "nyris-prompt-versions-v1";
const MAX_VERSIONS = 10;
const PUBLISHER_NAME = "test@nyris.io";

function loadAllVersionStates() {
  try {
    const raw = localStorage.getItem(PROMPT_VERSIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllVersionStates(map) {
  localStorage.setItem(PROMPT_VERSIONS_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent("nyris-prompt-versions-changed"));
}

function parseVersionLabel(label) {
  const m = String(label || "v1.0").match(/v?(\d+)\.(\d+)/i);
  return {
    major: m ? parseInt(m[1], 10) : 1,
    minor: m ? parseInt(m[2], 10) : 0
  };
}

function formatVersionLabel(major, minor) {
  return "v" + major + "." + minor;
}

function nextVersionLabel(latestLabel) {
  const { major, minor } = parseVersionLabel(latestLabel);
  if (minor >= 9) return formatVersionLabel(major + 1, 0);
  return formatVersionLabel(major, minor + 1);
}

function formatPublishedDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function snapshotFromPrompt(prompt) {
  return {
    title: prompt.title || "",
    desc: prompt.desc || "",
    promptBody:
      prompt.promptBody ||
      (typeof buildDetailViewPromptBody === "function" ? buildDetailViewPromptBody() : ""),
    metadata: {
      what: prompt.what || "",
      where: prompt.where || "",
      impact: prompt.impact || "",
      accountId: prompt.accountId || "",
      cat: prompt.cat || "",
      catKey: prompt.catKey || ""
    }
  };
}

function versionFromSnapshot(snapshot, label, publishedAt, publishedBy, isLatest) {
  const { major, minor } = parseVersionLabel(label);
  return {
    id: "ver_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
    label,
    major,
    minor,
    title: snapshot.title,
    desc: snapshot.desc,
    promptBody: snapshot.promptBody,
    metadata: snapshot.metadata,
    publishedAt: publishedAt || new Date().toISOString(),
    publishedBy: publishedBy || PUBLISHER_NAME,
    isLatest: !!isLatest
  };
}

function seedDemoHistory(prompt) {
  const latest = parseVersionLabel(prompt.ver || "v2.4");
  const versions = [];
  const steps = Math.min(4, latest.minor + 1);
  const startMinor = Math.max(0, latest.minor - (steps - 1));
  for (let i = 0; i < steps; i++) {
    const minor = startMinor + i;
    const label = formatVersionLabel(latest.major, minor);
    const isLatest = i === steps - 1;
    versions.push(
      versionFromSnapshot(
        snapshotFromPrompt(prompt),
        label,
        new Date(Date.now() - (steps - i) * 86400000 * 12).toISOString(),
        i === steps - 1 ? PUBLISHER_NAME : "nyris.system",
        isLatest
      )
    );
  }
  return { versions, draft: null };
}

function getVersionState(promptId, basePrompt) {
  const map = loadAllVersionStates();
  if (!map[promptId] && basePrompt) {
    map[promptId] = seedDemoHistory(basePrompt);
    saveAllVersionStates(map);
  }
  return map[promptId] || { versions: [], draft: null };
}

function persistVersionState(promptId, state) {
  const map = loadAllVersionStates();
  map[promptId] = state;
  saveAllVersionStates(map);
  return state;
}

function getLatestVersion(state) {
  if (!state || !state.versions || !state.versions.length) return null;
  return state.versions.find((v) => v.isLatest) || state.versions[state.versions.length - 1];
}

function trimVersions(versions) {
  const sorted = [...versions].sort((a, b) => {
    if (a.major !== b.major) return b.major - a.major;
    return b.minor - a.minor;
  });
  return sorted.slice(0, MAX_VERSIONS).map((v, i) => ({
    ...v,
    isLatest: i === 0
  }));
}

function publishPromptVersion(promptId, snapshot, basePrompt) {
  const state = getVersionState(promptId, basePrompt);
  const latest = getLatestVersion(state);
  const nextLabel = latest ? nextVersionLabel(latest.label) : formatVersionLabel(1, 0);
  const published = versionFromSnapshot(snapshot, nextLabel, new Date().toISOString(), PUBLISHER_NAME, true);
  const versions = trimVersions([
    published,
    ...(state.versions || []).map((v) => ({ ...v, isLatest: false }))
  ]);
  const next = { versions, draft: null };
  persistVersionState(promptId, next);
  return { state: next, version: published };
}

function savePromptDraft(promptId, snapshot, basePrompt) {
  const state = getVersionState(promptId, basePrompt);
  const next = {
    ...state,
    draft: {
      ...snapshot,
      savedAt: new Date().toISOString(),
      savedBy: PUBLISHER_NAME
    }
  };
  persistVersionState(promptId, next);
  return next;
}

function restorePromptVersion(promptId, versionId, basePrompt) {
  const state = getVersionState(promptId, basePrompt);
  const source = (state.versions || []).find((v) => v.id === versionId);
  if (!source) return null;
  const snapshot = {
    title: source.title,
    desc: source.desc,
    promptBody: source.promptBody,
    metadata: source.metadata
  };
  return publishPromptVersion(promptId, snapshot, basePrompt);
}

function mergePromptWithVersion(prompt, version) {
  if (!version) return prompt;
  return {
    ...prompt,
    title: version.title,
    desc: version.desc,
    promptBody: version.promptBody,
    ver: version.label,
    date: formatPublishedDate(version.publishedAt),
    what: version.metadata?.what || prompt.what,
    where: version.metadata?.where || prompt.where,
    impact: version.metadata?.impact || prompt.impact,
    publishedBy: version.publishedBy,
    publishedAt: version.publishedAt
  };
}

function usePromptVersions(promptId, basePrompt) {
  const [state, setState] = React.useState(() => getVersionState(promptId, basePrompt));
  const [selectedId, setSelectedId] = React.useState(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editBody, setEditBody] = React.useState("");
  const [editTitle, setEditTitle] = React.useState("");
  const [editDesc, setEditDesc] = React.useState("");
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const refresh = React.useCallback(() => {
    setState(getVersionState(promptId, basePrompt));
  }, [promptId, basePrompt]);

  React.useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener("nyris-prompt-versions-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("nyris-prompt-versions-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  React.useEffect(() => {
    setSelectedId(null);
    setIsEditing(false);
    setDropdownOpen(false);
  }, [promptId]);

  const latest = getLatestVersion(state);
  const selected =
    (state.versions || []).find((v) => v.id === selectedId) || latest;
  const isViewingOld = selected && latest && selected.id !== latest.id;
  const isReadOnly = isViewingOld && !isEditing;
  const hasDraft = !!(state.draft && state.draft.promptBody);

  React.useEffect(() => {
    if (isEditing && selected) {
      setEditBody(selected.promptBody || "");
      setEditTitle(selected.title || "");
      setEditDesc(selected.desc || "");
    }
  }, [isEditing, selected?.id]);

  React.useEffect(() => {
    if (!dropdownOpen) return undefined;
    const close = () => setDropdownOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [dropdownOpen]);

  const displayVersion = isEditing
    ? { ...selected, title: editTitle, desc: editDesc, promptBody: editBody }
    : selected;

  return {
    state,
    latest,
    selected: displayVersion,
    selectedId: selected ? selected.id : null,
    isViewingOld,
    isReadOnly,
    isEditing,
    hasDraft,
    dropdownOpen,
    setDropdownOpen,
    setSelectedId,
    setIsEditing,
    setEditBody,
    setEditTitle,
    setEditDesc,
    refresh,
    publish: (snapshot) => {
      const result = publishPromptVersion(promptId, snapshot, basePrompt);
      setState(result.state);
      setSelectedId(result.version.id);
      setIsEditing(false);
      return result;
    },
    saveDraft: (snapshot) => {
      const next = savePromptDraft(promptId, snapshot, basePrompt);
      setState(next);
      return next;
    },
    restore: (versionId) => {
      const result = restorePromptVersion(promptId, versionId, basePrompt);
      if (result) {
        setState(result.state);
        setSelectedId(result.version.id);
        setIsEditing(false);
      }
      return result;
    }
  };
}

function VersionPill({ versionLabel, isLatest, hasDraft, publishState }) {
  const dotClass =
    publishState === "draft" ? "ver-dot ver-dot--yellow" : "ver-dot ver-dot--green";
  return (
    <span className={"pcard-ver" + (hasDraft ? " pcard-ver--draft-pending" : "")}>
      <span className="ver">
        <span className={dotClass} aria-hidden="true" />
        {versionLabel}
        {isLatest ? " · latest" : ""}
        {hasDraft ? " · Draft pending" : ""}
      </span>
    </span>
  );
}

function PromptVersionBar({
  versioning,
  onPublish,
  onSaveDraft,
  onRestore,
  onEditRepublish,
  onCancelEdit
}) {
  const { state, latest, selected, isViewingOld, isReadOnly, isEditing, hasDraft, dropdownOpen, setDropdownOpen, setSelectedId } =
    versioning;
  const versions = (state.versions || []).slice().sort((a, b) => {
    if (a.major !== b.major) return b.major - a.major;
    return b.minor - a.minor;
  });

  if (!latest) return null;

  const current = selected || latest;

  return (
    <div className="pv-bar">
      <div className="pv-bar-left">
        <span className={"det-ver det-ver--published" + (isViewingOld && !isEditing ? " det-ver--historic" : "")}>
          <span className="ver-dot ver-dot--green" aria-hidden="true" />
          {current.label}
          {current.id === latest.id && !isEditing ? (
            <span className="muted"> (latest)</span>
          ) : null}
          {hasDraft && current.id === latest.id ? (
            <span className="pv-draft-tag"> · draft pending</span>
          ) : null}
        </span>

        <div className="pv-dropdown-wrap">
          <button
            type="button"
            className={"pv-dropdown-trigger" + (dropdownOpen ? " is-open" : "")}
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen((v) => !v);
            }}
          >
            Version history
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {dropdownOpen ? (
            <ul className="pv-dropdown" role="listbox" aria-label="Version history" onClick={(e) => e.stopPropagation()}>
              {versions.map((v) => {
                const active = current.id === v.id;
                return (
                  <li key={v.id} role="option" aria-selected={active}>
                    <button
                      type="button"
                      className={"pv-dropdown-item" + (active ? " is-active" : "")}
                      onClick={() => {
                        setSelectedId(v.id);
                        setDropdownOpen(false);
                      }}
                    >
                      <span className="pv-dropdown-item-main">
                        <strong>{v.label}</strong>
                        {v.isLatest ? <span className="pv-latest-chip">latest</span> : null}
                      </span>
                      <span className="pv-dropdown-item-meta">
                        {formatPublishedDate(v.publishedAt)} · {v.publishedBy}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        {isViewingOld && !isEditing ? (
          <span className="pv-readonly-tag">Read-only</span>
        ) : null}
      </div>

      <div className="pv-bar-actions">
        {isViewingOld && !isEditing ? (
          <>
            <button type="button" className="btn btn--outline btn--pill" onClick={() => onRestore(current.id)}>
              Restore this version
            </button>
            <button type="button" className="btn btn--primary btn--pill" onClick={onEditRepublish}>
              Edit and republish
            </button>
          </>
        ) : isEditing ? (
          <>
            <button type="button" className="btn btn--outline btn--pill" onClick={onCancelEdit}>
              Cancel edit
            </button>
            <button type="button" className="btn btn--primary btn--pill" onClick={onPublish}>
              Publish
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn--outline btn--pill" onClick={onSaveDraft}>
              Save as draft
            </button>
            <button type="button" className="btn btn--primary btn--pill" onClick={onPublish}>
              Publish
            </button>
          </>
        )}
      </div>
    </div>
  );
}

window.PROMPT_VERSIONS_KEY = PROMPT_VERSIONS_KEY;
window.usePromptVersions = usePromptVersions;
window.PromptVersionBar = PromptVersionBar;
window.VersionPill = VersionPill;
window.mergePromptWithVersion = mergePromptWithVersion;
window.snapshotFromPrompt = snapshotFromPrompt;
window.getVersionState = getVersionState;
window.formatPublishedDate = formatPublishedDate;
