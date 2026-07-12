


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