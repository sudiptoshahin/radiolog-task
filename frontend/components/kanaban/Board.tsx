"use client";

import { useRef, useState, useCallback } from "react";
import { Kalam } from "next/font/google";
import { Task, Status, TaskTag } from "../../models/tasks";
import { generateMockTasks } from "../../utils/kanaban";
import Column from "./Column";
import Image from "next/image";
import TaskModal from "./TaskModal";

const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });

const COLUMNS: { id: Status; title: string }[] = [
    { id: "TODO", title: "To Do" },
    { id: "IN_PROGRESS", title: "In Progress" },
    { id: "DONE", title: "Done" },
];

export const AVAILABLE_TAGS: TaskTag[] = [
  { id: "t1", label: "Bug" },
  { id: "t2", label: "Frontend" },
  { id: "t3", label: "Backend" },
  { id: "t4", label: "Urgent" },
  { id: "t5", label: "Design" },
  { id: "t6", label: "API" },
];

export default function Board() {
    const [tasks, setTasks] = useState<Task[]>(() => generateMockTasks());
    const columnRefs = useRef<Record<Status, HTMLDivElement | null>>({
        TODO: null,
        IN_PROGRESS: null,
        DONE: null,
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

    const handleDropToColumn = useCallback((taskId: string, status: Status) => {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    }, []);

    function onHandleTaskCreate() {
        openCreateModal()
    }

    function openCreateModal() {
        setEditingTask(undefined);
        setModalOpen(true);
    }

    function openEditModal(task: Task) {
        setEditingTask(task);
        setModalOpen(true);
    }

    function handleTaskSubmit(task: Task) {
        setTasks((prev) => {
            const exists = prev.some((t) => t.id === task.id);
            return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [...prev, task];
        });
    }

    return (
        <div className="w-full h-full rounded-2xl border-[6px] border-neutral-300 bg-white p-6 shadow-lg relative">
            <h1 className={`${kalam.className} text-center text-3xl font-bold text-neutral-800`}>
                Kanban
            </h1>
            <div className="mx-auto mt-2 h-[2px] w-full bg-neutral-800" />

            <div className="relative mt-4 grid grid-cols-1 gap-0 sm:grid-cols-3">
                <div className="pointer-events-none absolute inset-y-0 left-1/3 hidden w-[2px] bg-neutral-800 sm:block" />
                <div className="pointer-events-none absolute inset-y-0 left-2/3 hidden w-[2px] bg-neutral-800 sm:block" />

                {COLUMNS.map((col) => (
                    <Column
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        tasks={tasks.filter((t) => t.status === col.id)}
                        columns={COLUMNS}
                        columnRefs={columnRefs}
                        onDropToColumn={handleDropToColumn}
                    />
                ))}
            </div>

            <div className="absolute bottom-20 right-10 flex h-[50px] w-[50px] items-center justify-center rounded-full bg-black animate-[bounce_2.5s_ease-in-out_infinite] cursor-pointer"
                onClick={onHandleTaskCreate}>
                <Image src={"/images/icons/create_task.svg"} height={24} width={24} alt="add-task" />
            </div>

            <div className="">
                <TaskModal
                    tags={AVAILABLE_TAGS}
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSubmit={handleTaskSubmit}
                    initialData={editingTask}
                />
            </div>

        </div>
    );
}