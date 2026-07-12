


export interface IAnatomyCaseImage {
    id: string;
    case: string; // id or title
    image: string;
}

export interface IAnnotatedImage {
    id: string;
    case: string; // id or title
    image: string;
}

export interface IAnnotatorPayload {
    id: string;
    title: string;
    slug: string;
    case_type: string;
    images: Array<IAnatomyCaseImage>,
    annotated_images: Array<IAnnotatedImage>
}

export interface IAnatomyTypeCase {
    id: string;
    title: string;
    slug: string;
    image_count: number;
    annotated_image_count: number;
    created_at: string;
}

export interface IAnatomyCaseType {
    id: string;
    title: string;
    slug: string;
    cases: Array<IAnatomyTypeCase>;
    create_at: string;
}

interface CaseType {
    id: string;
    title: string;
    slug: string;
}

interface AnatomyImage {
    id: string;
    case: string;
    image: string;
}

export interface IAnnotationCase {
  id: string;
  title: string;
  slug: string;
  case_type: CaseType;
  description: string;
  images: Array<AnatomyImage>;
  annotated_images: Array<AnatomyImage>;
  created_at: string;
  updated_at: string;
}

