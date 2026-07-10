"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import Draggable from "react-draggable";
import { Kalam } from "next/font/google";

const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });

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
    { id: "c1da4abc-fbdd-4c3f-af54-89d915786190", title: "Fix login bug", priority: "HIGH", due_date: "2026-07-15T10:00:00Z", created_at: "2026-07-10T08:18:37Z", tags: [mockTags[0]] },
    { id: "a2b3c4d5-1111-4c3f-af54-89d915786191", title: "Design new dashboard", priority: "MEDIUM", due_date: "2026-07-20T10:00:00Z", created_at: "2026-07-09T08:18:37Z", tags: [mockTags[4]] },
    { id: "b3c4d5e6-2222-4c3f-af54-89d915786192", title: "Set up CI/CD pipeline", priority: "LOW", due_date: "2026-07-25T10:00:00Z", created_at: "2026-07-08T08:18:37Z", tags: [mockTags[2]] },
    { id: "d4e5f6a7-3333-4c3f-af54-89d915786193", title: "OAuth integration", priority: "HIGH", due_date: "2026-07-12T10:00:00Z", created_at: "2026-07-07T08:18:37Z", tags: [mockTags[5]] },
    { id: "e5f6a7b8-4444-4c3f-af54-89d915786194", title: "Write unit tests", priority: "MEDIUM", due_date: "2026-07-18T10:00:00Z", created_at: "2026-07-06T08:18:37Z", tags: [mockTags[2]] },
    { id: "f6a7b8c9-5555-4c3f-af54-89d915786195", title: "Refactor task card", priority: "LOW", due_date: "2026-07-22T10:00:00Z", created_at: "2026-07-05T08:18:37Z", tags: [mockTags[1]] },
    { id: "a1a2a3a4-6666-4c3f-af54-89d915786196", title: "Update API docs", priority: "LOW", due_date: "2026-07-28T10:00:00Z", created_at: "2026-07-04T08:18:37Z", tags: [mockTags[5]] },
    { id: "b2b3b4b5-7777-4c3f-af54-89d915786197", title: "Client feedback review", priority: "MEDIUM", due_date: "2026-07-14T10:00:00Z", created_at: "2026-07-03T08:18:37Z", tags: [mockTags[4]] },
  ];

  const statuses: Status[] = ["TODO", "TODO", "IN_PROGRESS", "IN_PROGRESS", "DONE", "DONE", "TODO", "DONE"];
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

function noteStyle(id: string) {
  const h = hashString(id);
  const color = NOTE_COLORS[h % NOTE_COLORS.length];
  const rotation = (h % 7) - 3; // -3deg to 3deg
  return { color, rotation };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PRIORITY_DOT: Record<Priority, string> = {
  HIGH: "#DC2626",
  MEDIUM: "#D97706",
  LOW: "#16A34A",
};

// ---------- Column config ----------

const COLUMNS: { id: Status; title: string }[] = [
  { id: "TODO", title: "To Do" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "DONE", title: "Done" },
];

// ---------- Sticky Note (draggable task) ----------

function StickyNote({
  task,
  columnRefs,
  onDropToColumn,
}: {
  task: Task;
  columnRefs: React.MutableRefObject<Record<Status, HTMLDivElement | null>>;
  onDropToColumn: (taskId: string, status: Status) => void;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const { color, rotation } = useMemo(() => noteStyle(task.id), [task.id]);

  const handleStop = useCallback(
    (_e: unknown, data: { x: number; y: number }) => {
      setDragging(false);

      const nodeRect = nodeRef.current?.getBoundingClientRect();
      if (nodeRect) {
        const centerX = nodeRect.left + nodeRect.width / 2;
        const centerY = nodeRect.top + nodeRect.height / 2;

        for (const col of COLUMNS) {
          const colEl = columnRefs.current[col.id];
          if (!colEl) continue;
          const colRect = colEl.getBoundingClientRect();
          const inside =
            centerX >= colRect.left &&
            centerX <= colRect.right &&
            centerY >= colRect.top &&
            centerY <= colRect.bottom;

          if (inside && col.id !== task.status) {
            onDropToColumn(task.id, col.id);
            break;
          }
        }
      }

      setPos({ x: 0, y: 0 });
    },
    [task.id, task.status, onDropToColumn, columnRefs]
  );

  return (
    <Draggable
      nodeRef={nodeRef}
      position={pos}
      onDrag={(_e, data) => setPos({ x: data.x, y: data.y })}
      onStart={() => setDragging(true)}
      onStop={handleStop}
    >
      <div
        ref={nodeRef}
        style={{
          backgroundColor: color.bg,
          transform: `rotate(${dragging ? 0 : rotation}deg)`,
          transition: dragging ? "none" : "transform 0.2s ease, box-shadow 0.2s ease",
          zIndex: dragging ? 50 : 1,
        }}
        className={`relative w-full cursor-grab select-none rounded-sm p-3 shadow-md active:cursor-grabbing ${
          dragging ? "shadow-xl" : ""
        }`}
      >
        {/* tape effect */}
        <div
          style={{ backgroundColor: color.tape }}
          className="absolute -top-2 left-1/2 h-4 w-10 -translate-x-1/2 rotate-1 opacity-70"
        />

        <p className={`${kalam.className} text-[15px] leading-snug text-neutral-800`}>
          {task.title}
        </p>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: PRIORITY_DOT[task.priority] }}
            />
            <span className={`${kalam.className} text-[11px] text-neutral-600`}>
              {formatDate(task.due_date)}
            </span>
          </div>
          {task.tags[0] && (
            <span className={`${kalam.className} text-[11px] text-neutral-500`}>
              #{task.tags[0].label}
            </span>
          )}
        </div>
      </div>
    </Draggable>
  );
}

// ---------- Board ----------

export default function Kanaban() {
  const [tasks, setTasks] = useState<Task[]>(() => generateMockTasks());
  const columnRefs = useRef<Record<Status, HTMLDivElement | null>>({
    TODO: null,
    IN_PROGRESS: null,
    DONE: null,
  });

  const handleDropToColumn = useCallback((taskId: string, status: Status) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
  }, []);

  return (
    <div className="w-full rounded-2xl border-[6px] border-neutral-300 bg-white p-6 shadow-lg">
      <h1 className={`${kalam.className} text-center text-3xl font-bold text-neutral-800`}>
        Kanban
      </h1>
      <div className="mx-auto mt-2 h-[2px] w-full bg-neutral-800" />

      <div className="relative mt-4 grid grid-cols-1 gap-0 sm:grid-cols-3">
        {/* vertical dividers */}
        <div className="pointer-events-none absolute inset-y-0 left-1/3 hidden w-[2px] bg-neutral-800 sm:block" />
        <div className="pointer-events-none absolute inset-y-0 left-2/3 hidden w-[2px] bg-neutral-800 sm:block" />

        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="px-4 pb-4 pt-2">
              <h2 className={`${kalam.className} mb-3 text-center text-xl text-neutral-800`}>
                {col.title}
              </h2>
              <div
                ref={(el) => {
                  columnRefs.current[col.id] = el;
                }}
                className="flex min-h-[420px] flex-wrap content-start gap-4 rounded-md p-2"
              >
                {colTasks.map((task) => (
                  <div key={task.id} className="w-[calc(50%-8px)] sm:w-[110px]">
                    <StickyNote
                      task={task}
                      columnRefs={columnRefs}
                      onDropToColumn={handleDropToColumn}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}