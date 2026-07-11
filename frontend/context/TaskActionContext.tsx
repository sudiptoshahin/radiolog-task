"use client";

import { Task } from "@/models/tasks";
import { createContext, useContext } from "react";

interface TaskActionsContextType {
  handleTaskEdit: (task: Task) => void;
  handleTaskDelete: (taskId: string) => void;
}

const TaskActionsContext = createContext<TaskActionsContextType | null>(null);

export function TaskActionsProvider({
  children,
  handleTaskEdit,
  handleTaskDelete,
}: TaskActionsContextType & { children: React.ReactNode }) {
  return (
    <TaskActionsContext.Provider value={{ handleTaskEdit, handleTaskDelete }}>
      {children}
    </TaskActionsContext.Provider>
  );
}

export function useTaskActions() {
  const context = useContext(TaskActionsContext);
  if (!context) {
    throw new Error("useTaskActions must be used within a TaskActionsProvider");
  }
  return context;
}