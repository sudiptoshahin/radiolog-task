"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, LogInIcon, ClipboardListIcon, HighlighterIcon, HouseIcon } from "lucide-react";
import { useRouter } from "next/navigation";


interface MenuItem {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
}

export default function FloatingActionButton() {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const menuItems: MenuItem[] = [
        { label: "Home", icon: HouseIcon, onClick: () => router.push('/') },
        { label: "Login", icon: LogInIcon, onClick: () => router.push('/auth/login') },
        { label: "Kanaban", icon: ClipboardListIcon, onClick: () => router.push('/kanaban') },
        { label: "Annotator", icon: HighlighterIcon, onClick: () => router.push('/annotator') },
    ];

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="fixed bottom-10 right-10 flex flex-col items-end gap-3">
            {/* Menu panel */}
            <div
                className={`flex flex-col items-stretch gap-2 rounded-2xl bg-white p-2 shadow-xl transition-all duration-200 ease-out ${open
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-2 opacity-0"
                    }`}
            >
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.label}
                            onClick={() => {
                                item.onClick();
                                setOpen(false);
                            }}
                            className="flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-taupe-dark transition hover:bg-cream"
                        >
                            <Icon className="h-4 w-4 text-sage-dark" />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {/* Floating button */}
            <div
                onClick={() => setOpen((prev) => !prev)}
                className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-sage shadow-lg transition-transform duration-200 ${open ? "rotate-45" : "animate-[bounce_2.5s_ease-in-out_infinite]"
                    }`}
            >
                <Plus className="h-6 w-6 text-cream transition-transform" />
            </div>
        </div>
    );
}