


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


// {
//     "class_label": "TUMOR",
//     "annotated_color": "#dc2626",
//     "image": "eac5faaa-c92c-45e2-afcf-602835a727c9",
//     "points": [
//         {
//             "x": 39.03439649781113,
//             "y": 34.03846153846154
//         },
//         {
//             "x": 43.036898061288305,
//             "y": 37.88461538461539
//         },
//         {
//             "x": 41.275797373358344,
//             "y": 43.07692307692308
//         },
//         {
//             "x": 35.512195121951216,
//             "y": 39.80769230769231
//         }
//     ],
//     "closed": false
// }


interface Point {
    x: number;
    y: number;
}

export interface IAnnotationPayload {
    class_label: string;
    annotated_color: string;
    image: string;
    points: Array<Point>;
}

