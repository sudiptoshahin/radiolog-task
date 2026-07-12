import { create } from "zustand";
import ApiService from "@/services/ApiService";
import { ApiErrorResponse } from "@/models/common";
import { IAnnotatorPayload } from "@/models/annotators";


interface AnnotatorStore {
    cases: Array<IAnnotatorPayload>;
    isLoading: boolean;
    error: unknown;

    fetchAnnotatorCases: () => Promise<void>;}


const useAnnotatorStore = create<AnnotatorStore>()((set, get) => ({
    cases: [],
    isLoading: false,
    error: null,

    fetchAnnotatorCases: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await ApiService.ALL_ANATOMY_CASES();
            set({ cases: res.data, isLoading: false });
        } catch (error) {
            set({error: error});
        } finally {
            set({ isLoading: false });
        }

    }

}));

export default useAnnotatorStore;