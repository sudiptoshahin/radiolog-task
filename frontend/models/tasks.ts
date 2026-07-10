export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type Status = "TODO" | "IN_PROGRESS" | "DONE";

export interface TaskTag {
  id: string;
  label: string;
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