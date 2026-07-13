"use client";

import { useEffect } from "react";
import Board from "@/components/kanaban/Board";
import useTaskStore from "@/store/useTaskStore";
import AppLayout from "@/components/layout/AppLayout";



export default function Kanaban() {
    const { fetchTasks } = useTaskStore();

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return (
        <AppLayout>
            <div className="w-full h-[100vh]">
                <Board />
            </div>
        </AppLayout>
    );
}