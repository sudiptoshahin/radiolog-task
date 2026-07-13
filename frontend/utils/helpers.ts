import { Point } from "@/models/annotators";


export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function pointsToPath(points: Point[], closed: boolean) {
  if (points.length === 0) return "";
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
    .join(" ");
  return closed ? `${d} Z` : d;
}
