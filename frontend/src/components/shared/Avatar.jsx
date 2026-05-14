import { publicUploadUrl } from "../../utils/uploads.js";

const sizeMap = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-16 w-16 text-base",
};

export function Avatar({
  src,
  alt = "",
  initials,
  size = "md",
  rounded = "full",
  className = "",
}) {
  const sizeClasses = sizeMap[size] || sizeMap.md;
  const shape =
    rounded === "lg" ? "rounded-lg" : rounded === "md" ? "rounded-md" : "rounded-full";

  return (
    <div
      className={`inline-flex items-center justify-center border border-app-border bg-app-elevated-light overflow-hidden ${sizeClasses} ${shape} ${className}`}
    >
      {src ? (
        <img
          src={publicUploadUrl(src)}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-app-text-muted font-semibold select-none">
          {(initials || "?")
            .toString()
            .trim()
            .slice(0, 2)
            .toUpperCase()}
        </span>
      )}
    </div>
  );
}

