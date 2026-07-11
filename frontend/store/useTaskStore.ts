import { create } from "zustand";
import ApiService from "@/services/ApiService";
import { ApiErrorResponse } from "@/models/common";
import { Task, TaskCreatePayload, TaskTag, TaskUpdatePayload } from "@/models/tasks";


interface TaskStore {
    tasks: Array<Task>;
    tags: Array<TaskTag>;
    isLoading: boolean;
    error: string | null;

    fetchTags: () => Promise<void>;
    fetchTasks: (date?: string) => Promise<void>;
    createTask: (payload: TaskCreatePayload) => Promise<Task | null>;
    getTaskById: (taskId: string) => Promise<Task | null>;
    updateTask: (taskId: string, payload: TaskUpdatePayload) => Promise<Task | null>;
    deleteTask: (taskId: string) => Promise<boolean>;

    // Sync, cache-only helper — no network call, reads whatever is already in state
    getTaskFromCache: (taskId: string) => Task | undefined;

    clearTasks: () => void;
}

// A successful single-task response always has an `id`; an error response never does.
function isTask(res: unknown): res is Task {
    return !!res && typeof res === "object" && "id" in (res as object);
}

// A successful list response is an array; an error response is a plain object.
function isTaskArray(res: unknown): res is Task[] {
    return Array.isArray(res);
}

const useTaskStore = create<TaskStore>()((set, get) => ({
    tasks: [],
    tags: [],
    isLoading: false,
    error: null,

    fetchTags: async() => {
        set({ isLoading: true, error: null });
        const res = await ApiService.ALL_TAGS();

        set({ tags: res?.results, isLoading: false });
    },

    fetchTasks: async (dueDate: string="") => {
        set({ isLoading: true, error: null });
        const res = await ApiService.ALL_TASKS(dueDate);

        if (isTaskArray(res?.data)) {
            set({ tasks: res?.data, isLoading: false });
        } else {
            const err = res as ApiErrorResponse;
            set({ error: err.message ?? err?.detail ?? "Failed to fetch tasks.", isLoading: false });
        }
    },

    createTask: async (payload: TaskCreatePayload) => {
        set({ isLoading: true, error: null });
        const res = await ApiService.CREATE_TASK(payload);

        if (isTask(res)) {
            set((state) => ({ tasks: [res, ...state.tasks], isLoading: false }));
            return res;
        }

        const err = res as ApiErrorResponse;
        set({ error: err.message ?? err.detail ?? "Failed to create task.", isLoading: false });
        return null;
    },

    getTaskById: async (taskId: string) => {
        set({ isLoading: true, error: null });
        const res = await ApiService.GET_TASK_BY_ID(taskId);

        if (isTask(res)) {
            // keep the list cache in sync in case this task wasn't loaded yet, or is stale
            set((state) => {
                const exists = state.tasks.some((t) => t.id === res.id);
                return {
                    tasks: exists
                        ? state.tasks.map((t) => (t.id === res.id ? res : t))
                        : [...state.tasks, res],
                    isLoading: false,
                };
            });
            return res;
        }

        const err = res as ApiErrorResponse;
        set({ error: err.message ?? err.detail ?? "Failed to fetch task.", isLoading: false });
        return null;
    },

    updateTask: async (taskId: string, payload: TaskUpdatePayload) => {
        set({ isLoading: true, error: null });
        const res = await ApiService.UPDATE_TASK(taskId, payload);

        if (isTask(res)) {
            set((state) => ({
                tasks: state.tasks.map((t) => (t.id === taskId ? res : t)),
                isLoading: false,
            }));
            return res;
        }

        const err = res as ApiErrorResponse;
        set({ error: err.message ?? err.detail ?? "Failed to update task.", isLoading: false });
        return null;
    },

    deleteTask: async (taskId: string) => {
        set({ isLoading: true, error: null });
        const res = await ApiService.DELETE_TASK(taskId);

        // DELETE endpoints often return 204 No Content -> res.data is "" or undefined,
        // which is not an ApiErrorResponse shape, so treat "no error object" as success.
        const err = res as ApiErrorResponse;
        if (err && (err.message || err.detail)) {
            set({ error: err.message ?? err.detail ?? "Failed to delete task.", isLoading: false });
            return false;
        }

        set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== taskId),
            isLoading: false,
        }));
        return true;
    },

    getTaskFromCache: (taskId: string) => get().tasks.find((t) => t.id === taskId),

    clearTasks: () => set({ tasks: [], isLoading: false, error: null }),
}));

export default useTaskStore;