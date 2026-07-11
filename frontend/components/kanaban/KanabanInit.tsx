
import { useEffect, useState } from "react";
import useTaskStore from "@/store/useTaskStore";

export default function KanabanInit() {
    const { fetchTasks, fetchTags, createTask, updateTask, deleteTask } = useTaskStore();


    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    useEffect(() => {
        fetchTags()
    }, [fetchTags]);

    return (<></>);
}