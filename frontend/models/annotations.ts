import { Point } from "./annotators";


export interface RawAnnotation {
  id: string;
  class_label: string;
  annotated_color: string;
  image: string;
  points: { x: number; y: number }[];
  closed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AnatomyImage {
  id: string;
  case: string;
  image: string;
  /** Annotations now arrive pre-attached to each image from the API */
  annotations?: RawAnnotation[];
}

export interface IAnnotationCase {
  id: string;
  title: string;
  slug: string;
  case_type: string;
  description?: string;
  images: AnatomyImage[];
  /** Optional — not guaranteed to be present on every payload */
  annotated_images?: AnatomyImage[];
  created_at: string;
  updated_at?: string;
}


export interface Annotation {
  id: string;
  classLabel: string;
  color: string;
  points: Point[];
  closed: boolean;
}

/** annotations keyed by image id */
export type AnnotationMap = Record<string, Annotation[]>;

export type Tool = "draw" | "delete";