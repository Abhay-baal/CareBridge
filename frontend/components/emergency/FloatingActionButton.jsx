"use client";

export default function FloatingActionButton({
  icon,
  position = "right",
  onClick,
  color = "bg-blue-600",
}) {
  return (
    <button
      onClick={onClick}
      aria-label="Emergency action"
      className={`
        fixed
        bottom-24
        ${position === "right" ? "right-5" : "left-5"}
        ${color}
        z-50
        flex
        h-14
        w-14
        items-center
        justify-center
        rounded-full
        text-white
        shadow-lg
        transition
        hover:scale-105
        active:scale-95
      `}
    >
      {icon}
    </button>
  );
}
