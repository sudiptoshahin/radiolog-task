"use client";

import { useState } from "react";
import { Calendar, Tag as TagIcon, GripVertical } from "lucide-react";

// ---------- Types ----------

type Priority = "LOW" | "MEDIUM" | "HIGH";
type Status = "TODO" | "IN_PROGRESS" | "DONE";

interface TaskTag {
  id: string;
  label: string;
}

interface Task {
  id: string;
  title: string;
  priority: Priority;
  due_date: string;
  created_at: string;
  tags: TaskTag[];
  status: Status;
}

// ---------- Mock data (replace with API fetch) ----------

const mockTags: TaskTag[] = [
  { id: "t1", label: "Bug" },
  { id: "t2", label: "Frontend" },
  { id: "t3", label: "Backend" },
  { id: "t4", label: "Urgent" },
  { id: "t5", label: "Design" },
  { id: "t6", label: "API" },
];

function generateMockTasks(): Task[] {
  const raw: Omit<Task, "status">[] = [
    {
      id: "c1da4abc-fbdd-4c3f-af54-89d915786190",
      title: "Fix login bug",
      priority: "HIGH",
      due_date: "2026-07-15T10:00:00Z",
      created_at: "2026-07-10T08:18:37.559946Z",
      tags: [mockTags[0], mockTags[3]],
    },
    {
      id: "a2b3c4d5-1111-4c3f-af54-89d915786191",
      title: "Design new dashboard layout",
      priority: "MEDIUM",
      due_date: "2026-07-20T10:00:00Z",
      created_at: "2026-07-09T08:18:37.559946Z",
      tags: [mockTags[4], mockTags[1]],
    },
    {
      id: "b3c4d5e6-2222-4c3f-af54-89d915786192",
      title: "Set up CI/CD pipeline",
      priority: "LOW",
      due_date: "2026-07-25T10:00:00Z",
      created_at: "2026-07-08T08:18:37.559946Z",
      tags: [mockTags[2]],
    },
    {
      id: "d4e5f6a7-3333-4c3f-af54-89d915786193",
      title: "Implement OAuth integration",
      priority: "HIGH",
      due_date: "2026-07-12T10:00:00Z",
      created_at: "2026-07-07T08:18:37.559946Z",
      tags: [mockTags[5], mockTags[3]],
    },
    {
      id: "e5f6a7b8-4444-4c3f-af54-89d915786194",
      title: "Write unit tests for auth module",
      priority: "MEDIUM",
      due_date: "2026-07-18T10:00:00Z",
      created_at: "2026-07-06T08:18:37.559946Z",
      tags: [mockTags[2]],
    },
    {
      id: "f6a7b8c9-5555-4c3f-af54-89d915786195",
      title: "Refactor task card component",
      priority: "LOW",
      due_date: "2026-07-22T10:00:00Z",
      created_at: "2026-07-05T08:18:37.559946Z",
      tags: [mockTags[1], mockTags[4]],
    },
  ];

  const statuses: Status[] = ["TODO", "IN_PROGRESS", "DONE"];
  return raw.map((task, i) => ({
    ...task,
    status: statuses[i % 3],
  }));
}

// ---------- Config ----------

const COLUMNS: { id: Status; title: string; accent: string }[] = [
  { id: "TODO", title: "To Do", accent: "bg-slate-400" },
  { id: "IN_PROGRESS", title: "In Progress", accent: "bg-amber-500" },
  { id: "DONE", title: "Done", accent: "bg-emerald-500" },
];

const PRIORITY_STYLES: Record<Priority, string> = {
  HIGH: "bg-red-50 text-red-700 ring-1 ring-red-200",
  MEDIUM: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  LOW: "bg-slate-50 text-slate-600 ring-1 ring-slate-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ---------- Task Card ----------

function TaskCard({
  task,
  onDragStart,
  isDragging,
}: {
  task: Task;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  isDragging: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className={`group cursor-grab active:cursor-grabbing rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md ${
        isDragging ? "opacity-40" : "opacity-100"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">{task.title}</p>
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-400" />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLES[task.priority]}`}
        >
          {task.priority}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500 ring-1 ring-slate-200">
          <Calendar className="h-3 w-3" />
          {formatDate(task.due_date)}
        </span>
      </div>

      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              className="flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[11px] text-indigo-600"
            >
              <TagIcon className="h-3 w-3" />
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Column ----------

function Column({
  id,
  title,
  accent,
  tasks,
  draggingId,
  onDragStart,
  onDrop,
}: {
  id: Status;
  title: string;
  accent: string;
  tasks: Task[];
  draggingId: string | null;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDrop: (status: Status) => void;
}) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={() => {
        setIsOver(false);
        onDrop(id);
      }}
      className={`flex w-full flex-col rounded-xl border bg-slate-50/60 p-3 transition ${
        isOver ? "border-indigo-300 bg-indigo-50/50" : "border-slate-200"
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${accent}`} />
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
          {tasks.length}
        </span>
      </div>

      <div className="flex min-h-[120px] flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            isDragging={draggingId === task.id}
          />
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-xs text-slate-400">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Board ----------

export default function Kanaban() {
  const [tasks, setTasks] = useState<Task[]>(() => generateMockTasks());
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(taskId);
  };

  const handleDrop = (status: Status) => {
    const taskId = draggingId;
    if (!taskId) return;

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status } : task
      )
    );
    setDraggingId(null);
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Board</h2>
        <p className="text-sm text-slate-500">
          Drag a task card into another column to update its status.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            title={col.title}
            accent={col.accent}
            tasks={tasks.filter((t) => t.status === col.id)}
            draggingId={draggingId}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}