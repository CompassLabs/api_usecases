import { cn } from "@/utils/utils";

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-neutral-200 inline-block h-2.5 rounded-full animate-pulse self-center",
        className
      )}
    />
  );
}
