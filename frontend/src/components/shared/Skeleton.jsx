export function Skeleton({
  className = "",
  rounded = "md",
}) {
  const radius =
    rounded === "full"
      ? "rounded-full"
      : rounded === "lg"
      ? "rounded-lg"
      : "rounded-md";
  return (
    <div
      className={`bg-app-elevated-light/60 ${radius} animate-pulse ${className}`}
    />
  );
}

