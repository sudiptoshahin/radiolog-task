export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type Status = "TODO" | "IN_PROGRESS" | "DONE";

export interface TaskTag {
  id: string;
  label?: string;
  value?: string;
}

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  due_date: string;
  created_at: string;
  tags: TaskTag[];
  status: Status;
}

export interface NoteStyle {
  color: { bg: string; tape: string };
  rotation: number;
}

export interface TaskCreatePayload {
  title: string;
  priority: Priority;
  due_date: string;
  tags: TaskTag[];
  status: Status;
}

export interface TaskUpdatePayload {
  title?: string;
  priority?: Priority;
  due_date?: string;
  tags?: TaskTag[];
  status?: Status;
}