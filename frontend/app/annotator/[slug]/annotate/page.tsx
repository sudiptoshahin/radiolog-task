"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import useAnnotatorStore from "@/store/useAnnotatorStore";
import { IAnnotationCase, IAnnotationPayload, Point } from "@/models/annotators";
import { AnatomyImage, AnnotationMap, Tool, Annotation } from "@/models/annotations";
import { ChevronLeft, ChevronRight, PencilIcon, RedoIcon, SaveIcon, TrashIcon, UndoIcon, ZoomInIcon, ZoomOutIcon, ZoomResetIcon } from "@/components/common/IconComponent";
import ToolbarButton from "@/components/annotations/ToolbarButton";
import Constants from "@/utils/constants";
import { clamp, uid, pointsToPath } from "@/utils/helpers";
import AppLayout from "@/components/layout/AppLayout";

/**
 * Turn the `images[].annotations[]` payload from the API into the
 * AnnotationMap shape the editor works with internally.
 *
 * Backend annotations are always fully-formed shapes by the time they
 * come back from the API, so we render them as closed paths regardless
 * of whatever `closed` value happens to be stored — this keeps the
 * stroke outline visually sealed even if that flag was persisted as
 * `false` upstream.
 */
function buildAnnotationMapFromCase(images: AnatomyImage[]): AnnotationMap {
  const map: AnnotationMap = {};
  for (const img of images) {
    if (!img.annotations || img.annotations.length === 0) continue;
    map[img.id] = img.annotations.map((raw) => {
      const classInfo = Constants.CLASS_OPTIONS.find((c) => c.value === raw.class_label);
      return {
        id: raw.id,
        classLabel: raw.class_label,
        color: raw.annotated_color || classInfo?.color || "#dc2626",
        points: raw.points.map((p) => ({ x: p.x, y: p.y })),
        closed: true,
      };
    });
  }
  return map;
}


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

  const [selectedClass, setSelectedClass] = useState<(typeof Constants.CLASS_OPTIONS)[number]["value"]>(Constants.CLASS_OPTIONS[0].value);
  const activeClassInfo = Constants.CLASS_OPTIONS.find((c) => c.value === selectedClass) ?? Constants.CLASS_OPTIONS[0];

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

  /**
   * Hydrate the editor whenever a new case loads. Annotations now live
   * on the case payload itself (images[].annotations, coming from the
   * DB) instead of localStorage, so we build the initial AnnotationMap
   * straight from caseObj.
   */
  useEffect(() => {
    if (!caseObj.id) return;

    setCurrentIndex(0);
    setZoom(1);
    setTool("draw");
    setDrawingAnnotation(null);

    const initial = buildAnnotationMapFromCase(caseObj.images ?? []);
    setAnnotationsByImage(initial);
    setHistory([initial]);
    setHistoryIndex(0);
  }, [caseObj.id]);

  function commitAnnotations(next: AnnotationMap) {
    const trimmed = history.slice(0, historyIndex + 1);
    const nextHistory = [...trimmed, next];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setAnnotationsByImage(next);
  }

  function handleSave() {
    setSavedFlash(true);
    handleSvgDoubleClick();
    setTimeout(() => setSavedFlash(false), 1600);
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

  /* ---------------- 
  - Navigation
  ---------------- */
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
        clamp(z + (e.deltaY < 0 ? Constants.ZOOM_STEP : -Constants.ZOOM_STEP), Constants.ZOOM_MIN, Constants.ZOOM_MAX),
      );
      return;
    }
    const now = Date.now();
    if (now - wheelCooldownRef.current < Constants.WHEEL_NAV_COOLDOWN_MS) return;
    wheelCooldownRef.current = now;
    e.deltaY > 0 ? goNext() : goPrev();
  }

  /* ---------------- 
  - Zoom controls 
  ---------------- */
  const zoomIn = () => setZoom((z) => clamp(z + Constants.ZOOM_STEP, Constants.ZOOM_MIN, Constants.ZOOM_MAX));
  const zoomOut = () => setZoom((z) => clamp(z - Constants.ZOOM_STEP, Constants.ZOOM_MIN, Constants.ZOOM_MAX));
  const zoomReset = () => setZoom(1);

  /* ----------------------------------------------------
   - Image box measurement (for correct overlay mapping)
   ------------------------------------------------------ */
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

  /*-------------------------------- 
   - Drawing / editing annotations
  ----------------------------------- */
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
      if (drawingAnnotation.points.length >= 3 && dist < Constants.CLOSE_THRESHOLD) {
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
    if (!currentImage) return;

    const payload = {
      class_label: ann.classLabel,
      annotated_color: ann.color,
      image: currentImage.id,
      points: ann.points,
      closed: true,
    } as IAnnotationPayload;

    const saved = await saveAnnotationByImage(payload);

    // Prefer the id the DB assigned to the annotation (needed for any
    // future edit/delete calls against the backend). Fall back to the
    // locally generated one if the store doesn't return it.
    // const savedId = (saved && typeof saved === "object" && "id" in saved
    //   ? (saved as { id?: string }).id
    //   : undefined) ?? ann.id;
    const savedId = ann.id;

    const next: AnnotationMap = {
      ...annotationsByImage,
      [currentImage.id]: [
        ...(annotationsByImage[currentImage.id] || []),
        { ...ann, id: savedId, closed: true },
      ],
    };
    commitAnnotations(next);
    setDrawingAnnotation(null);
  }

  // function deleteAnnotation(id: string) {
  //   if (!currentImage) return;
  //   // TODO: call a delete endpoint once one exists so removals persist
  //   // server-side too — for now this only updates local editor state.
  //   const next: AnnotationMap = {
  //     ...annotationsByImage,
  //     [currentImage.id]: (annotationsByImage[currentImage.id] || []).filter(
  //       (a) => a.id !== id,
  //     ),
  //   };
  //   commitAnnotations(next);
  // }

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

  /* -----------------------
  - Derived
  ------------------------ */
  const reviewImage = caseObj.annotated_images?.[0];

  const caseTitle = caseObj.title
    ? caseObj.title[0].toUpperCase() + caseObj.title.slice(1)
    : "";

  const totalLabel = images.length
    ? `${caseTitle} (${currentIndex + 1}/${images.length})`
    : caseTitle;

  /*--------------------------
   - Loading / empty states
  ---------------------------- */
  if (!caseObj.id) {
    return (
      <div className="w-full max-w-4xl mx-auto rounded-xl border border-taupe/20 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 px-4 pt-4 pb-2 border-b border-sage/15">
          <div className="w-9 h-9 rounded-md bg-cream animate-pulse" />
          <div className="h-4 w-40 rounded bg-cream animate-pulse" />
          <div className="w-9 h-9 rounded-md bg-cream animate-pulse" />
        </div>
        <div className="px-4 py-3">
          <div className="h-4 w-64 rounded bg-cream animate-pulse" />
        </div>
        <div className="w-full h-[440px] sm:h-[520px] bg-neutral-900 flex items-center justify-center">
          <span className="text-sm text-taupe-light">
            {isLoading ? "Loading case…" : "No case found"}
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 px-4 py-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-md bg-cream animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  /* --------------------
  - Render
  ------------------- */
  return (
    <AppLayout>
      <div className="w-full max-w-4xl mx-auto rounded-xl border border-taupe/20 bg-white shadow-sm select-none">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-4 pt-4 pb-2 border-b border-sage/15">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex items-center justify-center w-9 h-9 rounded-md bg-sage text-white disabled:opacity-40 hover:bg-sage-dark transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft />
          </button>

          <h2 className="text-base font-semibold text-sage-dark tracking-wide">
            {totalLabel}
          </h2>

          <button
            onClick={goNext}
            disabled={currentIndex === images.length - 1}
            className="flex items-center justify-center w-9 h-9 rounded-md bg-sage text-white disabled:opacity-40 hover:bg-sage-dark transition-colors"
            aria-label="Next image"
          >
            <ChevronRight />
          </button>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm text-taupe-dark">
          <label className="flex items-center gap-2">
            <span className="text-taupe-dark/70">Select Class:</span>
            <select
              value={selectedClass}
              onChange={(e) =>
                setSelectedClass(
                  e.target.value as (typeof Constants.CLASS_OPTIONS)[number]["value"],
                )
              }
              className="border border-taupe/30 rounded-md px-2 py-1 bg-white"
            >
              {Constants.CLASS_OPTIONS.map((c) => (
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
              className="accent-sage"
            />
            Hide Annotations
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hideReview}
              onChange={(e) => setHideReview(e.target.checked)}
              className="accent-sage"
            />
            Hide Review Annotations
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ctWindow}
              onChange={(e) => setCtWindow(e.target.checked)}
              className="accent-sage"
            />
            Apply CT Window
          </label>

          <div className="ml-auto flex items-center gap-2 text-xs text-taupe-dark/50">
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
          className="relative w-full h-[440px] sm:h-[520px] bg-neutral-900 flex items-center justify-center overflow-hidden"
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
                            // deleteAnnotation(ann.id);
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
            <div className="absolute bottom-3 right-3 w-24 rounded-md overflow-hidden border-2 border-cream shadow-lg">
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
            className="w-full accent-sage"
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
    </AppLayout>
  );
}