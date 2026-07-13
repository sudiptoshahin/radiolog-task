
function IconWrap({ children }: { children: React.ReactNode }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {children}
        </svg>
    );
}

export const ChevronLeft = () => (
    <IconWrap>
        <path d="M15 18l-6-6 6-6" />
    </IconWrap>
);
export const ChevronRight = () => (
    <IconWrap>
        <path d="M9 18l6-6-6-6" />
    </IconWrap>
);
export const PencilIcon = () => (
    <IconWrap>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </IconWrap>
);
export const ZoomOutIcon = () => (
    <IconWrap>
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
        <path d="M8 11h6" />
    </IconWrap>
);
export const ZoomInIcon = () => (
    <IconWrap>
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
        <path d="M11 8v6M8 11h6" />
    </IconWrap>
);
export const ZoomResetIcon = () => (
    <IconWrap>
        <path d="M8 3H5a2 2 0 0 0-2 2v3" />
        <path d="M16 3h3a2 2 0 0 1 2 2v3" />
        <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
        <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </IconWrap>
);
export const TrashIcon = () => (
    <IconWrap>
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </IconWrap>
);
export const UndoIcon = () => (
    <IconWrap>
        <path d="M3 7v6h6" />
        <path d="M3 13a9 9 0 1 0 3-7.7L3 7" />
    </IconWrap>
);
export const RedoIcon = () => (
    <IconWrap>
        <path d="M21 7v6h-6" />
        <path d="M21 13a9 9 0 1 1-3-7.7L21 7" />
    </IconWrap>
);
export const SaveIcon = () => (
    <IconWrap>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <path d="M17 21v-8H7v8" />
        <path d="M7 3v5h8" />
    </IconWrap>
);