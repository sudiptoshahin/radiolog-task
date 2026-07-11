"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Task, Priority, Status, TaskTag } from "../../models/tasks";
import DatePicker from "../common/DatePicker";


interface TaskModalProps {
  isOpen: boolean;
  tags: Array<TaskTag>;
  onClose: () => void;
  onSubmit: (task: Task) => void;
  initialData?: Task;
  selectedDate?: string;
}

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH"];
const STATUSES: { id: Status; label: string }[] = [
  { id: "TODO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "DONE", label: "Done" },
];

const TITLE_MIN = 3;
const TITLE_MAX = 100;

interface FormErrors {
  title?: string;
  due_date?: string;
}

function emptyForm() {
  return {
    title: "",
    priority: "MEDIUM" as Priority,
    due_date: "",
    tags: [] as string[],
    status: "TODO" as Status,
  };
}

export default function TaskModal({ isOpen, onClose, onSubmit, initialData, tags, selectedDate }: TaskModalProps) {
  const isEditMode = !!initialData;

  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);

  // Reset/populate form whenever the modal opens or the target task changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setForm({
        title: initialData.title,
        priority: initialData.priority,
        due_date: initialData.due_date,
        tags: initialData.tags.map((t) => t.id),
        status: initialData.status,
      });
    } else if(selectedDate) {
      setForm({
        title: "",
        priority: "MEDIUM",
        due_date: selectedDate,
        tags: [],
        status: "TODO",
      })
    } else {
      setForm(emptyForm());
    }
    setErrors({});
    setTouched(false);
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  function validate(values: typeof form): FormErrors {
    const next: FormErrors = {};

    const trimmed = values.title.trim();
    if (!trimmed) {
      next.title = "Title is required.";
    } else if (trimmed.length < TITLE_MIN) {
      next.title = `Title must be at least ${TITLE_MIN} characters.`;
    } else if (trimmed.length > TITLE_MAX) {
      next.title = `Title must be under ${TITLE_MAX} characters.`;
    }

    if (!values.due_date) {
      next.due_date = "Due date is required.";
    }

    return next;
  }

  function handleTitleChange(v: string) {
    const nextForm = { ...form, title: v };
    setForm(nextForm);
    if (touched) setErrors(validate(nextForm));
  }

  function toggleTag(tagId: string) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((id) => id !== tagId)
        : [...prev.tags, tagId],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);

    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const selectedTags: TaskTag[] = tags.filter((tag) =>
      form.tags.includes(tag.id)
    );

    const task: Task = {
      id: initialData?.id ?? crypto.randomUUID(),
      title: form.title.trim(),
      priority: form.priority,
      due_date: form.due_date,
      created_at: initialData?.created_at ?? new Date().toISOString(),
      tags: selectedTags,
      status: form.status,
    };

    onSubmit(task);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-800">
            {isEditMode ? "Edit Task" : "Create Task"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => {
                setTouched(true);
                setErrors(validate(form));
              }}
              placeholder="e.g. Fix login bug"
              className={`w-full text-black rounded-lg  border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.title ? "border-red-400" : "border-neutral-300"
              }`}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Priority */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as Priority }))}
              className="w-full text-black rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <DatePicker
            label="Due date"
            value={form.due_date}
            onChange={(date) => {
              const nextForm = { ...form, due_date: date };
              setForm(nextForm);
              if (touched) setErrors(validate(nextForm));
            }}
            minDate={new Date()}
            error={errors.due_date}
          />

          {/* Tags */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Tags</label>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-neutral-200 p-3">
              {tags.map((tag) => (
                <label key={tag.id} className="flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={form.tags.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                    className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {tag.label}
                </label>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as Status }))}
              className="w-full text-black rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 cursor-pointer"
            >
              {isEditMode ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}