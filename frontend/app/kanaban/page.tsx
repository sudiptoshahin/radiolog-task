"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import Draggable from "react-draggable";
import { Kalam } from "next/font/google";
import Board from "@/components/kanaban/Board";
import { Status, Task } from "@/models/tasks";
import useTaskStore from "@/store/useTaskStore";
import { generateMockTasks } from "@/utils/kanaban";



export default function Kanaban() {
    const { tasks, fetchTasks, createTask, updateTask, deleteTask } = useTaskStore();
    const [kanabanTasks, setKanabanTasks] = useState<Task[]>(() => generateMockTasks());
    const columnRefs = useRef<Record<Status, HTMLDivElement | null>>({
        TODO: null,
        IN_PROGRESS: null,
        DONE: null,
    });

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // const handleDropToColumn = useCallback((taskId: string, status: Status) => {
    //     setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    // }, []);

    return (
        <div className="w-full h-[100vh]">
            <Board />
        </div>
    );
}