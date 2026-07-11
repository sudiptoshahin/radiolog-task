"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import Draggable from "react-draggable";
import { Kalam } from "next/font/google";
import { Task, Status } from "../../models/tasks";
import { getNoteStyle, formatDate, PRIORITY_DOT } from "../../utils/kanaban";
import Image from "next/image";
import { useTaskActions } from "@/context/TaskActionContext";

const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });

interface TaskCardProps {
  task: Task;
  columnRefs: React.MutableRefObject<Record<Status, HTMLDivElement | null>>;
  columns: { id: Status }[];
  onDropToColumn: (taskId: string, status: Status) => void;
}

export default function TaskCard({ task, columnRefs, columns, onDropToColumn }: TaskCardProps) {
  const { handleTaskEdit, handleTaskDelete } = useTaskActions();
  const nodeRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const { color, rotation } = useMemo(() => getNoteStyle(task.id), [task.id]);

  const TAG_COLOR_PALETTE = [
    { bg: "bg-red-100", text: "text-red-700" },
    { bg: "bg-orange-100", text: "text-orange-700" },
    { bg: "bg-amber-100", text: "text-amber-700" },
    { bg: "bg-yellow-100", text: "text-yellow-800" },
    { bg: "bg-lime-100", text: "text-lime-700" },
    { bg: "bg-green-100", text: "text-green-700" },
    { bg: "bg-emerald-100", text: "text-emerald-700" },
    { bg: "bg-teal-100", text: "text-teal-700" },
    { bg: "bg-cyan-100", text: "text-cyan-700" },
    { bg: "bg-sky-100", text: "text-sky-700" },
    { bg: "bg-blue-100", text: "text-blue-700" },
    { bg: "bg-indigo-100", text: "text-indigo-700" },
    { bg: "bg-violet-100", text: "text-violet-700" },
    { bg: "bg-purple-100", text: "text-purple-700" },
    { bg: "bg-fuchsia-100", text: "text-fuchsia-700" },
    { bg: "bg-pink-100", text: "text-pink-700" },
    { bg: "bg-rose-100", text: "text-rose-700" },
  ];

  function getTagColor(key: string) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % TAG_COLOR_PALETTE.length;
    return TAG_COLOR_PALETTE[index];
  }

  const handleStop = useCallback(
    (_e: unknown, data: { x: number; y: number }) => {
      setDragging(false);

      const nodeRect = nodeRef.current?.getBoundingClientRect();
      if (nodeRect) {
        const centerX = nodeRect.left + nodeRect.width / 2;
        const centerY = nodeRect.top + nodeRect.height / 2;

        for (const col of columns) {
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
    [task.id, task.status, onDropToColumn, columnRefs, columns]
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
          minWidth: 120,
          minHeight: 80
        }}
        className={`relative w-full cursor-grab select-none rounded-sm p-3 shadow-md active:cursor-grabbing ${dragging ? "shadow-xl" : ""
          }`}
      >
        <div
          style={{ backgroundColor: color.tape }}
          className="absolute -top-2 right-0 h-4 w-10 -translate-x-1/2 rotate-1 opacity-70"
        >
          <div className="w-full flex items-center justify-around">
            <Image src="/images/icons/edit.svg" width={14} height={14} alt="edit-task" className="cursour-pointer" onClick={() => handleTaskEdit(task)} />
            <Image src="/images/icons/delete.svg" width={14} height={14} alt="delete-task" className="cursour-pointer" onClick={() => handleTaskDelete(task.id)} />
          </div>
        </div>

        <p className={`${kalam.className} text-[15px] leading-snug text-neutral-800`}>
          {task.title}
        </p>

        <div className="mt-2">
          <div className="flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: PRIORITY_DOT[task.priority] }}
            />
            <span className={`${kalam.className} text-[11px] text-neutral-600`}>
              {formatDate(task.due_date)}
            </span>
          </div>
          <div className="flex items-center flex-wrap gap-1">
            {task.tags.length > 1 ? (
              task.tags.map((tag) => {
                const color = getTagColor(tag.id);
                return (
                  <span
                    key={tag.id}
                    className={`${kalam.className} ${color.bg} ${color.text} text-[11px] mt-1 px-1.5 py-0.5 rounded-md font-medium`}
                  >
                    {tag.label}
                  </span>
                );
              })
            ) : (
              (() => {
                const color = getTagColor(task.tags[0].id);
                return (
                  <span
                    className={`${kalam.className} ${color.bg} ${color.text} text-[11px] mt-1 px-1.5 py-0.5 rounded-md font-medium`}
                  >
                    {task.tags[0].label}
                  </span>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </Draggable>
  );
}