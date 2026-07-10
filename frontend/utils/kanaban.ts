import { Priority, Task, TaskTag, NoteStyle } from "../models/tasks";

// ---------- Mock data (replace with API fetch) ----------

const mockTags: TaskTag[] = [
  { id: "t1", label: "Bug" },
  { id: "t2", label: "Frontend" },
  { id: "t3", label: "Backend" },
  { id: "t4", label: "Urgent" },
  { id: "t5", label: "Design" },
  { id: "t6", label: "API" },
];

export function generateMockTasks(): Task[] {
  const raw: Omit<Task, "status">[] = [
    { id: "c1da4abc-fbdd-4c3f-af54-89d915786190", title: "Fix login bug", priority: "HIGH", due_date: "2026-07-15T10:00:00Z", created_at: "2026-07-10T08:18:37Z", tags: [mockTags[0]] },
    { id: "a2b3c4d5-1111-4c3f-af54-89d915786191", title: "Design new dashboard", priority: "MEDIUM", due_date: "2026-07-20T10:00:00Z", created_at: "2026-07-09T08:18:37Z", tags: [mockTags[4]] },
    { id: "b3c4d5e6-2222-4c3f-af54-89d915786192", title: "Set up CI/CD pipeline", priority: "LOW", due_date: "2026-07-25T10:00:00Z", created_at: "2026-07-08T08:18:37Z", tags: [mockTags[2]] },
    { id: "d4e5f6a7-3333-4c3f-af54-89d915786193", title: "OAuth integration", priority: "HIGH", due_date: "2026-07-12T10:00:00Z", created_at: "2026-07-07T08:18:37Z", tags: [mockTags[5]] },
    { id: "e5f6a7b8-4444-4c3f-af54-89d915786194", title: "Write unit tests", priority: "MEDIUM", due_date: "2026-07-18T10:00:00Z", created_at: "2026-07-06T08:18:37Z", tags: [mockTags[2]] },
    { id: "f6a7b8c9-5555-4c3f-af54-89d915786195", title: "Refactor task card", priority: "LOW", due_date: "2026-07-22T10:00:00Z", created_at: "2026-07-05T08:18:37Z", tags: [mockTags[1]] },
    { id: "a1a2a3a4-6666-4c3f-af54-89d915786196", title: "Update API docs", priority: "LOW", due_date: "2026-07-28T10:00:00Z", created_at: "2026-07-04T08:18:37Z", tags: [mockTags[5]] },
    { id: "b2b3b4b5-7777-4c3f-af54-89d915786197", title: "Client feedback review", priority: "MEDIUM", due_date: "2026-07-14T10:00:00Z", created_at: "2026-07-03T08:18:37Z", tags: [mockTags[4]] },
  ];

  const statuses = ["TODO", "TODO", "IN_PROGRESS", "IN_PROGRESS", "DONE", "DONE", "TODO", "DONE"] as const;
  return raw.map((task, i) => ({ ...task, status: statuses[i] }));
}

// ---------- Sticky note styling helpers ----------

const NOTE_COLORS = [
  { bg: "#FEF08A", tape: "#FDE68A" }, // yellow
  { bg: "#FBCFE8", tape: "#F9A8D4" }, // pink
  { bg: "#BFDBFE", tape: "#93C5FD" }, // blue
  { bg: "#E9D5FF", tape: "#D8B4FE" }, // purple
  { bg: "#FED7AA", tape: "#FDBA74" }, // peach
];

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export function getNoteStyle(id: string): NoteStyle {
  const h = hashString(id);
  return {
    color: NOTE_COLORS[h % NOTE_COLORS.length],
    rotation: (h % 7) - 3, // -3deg to 3deg
  };
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const PRIORITY_DOT: Record<Priority, string> = {
  HIGH: "#DC2626",
  MEDIUM: "#D97706",
  LOW: "#16A34A",
};