"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import useAnnotatorStore from "@/store/useAnnotatorStore";
import { IAnnotationPayload } from "@/models/annotators";

/* ============================================================================
 * TYPES — matches the shape of the object you get back from the API
 * ==========================================================================*/

interface AnatomyImage {
  id: string;
  case: string;
  image: string;
}

interface CaseType {
  id: string;
  title: string;
  slug: string;
}

export interface IAnnotationCase {
  id: string;
  title: string;
  slug: string;
  case_type: CaseType;
  description: string;
  images: AnatomyImage[];
  annotated_images: AnatomyImage[];
  created_at: string;
  updated_at: string;
}

interface Point {
  x: number; // percentage 0-100, relative to the rendered image box
  y: number; // percentage 0-100
}

interface Annotation {
  id: string;
  classLabel: string;
  color: string;
  points: Point[];
  closed: boolean;
}

/** annotations keyed by image id */
type AnnotationMap = Record<string, Annotation[]>;

type Tool = "draw" | "delete";

/* ============================================================================
 * CONSTANTS
 * ==========================================================================*/

const CLASS_OPTIONS = [
  { value: "TUMOR", label: "Tumor", color: "#dc2626" },
  { value: "EDEMA", label: "Edema", color: "#2563eb" },
  { value: "NECROSIS", label: "Necrosis", color: "#7c3aed" },
  { value: "other", label: "Other", color: "#059669" },
] as const;

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;
const CLOSE_THRESHOLD = 3;
const WHEEL_NAV_COOLDOWN_MS = 350;

/* ============================================================================
 * ICONS — plain inline SVG, zero extra dependencies
 * ==========================================================================*/

function IconWrap({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}
const ChevronLeft = () => (
  <IconWrap>
    <path d="M15 18l-6-6 6-6" />
  </IconWrap>
);
const ChevronRight = () => (
  <IconWrap>
    <path d="M9 18l6-6-6-6" />
  </IconWrap>
);
const PencilIcon = () => (
  <IconWrap>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </IconWrap>
);
const ZoomOutIcon = () => (
  <IconWrap>
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
    <path d="M8 11h6" />
  </IconWrap>
);
const ZoomInIcon = () => (
  <IconWrap>
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
    <path d="M11 8v6M8 11h6" />
  </IconWrap>
);
const ZoomResetIcon = () => (
  <IconWrap>
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M16 3h3a2 2 0 0 1 2 2v3" />
    <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </IconWrap>
);
const TrashIcon = () => (
  <IconWrap>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </IconWrap>
);
const UndoIcon = () => (
  <IconWrap>
    <path d="M3 7v6h6" />
    <path d="M3 13a9 9 0 1 0 3-7.7L3 7" />
  </IconWrap>
);
const RedoIcon = () => (
  <IconWrap>
    <path d="M21 7v6h-6" />
    <path d="M21 13a9 9 0 1 1-3-7.7L21 7" />
  </IconWrap>
);
const SaveIcon = () => (
  <IconWrap>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <path d="M17 21v-8H7v8" />
    <path d="M7 3v5h8" />
  </IconWrap>
);

/* ============================================================================
 * HELPERS
 * ==========================================================================*/

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function pointsToPath(points: Point[], closed: boolean) {
  if (points.length === 0) return "";
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
    .join(" ");
  return closed ? `${d} Z` : d;
}

/* ============================================================================
 * COMPONENT
 * ==========================================================================*/

export default function AnnotateImage() {
  const { slug } = useParams<{ slug: string }>();
  const { getCase, isLoading, saveAnnotationByImage } = useAnnotatorStore();

  const [caseObj, setCaseObj] = useState<IAnnotationCase>(
    {} as IAnnotationCase,
  );


  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function getAnatomyCase() {
      const obj = await getCase(slug);
      if (!cancelled) setCaseObj(obj as IAnnotationCase);
    }

    getAnatomyCase();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const images = caseObj.images ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentImage = images[currentIndex];

  const [selectedClass, setSelectedClass] = useState<(typeof CLASS_OPTIONS)[number]["value"]>(CLASS_OPTIONS[0].value);
  const activeClassInfo = CLASS_OPTIONS.find((c) => c.value === selectedClass) ?? CLASS_OPTIONS[0];

  const [hideAnnotations, setHideAnnotations] = useState(false);
  const [hideReview, setHideReview] = useState(false);
  const [ctWindow, setCtWindow] = useState(false);

  const [tool, setTool] = useState<Tool>("draw");
  const [zoom, setZoom] = useState(1);

  const [annotationsByImage, setAnnotationsByImage] = useState<AnnotationMap>({});
  const [drawingAnnotation, setDrawingAnnotation] = useState<Annotation | null>(null);

  const [history, setHistory] = useState<AnnotationMap[]>([{}]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [savedFlash, setSavedFlash] = useState(false);

  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 });
  const [box, setBox] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const wheelCooldownRef = useRef(0);

  const draggingRef = useRef<{
    annotationId: string;
    pointIndex: number;
    isDrawing: boolean;
  } | null>(null);

  const currentAnnotations =
    (currentImage && annotationsByImage[currentImage.id]) || [];


  useEffect(() => {
    if (!caseObj.id) return;

    // Jump back to the first slice and clear any in-progress
    // drawing/zoom state left over from the previous case.
    setCurrentIndex(0);
    setZoom(1);
    setTool("draw");
    setDrawingAnnotation(null);

    try {
      const raw = localStorage.getItem(`annotations_${caseObj.id}`);
      const parsed: AnnotationMap = raw ? JSON.parse(raw) : {};
      setAnnotationsByImage(parsed);
      setHistory([parsed]);
      setHistoryIndex(0);
    } catch {
      setAnnotationsByImage({});
      setHistory([{}]);
      setHistoryIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseObj.id]);

  function commitAnnotations(next: AnnotationMap) {
    const trimmed = history.slice(0, historyIndex + 1);
    const nextHistory = [...trimmed, next];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setAnnotationsByImage(next);
  }

  function handleSave() {
    if (!caseObj.id) return;
    localStorage.setItem(
      `annotations_${caseObj.id}`,
      JSON.stringify(annotationsByImage),
    );
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);

    console.log('___annotationsByImage___', annotationsByImage);
  }

  function handleUndo() {
    if (historyIndex === 0) return;
    const idx = historyIndex - 1;
    setHistoryIndex(idx);
    setAnnotationsByImage(history[idx]);
    setDrawingAnnotation(null);
  }

  function handleRedo() {
    if (historyIndex === history.length - 1) return;
    const idx = historyIndex + 1;
    setHistoryIndex(idx);
    setAnnotationsByImage(history[idx]);
  }

  /* ---------------- Navigation ---------------- */

  const goPrev = useCallback(() => {
    setDrawingAnnotation(null);
    setCurrentIndex((i) => clamp(i - 1, 0, images.length - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setDrawingAnnotation(null);
    setCurrentIndex((i) => clamp(i + 1, 0, images.length - 1));
  }, [images.length]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") setDrawingAnnotation(null);
      if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.shiftKey ? handleRedo() : handleUndo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goPrev, goNext, historyIndex, history]);

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // pinch / ctrl+wheel => zoom
      setZoom((z) =>
        clamp(z + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP), ZOOM_MIN, ZOOM_MAX),
      );
      return;
    }
    const now = Date.now();
    if (now - wheelCooldownRef.current < WHEEL_NAV_COOLDOWN_MS) return;
    wheelCooldownRef.current = now;
    e.deltaY > 0 ? goNext() : goPrev();
  }

  /* ---------------- Zoom controls ---------------- */

  const zoomIn = () => setZoom((z) => clamp(z + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX));
  const zoomOut = () => setZoom((z) => clamp(z - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX));
  const zoomReset = () => setZoom(1);

  /* ---------------- Image box measurement (for correct overlay mapping) --- */

  useEffect(() => {
    function recalc() {
      const el = containerRef.current;
      if (!el || !naturalSize.w || !naturalSize.h) return;
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      const imgRatio = naturalSize.w / naturalSize.h;
      const boxRatio = cw / ch;
      let width: number;
      let height: number;
      if (imgRatio > boxRatio) {
        width = cw;
        height = cw / imgRatio;
      } else {
        height = ch;
        width = ch * imgRatio;
      }
      setBox({ width, height });
    }
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [naturalSize]);

  /* ---------------- Drawing / editing annotations ---------------- */
  function getRelativePoint(e: { clientX: number; clientY: number }): Point {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
  }

  function handleSvgClick(e: React.MouseEvent) {
    if (draggingRef.current) return;
    if (tool !== "draw" || !currentImage) return;

    const pt = getRelativePoint(e);

    if (drawingAnnotation) {

      // calculate euclidean distance of 2 points
      const first = drawingAnnotation.points[0];
      const dist = Math.hypot(pt.x - first.x, pt.y - first.y);
      if (drawingAnnotation.points.length >= 3 && dist < CLOSE_THRESHOLD) {
        finishAnnotation(drawingAnnotation);
        return;
      }
      setDrawingAnnotation({
        ...drawingAnnotation,
        points: [...drawingAnnotation.points, pt],
      });
    } else {
      setDrawingAnnotation({
        id: uid(),
        classLabel: activeClassInfo.value,
        color: activeClassInfo.color,
        points: [pt],
        closed: false,
      });
    }
  }

  function handleSvgDoubleClick() {
    if (drawingAnnotation && drawingAnnotation.points.length >= 3) {
      finishAnnotation(drawingAnnotation);
    }
  }


  async function finishAnnotation(ann: Annotation) {
    const payload = {
      class_label: drawingAnnotation?.classLabel,
      annotated_color: drawingAnnotation?.color,
      image: currentImage.id,
      points: drawingAnnotation?.points,
      closed: drawingAnnotation?.closed
    } as IAnnotationPayload

    await saveAnnotationByImage(payload);

    if (!currentImage) return;
    const next: AnnotationMap = {
      ...annotationsByImage,
      [currentImage.id]: [
        ...(annotationsByImage[currentImage.id] || []),
        { ...ann, closed: true },
      ],
    };
    commitAnnotations(next);
    setDrawingAnnotation(null);
  }

  function deleteAnnotation(id: string) {
    if (!currentImage) return;
    const next: AnnotationMap = {
      ...annotationsByImage,
      [currentImage.id]: (annotationsByImage[currentImage.id] || []).filter(
        (a) => a.id !== id,
      ),
    };
    commitAnnotations(next);
  }

  function startDragPoint(
    annotationId: string,
    pointIndex: number,
    isDrawing: boolean,
  ) {
    draggingRef.current = { annotationId, pointIndex, isDrawing };
  }

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const drag = draggingRef.current;
      if (!drag) return;
      const pt = getRelativePoint(e);

      if (drag.isDrawing && drawingAnnotation) {
        const points = [...drawingAnnotation.points];
        points[drag.pointIndex] = pt;
        setDrawingAnnotation({ ...drawingAnnotation, points });
        return;
      }

      if (!currentImage) return;
      setAnnotationsByImage((prev) => {
        const list = prev[currentImage.id] || [];
        const idx = list.findIndex((a) => a.id === drag.annotationId);
        if (idx === -1) return prev;
        const points = [...list[idx].points];
        points[drag.pointIndex] = pt;
        const updatedAnn = { ...list[idx], points };
        const updatedList = [...list];
        updatedList[idx] = updatedAnn;
        return { ...prev, [currentImage.id]: updatedList };
      });
    }

    function onUp() {
      if (draggingRef.current && !draggingRef.current.isDrawing) {
        // commit final position into history
        commitAnnotations(annotationsByImage);
      }
      // small timeout so the following click event still sees "was dragging"
      setTimeout(() => {
        draggingRef.current = null;
      }, 0);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingAnnotation, currentImage, annotationsByImage]);

  /* ---------------- Derived ---------------- */

  const reviewImage = caseObj.annotated_images?.[0];

  const caseTitle = caseObj.title
    ? caseObj.title[0].toUpperCase() + caseObj.title.slice(1)
    : "";

  const totalLabel = images.length
    ? `${caseTitle} (${currentIndex + 1}/${images.length})`
    : caseTitle;

  /* ---------------- Loading / empty states ---------------- */

  if (!caseObj.id) {
    return (
      <div className="w-full max-w-4xl mx-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 px-4 pt-4 pb-2 border-b border-slate-100">
          <div className="w-9 h-9 rounded-md bg-slate-100 animate-pulse" />
          <div className="h-4 w-40 rounded bg-slate-100 animate-pulse" />
          <div className="w-9 h-9 rounded-md bg-slate-100 animate-pulse" />
        </div>
        <div className="px-4 py-3">
          <div className="h-4 w-64 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="w-full h-[440px] sm:h-[520px] bg-slate-100 flex items-center justify-center">
          <span className="text-sm text-slate-400">
            {isLoading ? "Loading case…" : "No case found"}
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 px-4 py-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-md bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  /* ---------------- Render ---------------- */

  return (
    <div className="w-full max-w-4xl mx-auto rounded-xl border border-slate-200 bg-white shadow-sm select-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-4 pt-4 pb-2 border-b border-slate-100">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="flex items-center justify-center w-9 h-9 rounded-md bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft />
        </button>

        <h2 className="text-base font-semibold text-slate-800 tracking-wide">
          {totalLabel}
        </h2>

        <button
          onClick={goNext}
          disabled={currentIndex === images.length - 1}
          className="flex items-center justify-center w-9 h-9 rounded-md bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition-colors"
          aria-label="Next image"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm text-slate-700">
        <label className="flex items-center gap-2">
          <span className="text-slate-500">Select Class:</span>
          <select
            value={selectedClass}
            onChange={(e) =>
              setSelectedClass(
                e.target.value as (typeof CLASS_OPTIONS)[number]["value"],
              )
            }
            className="border border-slate-300 rounded-md px-2 py-1 bg-white"
          >
            {CLASS_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <span
            className="w-3.5 h-3.5 rounded-full border border-black/10"
            style={{ backgroundColor: activeClassInfo.color }}
          />
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hideAnnotations}
            onChange={(e) => setHideAnnotations(e.target.checked)}
          />
          Hide Annotations
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hideReview}
            onChange={(e) => setHideReview(e.target.checked)}
          />
          Hide Review Annotations
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={ctWindow}
            onChange={(e) => setCtWindow(e.target.checked)}
          />
          Apply CT Window
        </label>

        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          {tool === "draw" ? (
            <span>Click to place points · double-click or close the loop to finish</span>
          ) : (
            <span>Click a shape to delete it</span>
          )}
        </div>
      </div>

      {/* Image + overlay */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        className="relative w-full h-[440px] sm:h-[520px] bg-black flex items-center justify-center overflow-hidden"
      >
        {currentImage && (
          <div
            style={{
              width: box.width,
              height: box.height,
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
            }}
            className="relative transition-transform duration-150 ease-out"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage.image}
              alt={`${caseTitle} slice ${currentIndex + 1}`}
              draggable={false}
              onLoad={(e) =>
                setNaturalSize({
                  w: e.currentTarget.naturalWidth,
                  h: e.currentTarget.naturalHeight,
                })
              }
              style={
                ctWindow
                  ? { filter: "contrast(1.35) brightness(1.12)" }
                  : undefined
              }
              className="w-full h-full object-contain pointer-events-none"
            />

            <svg
              ref={svgRef}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full"
              style={{ cursor: tool === "draw" ? "crosshair" : "pointer" }}
              onClick={handleSvgClick}
              onDoubleClick={handleSvgDoubleClick}
            >
              {!hideAnnotations &&
                currentAnnotations.map((ann) => (
                  <g key={ann.id}>
                    <path
                      d={pointsToPath(ann.points, ann.closed)}
                      fill={ann.color}
                      fillOpacity={0.35}
                      stroke={ann.color}
                      strokeWidth={0.4}
                      vectorEffect="non-scaling-stroke"
                      onClick={(e) => {
                        if (tool === "delete") {
                          e.stopPropagation();
                          deleteAnnotation(ann.id);
                        }
                      }}
                      style={{
                        cursor: tool === "delete" ? "not-allowed" : "default",
                      }}
                    />
                    {ann.points.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={0.9}
                        fill="white"
                        stroke={ann.color}
                        strokeWidth={0.4}
                        vectorEffect="non-scaling-stroke"
                        onMouseDown={(e) => {
                          if (tool !== "draw") return;
                          e.stopPropagation();
                          startDragPoint(ann.id, i, false);
                        }}
                        style={{
                          cursor: tool === "draw" ? "grab" : "default",
                        }}
                      />
                    ))}
                  </g>
                ))}

              {!hideAnnotations && drawingAnnotation && (
                <g>
                  <path
                    d={pointsToPath(drawingAnnotation.points, false)}
                    fill={drawingAnnotation.color}
                    fillOpacity={0.2}
                    stroke={drawingAnnotation.color}
                    strokeDasharray="1.2 1"
                    strokeWidth={0.4}
                    vectorEffect="non-scaling-stroke"
                  />
                  {drawingAnnotation.points.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={i === 0 ? 1.2 : 0.9}
                      fill={i === 0 ? drawingAnnotation.color : "white"}
                      stroke={drawingAnnotation.color}
                      strokeWidth={0.4}
                      vectorEffect="non-scaling-stroke"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        startDragPoint(drawingAnnotation.id, i, true);
                      }}
                      style={{ cursor: "grab" }}
                    />
                  ))}
                </g>
              )}
            </svg>
          </div>
        )}

        {/* Review annotation reference thumbnail */}
        {!hideReview && reviewImage && (
          <div className="absolute bottom-3 right-3 w-24 rounded-md overflow-hidden border-2 border-white shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={reviewImage.image}
              alt="Reviewed reference annotation"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center py-0.5">
              Reference
            </div>
          </div>
        )}

        {savedFlash && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">
            Annotations saved
          </div>
        )}
      </div>

      {/* Slice scrubber */}
      <div className="px-6 pt-3">
        <input
          type="range"
          min={0}
          max={images.length - 1}
          value={currentIndex}
          onChange={(e) => {
            setDrawingAnnotation(null);
            setCurrentIndex(Number(e.target.value));
          }}
          className="w-full accent-blue-600"
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-center gap-2 px-4 py-4">
        <ToolbarButton
          active={tool === "draw"}
          label="Draw annotation"
          onClick={() => setTool("draw")}
        >
          <PencilIcon />
        </ToolbarButton>

        <ToolbarButton label="Zoom out" onClick={zoomOut}>
          <ZoomOutIcon />
        </ToolbarButton>

        <ToolbarButton label="Reset zoom" onClick={zoomReset}>
          <ZoomResetIcon />
        </ToolbarButton>

        <ToolbarButton label="Zoom in" onClick={zoomIn}>
          <ZoomInIcon />
        </ToolbarButton>

        <ToolbarButton
          active={tool === "delete"}
          label="Delete annotation"
          onClick={() => setTool("delete")}
        >
          <TrashIcon />
        </ToolbarButton>

        <ToolbarButton
          label="Undo"
          onClick={handleUndo}
          disabled={historyIndex === 0}
        >
          <UndoIcon />
        </ToolbarButton>

        <ToolbarButton
          label="Redo"
          onClick={handleRedo}
          disabled={historyIndex === history.length - 1}
        >
          <RedoIcon />
        </ToolbarButton>

        <ToolbarButton label="Save annotations" onClick={handleSave} accent>
          <SaveIcon />
        </ToolbarButton>
      </div>
    </div>
  );
}

/* ============================================================================
 * Small presentational helper
 * ==========================================================================*/

function ToolbarButton({
  children,
  onClick,
  label,
  active,
  disabled,
  accent,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex items-center justify-center w-10 h-10 rounded-md transition-colors",
        "disabled:opacity-30 disabled:cursor-not-allowed",
        accent
          ? "bg-emerald-600 text-white hover:bg-emerald-700"
          : active
            ? "bg-blue-700 text-white"
            : "bg-blue-600 text-white hover:bg-blue-700",
      ].join(" ")}
    >
      {children}
    </button>
  );
}