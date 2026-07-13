import Link from "next/link";
import { LogIn, LayoutGrid, ImageIcon } from "lucide-react";
import FloatingActionButton from "@/components/common/FloatingActionButton";

interface NavCard {
    href: string;
    title: string;
    description: string;
    icon: React.ElementType;
    accent: "sage" | "taupe";
}

const NAV_CARDS: NavCard[] = [
    {
        href: "/auth/login",
        title: "Login",
        description: "Access your account",
        icon: LogIn,
        accent: "taupe",
    },
    {
        href: "/kanaban",
        title: "Kanban",
        description: "Manage tasks",
        icon: LayoutGrid,
        accent: "sage",
    },
    {
        href: "/annotator",
        title: "Annotator",
        description: "Annotate and label radio images",
        icon: ImageIcon,
        accent: "sage",
    },
];

const ACCENT_STYLES = {
    sage: {
        iconBg: "bg-sage/15 group-hover:bg-sage/25",
        iconColor: "text-sage-dark",
        border: "hover:border-sage",
    },
    taupe: {
        iconBg: "bg-taupe/15 group-hover:bg-taupe/25",
        iconColor: "text-taupe-dark",
        border: "hover:border-taupe",
    },
};

export default function HomeNav() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center bg-cream px-6 py-32">
            <main className="w-full max-w-4xl">
                <div className="mb-12 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-sage-dark">
                        VAi Radiology Tasks
                    </h1>
                    <p className="mt-2 text-taupe-dark/70">Choose where you'd like to go</p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {NAV_CARDS.map((card) => {
                        const Icon = card.icon;
                        const style = ACCENT_STYLES[card.accent];
                        return (
                            <Link
                                key={card.href}
                                href={card.href}
                                className={`group flex flex-col items-center gap-4 rounded-2xl border border-transparent bg-white p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(138,154,91,0.15),0_3px_6px_rgba(0,0,0,0.08)] ${style.border}`}
                            >
                                <div
                                    className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${style.iconBg}`}
                                >
                                    <Icon className={`h-8 w-8 ${style.iconColor}`} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-neutral-800">
                                        {card.title}
                                    </h2>
                                    <p className="mt-1 text-sm text-neutral-500">
                                        {card.description}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </main>
            <FloatingActionButton />
        </div>
    );
}