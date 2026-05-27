/* eslint-disable */
// Catalogue — Requests screen (image search request log + mark correct results)

const MARKINGS_KEY = "nyris-request-markings-v1";
const CROPS_KEY = "nyris-request-crops-v1";
const CROP_MIN_SIZE = 0.08;
const CROP_HANDLES = ["nw", "ne", "sw", "se"];

const REQUEST_FILTERS = [
  { id: "no-results", label: "No results" },
  { id: "low-accuracy", label: "Low-accuracy matches" },
  { id: "negative-feedback", label: "Negative feedback" },
  { id: "response-time", label: "Based on response time" }
];

const REQ_IMG = (name) => "assets/requests/" + name;

const CATALOG_ITEMS = [
  { id: "cat-mt-042", sku: "MT-CPL-042", name: "Brass coupling 42mm", imageUrl: REQ_IMG("r2.jpg") },
  { id: "cat-mt-088", sku: "MT-CPL-088", name: "Hex reducer coupling", imageUrl: REQ_IMG("r4.jpg") },
  { id: "cat-mt-120", sku: "MT-CPL-120", name: "Threaded adapter M12", imageUrl: REQ_IMG("r6.jpg") },
  { id: "cat-mt-201", sku: "MT-FIT-201", name: "Pipe fitting elbow 90°", imageUrl: REQ_IMG("r3.jpg") },
  { id: "cat-mt-305", sku: "MT-UNI-305", name: "Universal brass union", imageUrl: REQ_IMG("r5.jpg") },
  { id: "cat-mt-410", sku: "MT-SEAL-410", name: "Compression seal ring kit", imageUrl: REQ_IMG("r7.jpg") }
];

function buildResultItems(imageNames, skuPrefix) {
  return imageNames.map((name, i) => ({
    id: skuPrefix + "-" + (i + 1),
    sku: skuPrefix + "-" + String(i + 1).padStart(3, "0"),
    imageUrl: name ? REQ_IMG(name) : null
  }));
}

const DEMO_REQUESTS = [
  {
    id: "req-demo-1",
    timestamp: "27/09/21, 14:35",
    responseMs: "1805.1 ms",
    feedback: "Positive",
    queryImage: REQ_IMG("query.jpg"),
    results: buildResultItems(
      ["r1.jpg", "r2.jpg", "r3.jpg", "r4.jpg", "r5.jpg", "r6.jpg", "r7.jpg", null, "r8.jpg", "r9.jpg"],
      "MT-CPL"
    )
  },
  {
    id: "req-demo-2",
    timestamp: "27/09/21, 13:12",
    responseMs: "1422.8 ms",
    feedback: "Neutral",
    queryImage: REQ_IMG("r3.jpg"),
    results: buildResultItems(["r2.jpg", "r4.jpg", "r5.jpg", "r6.jpg"], "MT-FIT")
  },
  {
    id: "req-demo-3",
    timestamp: "26/09/21, 09:48",
    responseMs: "2103.4 ms",
    feedback: "Negative",
    queryImage: REQ_IMG("r5.jpg"),
    results: buildResultItems(["r1.jpg", "r7.jpg", "r8.jpg", "r9.jpg", null], "MT-UNI")
  }
];

function loadMarkings() {
  try {
    const raw = localStorage.getItem(MARKINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMarkings(map) {
  localStorage.setItem(MARKINGS_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent("nyris-markings-updated"));
}

function getMarking(requestId) {
  return loadMarkings()[requestId] || null;
}

function setMarking(requestId, payload) {
  const map = loadMarkings();
  map[requestId] = payload;
  saveMarkings(map);
  return payload;
}

function removeMarking(requestId) {
  const map = loadMarkings();
  delete map[requestId];
  saveMarkings(map);
}

function loadCrops() {
  try {
    const raw = localStorage.getItem(CROPS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCrops(map) {
  localStorage.setItem(CROPS_KEY, JSON.stringify(map));
}

function getCrop(requestId) {
  return loadCrops()[requestId] || null;
}

function setCrop(requestId, payload) {
  const map = loadCrops();
  map[requestId] = payload;
  saveCrops(map);
  return payload;
}

function clearCrop(requestId) {
  const map = loadCrops();
  delete map[requestId];
  saveCrops(map);
}

function getAssignmentImageUrl(request, cropData) {
  if (cropData && cropData.croppedImageDataUrl) return cropData.croppedImageDataUrl;
  return request.queryImage;
}

function clampCrop(rect) {
  const min = CROP_MIN_SIZE;
  let { x, y, w, h } = rect;
  w = Math.max(min, Math.min(1, w));
  h = Math.max(min, Math.min(1, h));
  x = Math.max(0, Math.min(1 - w, x));
  y = Math.max(0, Math.min(1 - h, y));
  return { x, y, w, h };
}

function defaultCropRect() {
  return { x: 0.12, y: 0.12, w: 0.76, h: 0.76 };
}

function cropImageToDataUrl(imageUrl, normRect) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const rect = clampCrop(normRect);
      const sx = Math.round(rect.x * img.naturalWidth);
      const sy = Math.round(rect.y * img.naturalHeight);
      const sw = Math.max(1, Math.round(rect.w * img.naturalWidth));
      const sh = Math.max(1, Math.round(rect.h * img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
}

function buildMarkPayload(request, item, cropData, extra) {
  const assignmentImage = getAssignmentImageUrl(request, cropData);
  const isCropped = !!(cropData && cropData.croppedImageDataUrl);
  return {
    request_id: request.id,
    request_image_url: request.queryImage,
    correct_item_id: item.id,
    correct_item_sku: item.sku,
    correct_item_image_url: item.imageUrl,
    assigned_request_image: assignmentImage,
    is_cropped: isCropped,
    cropped_image_url: isCropped ? cropData.croppedImageDataUrl : null,
    marked_at: new Date().toISOString(),
    ...extra
  };
}

function getAllMarkings() {
  return Object.values(loadMarkings());
}

function exportMarkingsCsv() {
  const rows = getAllMarkings();
  const header =
    "request_id,request_image_url,correct_item_id,correct_item_sku,marked_at,is_cropped,cropped_image_url";
  const body = rows
    .map((m) =>
      [
        m.request_id,
        m.request_image_url,
        m.correct_item_id,
        m.correct_item_sku,
        m.marked_at,
        m.is_cropped ? "true" : "false",
        m.cropped_image_url || ""
      ]
        .map((v) => '"' + String(v || "").replace(/"/g, '""') + '"')
        .join(",")
    )
    .join("\n");
  return header + "\n" + body;
}

function exportMarkingsJson() {
  return JSON.stringify(getAllMarkings(), null, 2);
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function IconChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2.5v7M8 9.5l2.5-2.5M8 9.5L5.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconQa() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 8.2l1.8 1.8 3.2-3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M14.5 9a5.5 5.5 0 1 1-1.6-3.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14.5 4.5V9h-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.2 10.2L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconHelp() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3.5 4.5h11a1.5 1.5 0 0 1 1.5 1.5v5.5a1.5 1.5 0 0 1-1.5 1.5H8.2L5 15.5V13H3.5a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M7.2 7.4a1.6 1.6 0 0 1 2.9.9c0 1-1.3 1.2-1.3 2.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="8.6" cy="12.6" r="0.65" fill="currentColor" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M7.5 10.5l2.8-2.8a2.3 2.3 0 0 1 3.25 3.25l-2.8 2.8a2.3 2.3 0 0 1-3.25-3.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10.5 7.5l-2.8 2.8a2.3 2.3 0 0 1-3.25-3.25l2.8-2.8a2.3 2.3 0 0 1 3.25 3.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2.5 9s2.5-4.5 6.5-4.5S15.5 9 15.5 9s-2.5 4.5-6.5 4.5S2.5 9 2.5 9z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function IconBrokenImage() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <rect x="4.5" y="6.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8.5 16l3.5-3.5 2.8 2.8 3.2-3.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="10" r="0.9" fill="currentColor" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.2 7.1l1.9 1.9 3.7-4.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheckFilled() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="11" fill="rgb(0, 168, 107)" />
      <path d="M6.5 11.2l2.8 2.8 5.7-6.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCrop() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4.5 2.5v4M2.5 4.5h4M11.5 13.5v-4M13.5 11.5h-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="5.5" y="5.5" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function ReqConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }) {
  return (
    <div className="req-modal-scrim" role="presentation" onClick={onCancel}>
      <div
        className="modal req-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="req-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2 className="modal-title" id="req-confirm-title">{title}</h2>
            <p className="modal-sub">{message}</p>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn--outline" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function CropModal({ imageUrl, initialRect, onApply, onCancel }) {
  const viewportRef = React.useRef(null);
  const [crop, setCrop] = React.useState(() => clampCrop(initialRect || defaultCropRect()));
  const [layout, setLayout] = React.useState(null);
  const dragRef = React.useRef(null);

  const updateLayout = React.useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const box = viewport.getBoundingClientRect();
    setLayout({ w: box.width, h: box.height });
  }, []);

  React.useEffect(() => {
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, [updateLayout]);

  const cropPx = React.useMemo(() => {
    if (!layout) return null;
    return {
      left: crop.x * layout.w,
      top: crop.y * layout.h,
      width: crop.w * layout.w,
      height: crop.h * layout.h
    };
  }, [crop, layout]);

  const pointerToNorm = (clientX, clientY) => {
    const viewport = viewportRef.current;
    if (!viewport || !layout) return null;
    const box = viewport.getBoundingClientRect();
    const x = (clientX - box.left) / box.width;
    const y = (clientY - box.top) / box.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  };

  const onPointerDown = (e, mode, handle) => {
    e.preventDefault();
    e.stopPropagation();
    const start = pointerToNorm(e.clientX, e.clientY);
    if (!start) return;
    dragRef.current = { mode, handle, start, startCrop: { ...crop } };
  };

  React.useEffect(() => {
    const onMove = (e) => {
      const drag = dragRef.current;
      if (!drag || !layout) return;
      const pt = pointerToNorm(e.clientX, e.clientY);
      if (!pt) return;
      const dx = pt.x - drag.start.x;
      const dy = pt.y - drag.start.y;
      const s = drag.startCrop;

      if (drag.mode === "move") {
        setCrop(clampCrop({ x: s.x + dx, y: s.y + dy, w: s.w, h: s.h }));
        return;
      }

      let x = s.x;
      let y = s.y;
      let w = s.w;
      let h = s.h;
      const hnd = drag.handle;

      if (hnd === "nw") {
        x = s.x + dx;
        y = s.y + dy;
        w = s.w - dx;
        h = s.h - dy;
      } else if (hnd === "ne") {
        y = s.y + dy;
        w = s.w + dx;
        h = s.h - dy;
      } else if (hnd === "sw") {
        x = s.x + dx;
        w = s.w - dx;
        h = s.h + dy;
      } else if (hnd === "se") {
        w = s.w + dx;
        h = s.h + dy;
      }
      setCrop(clampCrop({ x, y, w, h }));
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [layout]);

  const handleCrop = async () => {
    try {
      const dataUrl = await cropImageToDataUrl(imageUrl, crop);
      onApply({ croppedImageDataUrl: dataUrl, cropRect: crop });
    } catch {
      onApply(null);
    }
  };

  return (
    <div className="req-modal-scrim" role="presentation" onClick={onCancel}>
      <div
        className="modal req-crop-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="req-crop-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2 className="modal-title" id="req-crop-title">Crop image</h2>
            <p className="modal-sub">
              Drag the box to move it. Use corner handles to resize. The original image is not changed.
            </p>
          </div>
          <button type="button" className="modal-close" aria-label="Close" onClick={onCancel}>
            ×
          </button>
        </div>

        <div className="req-crop-viewport" ref={viewportRef}>
          <img src={imageUrl} alt="" className="req-crop-image" draggable={false} onLoad={updateLayout} />
          {cropPx ? (
            <div
              className="req-crop-box"
              style={{
                left: cropPx.left,
                top: cropPx.top,
                width: cropPx.width,
                height: cropPx.height
              }}
            >
              <div
                className="req-crop-drag"
                onPointerDown={(e) => onPointerDown(e, "move")}
                aria-label="Drag crop area"
              />
              {CROP_HANDLES.map((handle) => (
                <span
                  key={handle}
                  className={"req-crop-handle req-crop-handle--" + handle}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onPointerDown(e, "resize", handle);
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn--outline" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={handleCrop}>
            Crop
          </button>
        </div>
      </div>
    </div>
  );
}

function RequestImagePanel({ request, cropData, onCropClick, onClearCrop }) {
  const hasCrop = !!(cropData && cropData.croppedImageDataUrl);
  return (
    <div className="req-image-panel">
      <div className={"req-image-duo" + (hasCrop ? " req-image-duo--split" : "")}>
        <figure className="req-image-figure">
          <figcaption className="req-image-label">Original</figcaption>
          <div className="req-image-frame">
            <img src={request.queryImage} alt="Original request" />
          </div>
        </figure>
        {hasCrop ? (
          <figure className="req-image-figure">
            <figcaption className="req-image-label">Cropped for assignment</figcaption>
            <div className="req-image-frame req-image-frame--cropped">
              <img src={cropData.croppedImageDataUrl} alt="Cropped for assignment" />
              <span className="req-crop-badge" title="Cropped variant used for assignment">
                Cropped
              </span>
            </div>
          </figure>
        ) : null}
      </div>
      <div className="req-image-actions">
        <button type="button" className="req-btn req-btn--crop" onClick={onCropClick}>
          <IconCrop />
          {hasCrop ? "Re-crop Image" : "Crop Image"}
        </button>
        {hasCrop ? (
          <button type="button" className="req-btn req-btn--crop-clear" onClick={onClearCrop}>
            Clear crop
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ReqToast({ message, onDone }) {
  React.useEffect(() => {
    const t = setTimeout(() => onDone(), 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="req-toast" role="status">
      <IconCheckFilled />
      <span>{message}</span>
    </div>
  );
}

function ReqSelect({ label, value, wide }) {
  return (
    <label className={"req-field" + (wide ? " req-field--wide" : "")}>
      <span className="req-field-label">{label}</span>
      <span className="req-field-control">
        <span className="req-field-value">{value}</span>
        <IconChevronDown />
      </span>
    </label>
  );
}

function findRequest(id) {
  return DEMO_REQUESTS.find((r) => r.id === id) || null;
}

function RequestResultThumb({ item, isCorrect, onMark }) {
  if (!item.imageUrl) {
    return (
      <div className={"req-result-cell req-thumb req-thumb--missing" + (isCorrect ? " req-result-cell--correct" : "")}>
        <IconBrokenImage />
        {isCorrect ? <span className="req-correct-badge"><IconCheckFilled /></span> : null}
      </div>
    );
  }
  return (
    <div className={"req-result-cell" + (isCorrect ? " req-result-cell--correct" : "")}>
      <div className="req-thumb">
        <img src={item.imageUrl} alt="" loading="lazy" />
        {isCorrect ? <span className="req-correct-badge"><IconCheckFilled /></span> : null}
      </div>
      <button
        type="button"
        className={"req-mark-btn" + (isCorrect ? " req-mark-btn--active" : "")}
        onClick={() => onMark(item)}
        aria-label={isCorrect ? "Marked as correct" : "Mark as correct result"}
        aria-pressed={isCorrect}
      >
        <IconCheck />
        {isCorrect ? "Correct" : "Mark correct"}
      </button>
    </div>
  );
}

function RequestRow({ request, marking, onOpen }) {
  const isMarked = !!marking;
  return (
    <article className={"req-row" + (isMarked ? " req-row--marked" : "")}>
      {isMarked ? (
        <span className="req-marked-badge" title="Correct result marked">
          <span className="req-marked-badge-dot" aria-hidden="true" />
          Marked
        </span>
      ) : null}
      <div className="req-row-query">
        <img src={request.queryImage} alt="Query" />
      </div>
      <div className="req-row-body">
        <div className="req-row-top">
          <div className="req-row-meta">
            <span>{request.timestamp}</span>
            <span className="req-row-meta-sep" aria-hidden="true" />
            <span>{request.responseMs}</span>
            <span className="req-row-meta-sep" aria-hidden="true" />
            <span>
              Feedback <strong>{request.feedback}</strong>
            </span>
            {isMarked ? (
              <>
                <span className="req-row-meta-sep" aria-hidden="true" />
                <span className="req-row-meta-marked">
                  SKU <strong>{marking.correct_item_sku}</strong>
                </span>
                {marking.is_cropped ? (
                  <span className="req-crop-badge req-crop-badge--inline">Cropped</span>
                ) : null}
              </>
            ) : null}
          </div>
          <div className="req-row-actions">
            <button type="button" className="req-icon-btn" aria-label="Help">
              <IconHelp />
            </button>
            <button type="button" className="req-icon-btn" aria-label="Copy link">
              <IconLink />
            </button>
            <button
              type="button"
              className="req-icon-btn"
              aria-label="View request details"
              onClick={() => onOpen(request.id)}
            >
              <IconEye />
            </button>
          </div>
        </div>
        <div className="req-row-results req-row-results--compact">
          {request.results.slice(0, 10).map((item, i) =>
            item.imageUrl ? (
              <div className="req-thumb req-thumb--list" key={request.id + "-t-" + i}>
                <img src={item.imageUrl} alt="" loading="lazy" />
              </div>
            ) : (
              <div className="req-thumb req-thumb--missing req-thumb--list" key={request.id + "-t-" + i}>
                <IconBrokenImage />
              </div>
            )
          )}
        </div>
      </div>
    </article>
  );
}

function AlternateItemSearch({ request, marking, onMarkExternal }) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return CATALOG_ITEMS.filter(
      (item) =>
        item.sku.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query]);

  const pick = (item) => {
    onMarkExternal(item);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="req-alt-mark">
      <button type="button" className="req-alt-mark-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? "Cancel" : "Mark a different item as correct"}
      </button>
      {open ? (
        <div className="req-alt-mark-panel">
          <label className="req-alt-mark-search">
            <IconSearch />
            <input
              type="search"
              className="req-search-input"
              placeholder="Search by SKU or name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </label>
          {query.trim() && results.length === 0 ? (
            <p className="req-alt-mark-empty">No items match &ldquo;{query}&rdquo;</p>
          ) : null}
          {results.length > 0 ? (
            <ul className="req-sku-dropdown" role="listbox">
              {results.map((item) => {
                const selected =
                  marking &&
                  marking.correct_item_id === item.id &&
                  marking.source === "search";
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={"req-sku-option" + (selected ? " is-selected" : "")}
                      onClick={() => pick(item)}
                      role="option"
                      aria-selected={selected}
                    >
                      <span className="req-sku-option-thumb">
                        <img src={item.imageUrl} alt="" />
                      </span>
                      <span className="req-sku-option-text">
                        <strong>{item.sku}</strong>
                        <span>{item.name}</span>
                      </span>
                      {selected ? <IconCheckFilled /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function RequestDetailPage({ requestId }) {
  const request = findRequest(requestId);
  const [marking, setMarkingState] = React.useState(() => getMarking(requestId));
  const [cropData, setCropDataState] = React.useState(() => getCrop(requestId));
  const [toast, setToast] = React.useState(null);
  const [cropModalOpen, setCropModalOpen] = React.useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = React.useState(false);

  React.useEffect(() => {
    setMarkingState(getMarking(requestId));
    setCropDataState(getCrop(requestId));
  }, [requestId]);

  const persistMark = (payload) => {
    setMarking(requestId, payload);
    setMarkingState(payload);
    setToast("Result marked as correct");
  };

  const refreshMarkingWithCrop = (existing) => {
    if (!existing || !request) return;
    const updated = buildMarkPayload(
      request,
      {
        id: existing.correct_item_id,
        sku: existing.correct_item_sku,
        imageUrl: existing.correct_item_image_url
      },
      cropData,
      {
        source: existing.source,
        result_index: existing.result_index
      }
    );
    setMarking(requestId, updated);
    setMarkingState(updated);
  };

  const markFromResult = (item) => {
    if (!request) return;
    persistMark(
      buildMarkPayload(request, item, cropData, {
        source: "result",
        result_index: request.results.findIndex((r) => r.id === item.id)
      })
    );
  };

  const markFromSearch = (item) => {
    if (!request) return;
    persistMark(buildMarkPayload(request, item, cropData, { source: "search" }));
  };

  const handleCropApply = (payload) => {
    setCropModalOpen(false);
    if (!payload) {
      setToast("Could not crop image");
      return;
    }
    setCrop(requestId, payload);
    setCropDataState(payload);
    if (marking) refreshMarkingWithCrop(marking);
    setToast("Image cropped for assignment");
  };

  const handleClearCrop = () => {
    clearCrop(requestId);
    setCropDataState(null);
    if (marking) {
      const updated = buildMarkPayload(
        request,
        {
          id: marking.correct_item_id,
          sku: marking.correct_item_sku,
          imageUrl: marking.correct_item_image_url
        },
        null,
        { source: marking.source, result_index: marking.result_index }
      );
      setMarking(requestId, updated);
      setMarkingState(updated);
    }
  };

  const handleRemoveAssignment = () => {
    removeMarking(requestId);
    setMarkingState(null);
    setConfirmRemoveOpen(false);
    setToast("Assignment removed");
  };

  const isResultCorrect = (item) =>
    marking && marking.source !== "search" && marking.correct_item_id === item.id;

  const Shell = window.AppShell;
  if (!Shell) {
    return <div className="pl-panel pl-panel--requests"><p>Loading…</p></div>;
  }

  if (!request) {
    return (
      <Shell sidebarActive="requests" panelClassName="pl-panel--requests">
        <div className="req-page">
          <button type="button" className="det-back" onClick={() => window.go("/requests")}>
            ← Back to requests
          </button>
          <h1 className="req-title">Request not found</h1>
        </div>
      </Shell>
    );
  }

  return (
    <Shell sidebarActive="requests" panelClassName="pl-panel--requests">
      <div className="req-page req-page--detail">
        <button type="button" className="det-back" onClick={() => window.go("/requests")}>
          ← Back to requests
        </button>
        <div className="req-detail-head">
          <h1 className="req-title">Request details</h1>
          <span className="req-detail-id">{request.id}</span>
        </div>

        <div className="req-list-card req-detail-card">
          <div className="req-detail-summary">
            <RequestImagePanel
              request={request}
              cropData={cropData}
              onCropClick={() => setCropModalOpen(true)}
              onClearCrop={handleClearCrop}
            />
            <div className="req-detail-meta">
              <span>{request.timestamp}</span>
              <span className="req-row-meta-sep" aria-hidden="true" />
              <span>{request.responseMs}</span>
              <span className="req-row-meta-sep" aria-hidden="true" />
              <span>
                Feedback <strong>{request.feedback}</strong>
              </span>
            </div>
          </div>

          {marking ? (
            <div className="req-assignment-card">
              <div className="req-assignment-card-body">
                <span className="req-correct-badge req-assignment-check">
                  <IconCheckFilled />
                </span>
                <div>
                  <p className="req-assignment-title">Assignment</p>
                  <p className="req-assignment-sku">
                    Correct item: <strong>{marking.correct_item_sku}</strong>
                  </p>
                  <p className="req-image-linked">
                    {marking.is_cropped
                      ? "Cropped request image assigned to this item"
                      : "Request image assigned to this item"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="req-btn req-btn--remove"
                onClick={() => setConfirmRemoveOpen(true)}
              >
                Remove assignment
              </button>
            </div>
          ) : null}

          <div className="req-detail-results">
            <h2 className="req-detail-section-title">Search results</h2>
            <p className="req-detail-hint">Mark the result that was actually correct for this request.</p>
            <div className="req-results-grid">
              {request.results.map((item) => (
                <RequestResultThumb
                  key={item.id}
                  item={item}
                  isCorrect={isResultCorrect(item)}
                  onMark={markFromResult}
                />
              ))}
            </div>

            {marking && marking.source === "search" ? (
              <div className="req-external-correct">
                <div className="req-external-correct-thumb">
                  <img src={marking.correct_item_image_url} alt="" />
                  <span className="req-correct-badge"><IconCheckFilled /></span>
                </div>
                <div>
                  <p className="req-external-correct-label">Marked from catalogue search</p>
                  <p className="req-external-correct-sku">
                    <strong>{marking.correct_item_sku}</strong>
                  </p>
                  <p className="req-image-linked">
                    {marking.is_cropped
                      ? "Cropped request image assigned to this item"
                      : "Request image assigned to this item"}
                  </p>
                </div>
              </div>
            ) : null}

            <AlternateItemSearch
              request={request}
              marking={marking}
              onMarkExternal={markFromSearch}
            />
          </div>
        </div>
      </div>
      {cropModalOpen ? (
        <CropModal
          imageUrl={request.queryImage}
          initialRect={cropData ? cropData.cropRect : defaultCropRect()}
          onApply={handleCropApply}
          onCancel={() => setCropModalOpen(false)}
        />
      ) : null}
      {confirmRemoveOpen ? (
        <ReqConfirmDialog
          title="Remove assignment"
          message="Are you sure you want to remove this assignment?"
          confirmLabel="Remove"
          onConfirm={handleRemoveAssignment}
          onCancel={() => setConfirmRemoveOpen(false)}
        />
      ) : null}
      {toast ? <ReqToast message={toast} onDone={() => setToast(null)} /> : null}
    </Shell>
  );
}

function RequestsListPage() {
  const [activeFilter, setActiveFilter] = React.useState(null);
  const [showMarkedOnly, setShowMarkedOnly] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [perPage, setPerPage] = React.useState("100");
  const [markings, setMarkings] = React.useState(loadMarkings);

  const refreshMarkings = () => setMarkings(loadMarkings());

  React.useEffect(() => {
    const onUpdate = () => refreshMarkings();
    const onStorage = (e) => {
      if (e.key === MARKINGS_KEY) refreshMarkings();
    };
    window.addEventListener("nyris-markings-updated", onUpdate);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("nyris-markings-updated", onUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggleFilter = (id) => {
    setActiveFilter((prev) => (prev === id ? null : id));
  };

  const filteredRequests = DEMO_REQUESTS.filter((req) => {
    if (showMarkedOnly && !markings[req.id]) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!req.id.toLowerCase().includes(q) && !req.feedback.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleExport = (format) => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "json") {
      downloadFile("marked-mappings-" + stamp + ".json", exportMarkingsJson(), "application/json");
    } else {
      downloadFile("marked-mappings-" + stamp + ".csv", exportMarkingsCsv(), "text/csv");
    }
  };

  const Shell = window.AppShell;
  if (!Shell) {
    return (
      <div className="pl-panel pl-panel--requests">
        <h1 className="req-title">Requests</h1>
        <p className="pl-subtitle">Loading…</p>
      </div>
    );
  }

  return (
    <Shell sidebarActive="requests" panelClassName="pl-panel--requests">
      <div className="req-page">
        <h1 className="req-title">Requests</h1>

        <div className="req-toolbar-card">
          <div className="req-toolbar">
            <div className="req-toolbar-fields">
              <ReqSelect label="Index" value="mechatech..." />
              <ReqSelect label="App name" value="default_app" />
              <ReqSelect label="Date" value="01-01-2025 to 30-06-2025" wide />
            </div>
            <div className="req-toolbar-actions">
              <button type="button" className="req-btn req-btn--download">
                <IconDownload />
                Download Request Log
              </button>
              <button type="button" className="req-btn req-btn--qa">
                <IconQa />
                Run QA
              </button>
              <div className="req-export-group">
                <button
                  type="button"
                  className="req-btn req-btn--export"
                  onClick={() => handleExport("csv")}
                  disabled={getAllMarkings().length === 0}
                  title={getAllMarkings().length === 0 ? "No marked mappings yet" : "Export as CSV"}
                >
                  <IconDownload />
                  Export CSV
                </button>
                <button
                  type="button"
                  className="req-btn req-btn--export-outline"
                  onClick={() => handleExport("json")}
                  disabled={getAllMarkings().length === 0}
                >
                  JSON
                </button>
              </div>
              <button type="button" className="req-refresh" aria-label="Refresh" onClick={refreshMarkings}>
                <IconRefresh />
              </button>
            </div>
          </div>
        </div>

        <div className="req-filters">
          <span className="req-filters-label">Filter by</span>
          {REQUEST_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={"req-filter-chip" + (activeFilter === f.id ? " is-active" : "")}
              onClick={() => toggleFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            className={"req-filter-chip req-filter-chip--marked" + (showMarkedOnly ? " is-active" : "")}
            onClick={() => setShowMarkedOnly((v) => !v)}
          >
            Show only marked requests
          </button>
        </div>

        <div className="req-search-row">
          <label className="req-search">
            <IconSearch />
            <input
              type="search"
              className="req-search-input"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="req-per-page">
            <span className="req-per-page-label">Items per page:</span>
            <select
              className="req-per-page-select"
              value={perPage}
              onChange={(e) => setPerPage(e.target.value)}
              aria-label="Items per page"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
        </div>

        <div className="req-list-card">
          <div className="req-list">
            {filteredRequests.length === 0 ? (
              <p className="req-list-empty">No requests match the current filters.</p>
            ) : (
              filteredRequests.map((req) => (
                <RequestRow
                  key={req.id}
                  request={req}
                  marking={markings[req.id]}
                  onOpen={(id) => window.go("/requests/" + id)}
                />
              ))
            )}
          </div>
          <footer className="req-footer">
            <label className="req-footer-per-page">
              <span>Items per page:</span>
              <select
                className="req-per-page-select req-per-page-select--footer"
                value={perPage}
                onChange={(e) => setPerPage(e.target.value)}
                aria-label="Items per page"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
            <span className="req-footer-range">476-500 items</span>
            <div className="req-footer-pages">
              <span className="req-footer-page-label">page</span>
              <strong>20</strong>
              <button type="button" className="req-page-btn" aria-label="Previous page">
                ‹
              </button>
              <button type="button" className="req-page-btn" aria-label="Next page">
                ›
              </button>
            </div>
          </footer>
        </div>
      </div>
    </Shell>
  );
}

function RequestsPage() {
  const route = window.useRoute ? window.useRoute() : { route: "requests", arg: null };
  if (route.arg && route.route === "requests") {
    return <RequestDetailPage requestId={route.arg} />;
  }
  return <RequestsListPage />;
}

window.RequestsPage = RequestsPage;
window.REQUEST_MARKINGS_KEY = MARKINGS_KEY;
window.REQUEST_CROPS_KEY = CROPS_KEY;
window.loadRequestMarkings = loadMarkings;
window.loadRequestCrops = loadCrops;
