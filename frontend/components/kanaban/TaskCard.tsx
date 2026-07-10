"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import Draggable from "react-draggable";
import { Kalam } from "next/font/google";
import { Task, Status } from "../../models/tasks";
import { getNoteStyle, formatDate, PRIORITY_DOT } from "../../utils/kanaban";

const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });

interface TaskCardProps {
  task: Task;
  columnRefs: React.MutableRefObject<Record<Status, HTMLDivElement | null>>;
  columns: { id: Status }[];
  onDropToColumn: (taskId: string, status: Status) => void;
}

export default function TaskCard({ task, columnRefs, columns, onDropToColumn }: TaskCardProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const { color, rotation } = useMemo(() => getNoteStyle(task.id), [task.id]);

  const handleStop = useCallback(
    (_e: unknown, data: { x: number; y: number }) => {
      setDragging(false);

      const nodeRect = nodeRef.current?.getBoundingClientRect();
      if (nodeRect) {
        console.log('___something___');
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
        }}
        className={`relative w-full cursor-grab select-none rounded-sm p-3 shadow-md active:cursor-grabbing ${
          dragging ? "shadow-xl" : ""
        }`}
      >
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