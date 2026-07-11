"use client";

import { useRef, useState, useCallback } from "react";
import { Kalam } from "next/font/google";
import { Task, Status, TaskTag } from "../../models/tasks";
import Column from "./Column";
import Image from "next/image";
import TaskModal from "./TaskModal";
import useTaskStore from "@/store/useTaskStore";
import KanabanInit from "./KanabanInit";
import { TaskActionsProvider } from "@/context/TaskActionContext";
import DeleteConfirmationModal from "../common/DeleteConfirmationModal";

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
    const { tasks, tags, isLoading, error, createTask, updateTask, deleteTask } = useTaskStore();
    const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);
    const columnRefs = useRef<Record<Status, HTMLDivElement | null>>({
        TODO: null,
        IN_PROGRESS: null,
        DONE: null,
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

    const handleDropToColumn = useCallback(
        (taskId: string, status: Status) => {
            updateTask(taskId, { status });
        },
        [updateTask]
    );

    function onHandleTaskCreate() {
        openCreateModal();
    }

    function openCreateModal() {
        setEditingTask(undefined);
        setModalOpen(true);
    }

    function openEditModal(task: Task) {
        setEditingTask(task);
        setModalOpen(true);
    }

    async function handleTaskSubmit(task: Task) {
        const isEdit = tasks.some((t) => t.id === task.id);

        if (isEdit) {
            await updateTask(task.id, {
                title: task.title,
                priority: task.priority,
                due_date: task.due_date,
                status: task.status,
                tags: task.tags.map((t) => (t.id))
            });
        } else {
            await createTask({
                title: task.title,
                priority: task.priority,
                due_date: task.due_date,
                status: task.status,
                tags: task.tags.map((t) => (t.id))
            });
        }
    }

    function onHandleTaskEdit(task: Task): void {
        openEditModal(task);
    }

    function onHandleTaskDelete(taskId: string): void {
        const task = tasks.find((t) => t.id === taskId);
        if (task) setTaskPendingDelete(task);
    }

    const confirmDelete = () => {
        if (!taskPendingDelete) return;
        deleteTask(taskPendingDelete.id);
        setTaskPendingDelete(null);
    };

    const cancelDelete = () => setTaskPendingDelete(null);

    return (
        <div className="relative h-full w-full rounded-2xl border-[6px] border-neutral-300 bg-white p-6 shadow-lg">
            <KanabanInit />
            <h1 className={`${kalam.className} text-center text-3xl font-bold text-neutral-800`}>
                Kanban
            </h1>
            <div className="mx-auto mt-2 h-[2px] w-full bg-neutral-800" />

            {error && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
                    {error}
                </p>
            )}

            {isLoading && tasks.length === 0 ? (
                <p className={`${kalam.className} mt-10 text-center text-neutral-400`}>
                    Loading tasks...
                </p>
            ) : (
                <TaskActionsProvider handleTaskEdit={onHandleTaskEdit} handleTaskDelete={onHandleTaskDelete}>
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
                </TaskActionsProvider>
            )}

            <div
                className="absolute bottom-20 right-10 flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-full bg-black animate-[bounce_2.5s_ease-in-out_infinite]"
                onClick={onHandleTaskCreate}
            >
                <Image src={"/images/icons/create_task.svg"} height={24} width={24} alt="add-task" />
            </div>

            <div>
                <TaskModal
                    tags={tags}
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSubmit={handleTaskSubmit}
                    initialData={editingTask}
                />
            </div>
            <div className="">
                <DeleteConfirmationModal
                    isOpen={taskPendingDelete !== null}
                    taskTitle={taskPendingDelete?.title ?? ""}
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            </div>
        </div>
    );
}