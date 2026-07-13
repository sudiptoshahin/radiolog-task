
import { IAnnotationPayload } from "@/models/annotators";
import { LoginPayload } from "@/models/auth";
import { ApiErrorResponse } from "@/models/common";
import { TaskCreatePayload, TaskUpdatePayload } from "@/models/tasks";
import useUserStore from "@/store/useUserStore";
import axios, { AxiosError } from "axios";

export default class ApiService {
    private static readonly xClientKey = process.env.NEXT_PUBLIC_API_CLIENT_KEY ?? '';

    private static getToken = (): string | null => {
        const { tokens } = useUserStore.getState();
        return tokens?.access || null;
    }

    private static getGuestId = (): string | null => {
        // return Cookies.get(GUEST_ID_KEY) ?? null;
        return ""
    }

    // attaches either Authorization
    private static getIdentityHeaders = (): Record<string, string> => {
        const token = ApiService.getToken();
        if (token) {
            return { Authorization: `Bearer ${token}` };
        }
        return {};
    }

    static getFormHeader(): Record<string, string> {
        return {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-client-key': ApiService.xClientKey,
            'x-app-client': 'web',
            ...ApiService.getIdentityHeaders(),
        }
    }

    static getAuthHeader(): Record<string, string> {
        return {
            'Content-Type': 'application/json',
            'x-client-key': ApiService.xClientKey,
            'x-app-client': 'web',
            ...ApiService.getIdentityHeaders(),
        };
    }

    static getHeader(): Record<string, string> {
        return {
            'Content-Type': 'application/json',
            'x-client-key': ApiService.xClientKey,
            'x-app-client': 'web'
        }
    }


    static async LOGIN(payload: LoginPayload) {
        try {
            const headers = this.getHeader();
            const res = await axios.post(process.env.NEXT_PUBLIC_API_BASE_URL + "/users/auth/login/", payload, { headers });
            return res.data;
        } catch (err) {
            let error: ApiErrorResponse = {} as ApiErrorResponse;
            if (axios.isAxiosError<ApiErrorResponse>(err)) {
                error = err?.response?.data as ApiErrorResponse;
            }
            return error;
        }
    }


    static async ALL_TASKS(dueDate?: string) {
        try {
            const headers = this.getHeader();
            const params = dueDate ? { due_date: dueDate } : undefined;

            const res = await axios.get(
                process.env.NEXT_PUBLIC_API_BASE_URL + "/kanabans/tasks/",
                { headers, params }
            );
            return res.data;
        } catch (err) {
            let error: ApiErrorResponse = {} as ApiErrorResponse;
            if (axios.isAxiosError<ApiErrorResponse>(err)) {
                error = err?.response?.data as ApiErrorResponse;
            }
            return error;
        }
    }

    static async CREATE_TASK(payload: TaskCreatePayload) {
        try {
            const headers = this.getHeader();
            const res = await axios.post(process.env.NEXT_PUBLIC_API_BASE_URL + "/kanabans/tasks/", payload, { headers });
            return res.data;
        } catch (err) {
            let error: ApiErrorResponse = {} as ApiErrorResponse;
            if (axios.isAxiosError<ApiErrorResponse>(err)) {
                error = err?.response?.data as ApiErrorResponse;
            }
            return error;
        }
    }

    static async GET_TASK_BY_ID(taskId: string) {
        try {
            const headers = this.getHeader();
            const res = await axios.get(process.env.NEXT_PUBLIC_API_BASE_URL + `/kanabans/tasks/${taskId}/view/`, { headers });
            return res.data;
        } catch (err) {
            let error: ApiErrorResponse = {} as ApiErrorResponse;
            if (axios.isAxiosError<ApiErrorResponse>(err)) {
                error = err?.response?.data as ApiErrorResponse;
            }
            return error;
        }
    }

    static async UPDATE_TASK(taskId: string, payload: TaskUpdatePayload) {
        try {
            const headers = this.getHeader();
            const res = await axios.patch(process.env.NEXT_PUBLIC_API_BASE_URL + `/kanabans/tasks/${taskId}/edit/`, payload, { headers });
            return res.data;
        } catch (err) {
            let error: ApiErrorResponse = {} as ApiErrorResponse;
            if (axios.isAxiosError<ApiErrorResponse>(err)) {
                error = err?.response?.data as ApiErrorResponse;
            }
            return error;
        }
    }

    static async DELETE_TASK(taskId: string) {
        try {
            const headers = this.getHeader();
            const res = await axios.delete(process.env.NEXT_PUBLIC_API_BASE_URL + `/kanabans/tasks/${taskId}/delete/`, { headers });
            return res.data;
        } catch (err) {
            let error: ApiErrorResponse = {} as ApiErrorResponse;
            if (axios.isAxiosError<ApiErrorResponse>(err)) {
                error = err?.response?.data as ApiErrorResponse;
            }
            return error;
        }
    }

    static async ALL_TAGS() {
        try {
            const headers = this.getHeader();
            const res = await axios.get(process.env.NEXT_PUBLIC_API_BASE_URL + `/kanabans/tags/`, { headers });
            return res.data;
        } catch (err) {
            let error: ApiErrorResponse = {} as ApiErrorResponse;
            if (axios.isAxiosError<ApiErrorResponse>(err)) {
                error = err?.response?.data as ApiErrorResponse;
            }
            return error;
        }
    }

    static async ALL_ANATOMY_CASES() {
        try {
            const headers = this.getHeader();
            const res = await axios.get(process.env.NEXT_PUBLIC_API_BASE_URL + `/annotators/`, { headers });
            return res.data;
        } catch (err) {
            let error: ApiErrorResponse = {} as ApiErrorResponse;
            if (axios.isAxiosError<ApiErrorResponse>(err)) {
                error = err?.response?.data as ApiErrorResponse;
            }
            return error;
        }
    }

    static async ANATOMY_CASE_TYPES() {
        try {
            const headers = this.getHeader();
            const res = await axios.get(process.env.NEXT_PUBLIC_API_BASE_URL + `/annotators/types/`, { headers });
            return res.data;
        } catch (err) {
            let error: ApiErrorResponse = {} as ApiErrorResponse;
            if (axios.isAxiosError<ApiErrorResponse>(err)) {
                error = err?.response?.data as ApiErrorResponse;
            }
            return error;
        }
    }

    static async GET_ANATOMY_CASE(slug: string) {
        try {
            const headers = this.getHeader();
            const res = await axios.get(process.env.NEXT_PUBLIC_API_BASE_URL + `/annotators/case/${slug}/`, { headers });
            return res.data;
        } catch (err) {
            let error: ApiErrorResponse = {} as ApiErrorResponse;
            if (axios.isAxiosError<ApiErrorResponse>(err)) {
                error = err?.response?.data as ApiErrorResponse;
            }
            return error;
        }
    }

    static async SAVE_ANNOTATION_BY_IMAGE(payload: IAnnotationPayload) {
        try {
            const headers = this.getHeader();
            const res = await axios.post(process.env.NEXT_PUBLIC_API_BASE_URL + `/annotators/save/annotation`, payload, { headers });
            return res.data;
        } catch (err) {
            let error: ApiErrorResponse = {} as ApiErrorResponse;
            if (axios.isAxiosError<ApiErrorResponse>(err)) {
                error = err?.response?.data as ApiErrorResponse;
            }
            return error;
        }
    }
}