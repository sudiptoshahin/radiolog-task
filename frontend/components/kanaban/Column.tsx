"use client";

import { Kalam } from "next/font/google";
import { Task, Status } from "../../models/tasks";
import TaskCard from "./TaskCard";

const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });

interface ColumnProps {
  id: Status;
  title: string;
  tasks: Task[];
  columns: { id: Status }[];
  columnRefs: React.MutableRefObject<Record<Status, HTMLDivElement | null>>;
  onDropToColumn: (taskId: string, status: Status) => void;
}

export default function Column({ id, title, tasks, columns, columnRefs, onDropToColumn }: ColumnProps) {
  return (
    <div className="px-4 pb-4 pt-2">
      <h2 className={`${kalam.className} mb-3 text-center text-xl text-neutral-800`}>
        {title}
      </h2>
      <div
        ref={(el) => {
          columnRefs.current[id] = el;
        }}
        className="flex min-h-[calc(100vh-200px)] flex-wrap content-start gap-4 rounded-md p-2"
      >
        {tasks.map((task) => (
          <div key={task.id} className="w-[calc(50%-8px)] sm:w-[110px]">
            <TaskCard
              task={task}
              columnRefs={columnRefs}
              columns={columns}
              onDropToColumn={onDropToColumn}
            />
          </div>
        ))}
      </div>
    </div>
  );
}