"use client";

import { DeleteConfirmationModalProps } from "@/models/tasks";
import { useEffect, useRef } from "react";

export default function DeleteConfirmationModal({
    isOpen,
    taskTitle,
    onConfirm,
    onCancel,
}: DeleteConfirmationModalProps) {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onCancel]);

    useEffect(() => {
        if (isOpen) cancelButtonRef.current?.focus();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={onCancel}
            role="presentation"
        >
            <div
                className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-900 p-5 shadow-xl"
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="delete-modal-title"
                aria-describedby="delete-modal-description"
            >
                <h2 id="delete-modal-title" className="text-base font-semibold text-neutral-100">
                    Delete task
                </h2>
                <p id="delete-modal-description" className="mt-2 text-sm text-neutral-400">
                    {taskTitle ? (
                        <>
                            Are you sure you want to delete <span className="text-neutral-200">&ldquo;{taskTitle}&rdquo;</span>?
                        </>
                    ) : (
                        "Are you sure you want to delete this task?"
                    )}{" "}
                    This can&apos;t be undone.
                </p>

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        ref={cancelButtonRef}
                        onClick={onCancel}
                        className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-300 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}