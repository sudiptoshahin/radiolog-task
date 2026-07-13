import { create } from "zustand";
import ApiService from "@/services/ApiService";
import { ApiErrorResponse } from "@/models/common";
import { IAnatomyCaseType, IAnnotationCase, IAnnotationPayload, IAnnotatorPayload } from "@/models/annotators";


interface AnnotatorStore {
    cases: Array<IAnnotatorPayload>;
    typesCases: Array<IAnatomyCaseType>;
    case: IAnnotationCase;
    isLoading: boolean;
    error: unknown;

    fetchAnnotatorCases: () => Promise<void>;
    fetchAnatomyCaseTypes: () => Promise<void>;
    getCase: (slug: string) => Promise<IAnnotationCase | undefined>;
    saveAnnotationByImage: (payload: IAnnotationPayload) => Promise<void>;
}


const useAnnotatorStore = create<AnnotatorStore>()((set, get) => ({
    cases: [],
    typesCases: [],
    isLoading: false,
    error: null,
    case: {} as IAnnotationCase,

    fetchAnnotatorCases: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await ApiService.ALL_ANATOMY_CASES();
            set({ cases: res.data, isLoading: false });
        } catch (error) {
            set({ error: error });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchAnatomyCaseTypes: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await ApiService.ANATOMY_CASE_TYPES();
            set({ typesCases: res.data, isLoading: false });
        } catch (error) {
            set({ error: error });
        } finally {
            set({ isLoading: false });
        }
    },

    getCase: async (slug: string) => {
        set({ isLoading: true, error: null });
        try {
            const res = await ApiService.GET_ANATOMY_CASE(slug);
            if (res.data === undefined) return;
            return res!.data as IAnnotationCase;
        } catch (error) {
            set({ error: error });
        } finally {
            set({ isLoading: false });
        }
    },

    saveAnnotationByImage: async (payload: IAnnotationPayload) => {
        set({ isLoading: true, error: null });
        try {
            const res = await ApiService.SAVE_ANNOTATION_BY_IMAGE(payload);
            if (res.data === undefined) return;
            return res.data;
        } catch(error) {
            set({ error: error });
        } finally {
            set({ isLoading: false });
        }
    }

}));

export default useAnnotatorStore;