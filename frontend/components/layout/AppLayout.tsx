import FloatingActionButton from "../common/FloatingActionButton";


interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="relative min-h-screen w-full bg-neutral-50">
            {/* mx-auto w-full max-w-6xl px-4 py-6 */}
            <div className="">{children}</div>
            <FloatingActionButton />
        </div>
    );
}