"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Kalam } from "next/font/google";
import { Task, Status } from "../../models/tasks";
import Column from "./Column";
import Image from "next/image";
import TaskModal from "./TaskModal";
import useTaskStore from "@/store/useTaskStore";
import KanabanInit from "./KanabanInit";
import { TaskActionsProvider } from "@/context/TaskActionContext";
import DeleteConfirmationModal from "../common/DeleteConfirmationModal";
import DatePicker from "../common/DatePicker";
import { ClipboardList } from "lucide-react";


const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });

const COLUMNS: { id: Status; title: string }[] = [
    { id: "TODO", title: "To Do" },
    { id: "IN_PROGRESS", title: "In Progress" },
    { id: "DONE", title: "Done" },
];


export default function Board() {
    const { tasks, tags, isLoading, error, fetchTasks, createTask, updateTask, deleteTask } = useTaskStore();
    const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);
    const columnRefs = useRef<Record<Status, HTMLDivElement | null>>({
        TODO: null,
        IN_PROGRESS: null,
        DONE: null,
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
    const [dateFilter, setDateFilter] = useState<string>("");

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

    function onHandleFilterClear() {
        setDateFilter("");
        fetchTasks();
    }

    useEffect(() => {
        if (!Boolean(dateFilter)) return;
        fetchTasks(dateFilter);
    }, [dateFilter]);

    return (
        <div className="relative h-full w-full rounded-2xl border-[6px] border-taupe/30 bg-white p-6 shadow-lg">
            <KanabanInit />
            <div className="w-full flex justify-between">
                <h1 className={`${kalam.className} text-center text-3xl font-bold text-sage-dark`}>
                    Kanban
                </h1>

                <div className="flex items-center space-x-2">
                    <DatePicker
                        label=""
                        value={dateFilter}
                        onChange={(date) => {
                            const dateOnly = date.split("T")[0]
                            setDateFilter(dateOnly);
                        }}
                        minDate={new Date()}
                    />

                    <button className="bg-taupe/15 text-taupe-dark w-[80px] h-[30px] rounded-lg hover:bg-taupe/25 transition-colors" onClick={onHandleFilterClear}>Clear</button>
                </div>
            </div>
            <div className="mx-auto mt-2 h-[2px] w-full bg-sage/40" />

            {error && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
                    {error}
                </p>
            )}

            {isLoading && tasks.length === 0 ? (
                <p className={`${kalam.className} mt-10 text-center text-taupe-dark/60`}>
                    Loading tasks...
                </p>
            ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cream">
                        <ClipboardList className="h-7 w-7 text-sage-dark" />
                    </div>
                    <div>
                        <p className={`${kalam.className} text-lg font-semibold text-sage-dark`}>
                            No tasks yet
                        </p>
                        <p className="mt-1 text-sm text-taupe-dark/60">
                            Tap the <span className="font-medium text-taupe-dark">+</span> button below to add your first task.
                        </p>
                    </div>
                </div>
            ) : (
                <TaskActionsProvider handleTaskEdit={onHandleTaskEdit} handleTaskDelete={onHandleTaskDelete}>
                    <div className="relative mt-4 grid grid-cols-1 gap-0 sm:grid-cols-3">
                        <div className="pointer-events-none absolute inset-y-0 left-1/3 hidden w-[2px] bg-sage/40 sm:block" />
                        <div className="pointer-events-none absolute inset-y-0 left-2/3 hidden w-[2px] bg-sage/40 sm:block" />

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
                className="absolute bottom-12 right-10 flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-full bg-sage animate-[bounce_2.5s_ease-in-out_infinite]"
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
                    selectedDate={dateFilter}
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