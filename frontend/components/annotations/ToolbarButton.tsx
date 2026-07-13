


export default function ToolbarButton({
  children,
  onClick,
  label,
  active,
  disabled,
  accent,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex items-center justify-center w-10 h-10 rounded-md transition-colors",
        "disabled:opacity-30 disabled:cursor-not-allowed",
        accent
          ? "bg-emerald-600 text-white hover:bg-emerald-700"
          : active
            ? "bg-blue-700 text-white"
            : "bg-blue-600 text-white hover:bg-blue-700",
      ].join(" ")}
    >
      {children}
    </button>
  );
}