/** Bundled at `frontend/public/gaffer-desk-logo.png` */
export const GAFFER_DESK_LOGO_SRC = "/gaffer-desk-logo.png";

/**
 * @param {{ className?: string, compact?: boolean }} props
 */
export function GafferDeskLogo({ className = "", compact = false }) {
  return (
    <img
      src={GAFFER_DESK_LOGO_SRC}
      alt="Gaffer Desk"
      width={compact ? 140 : 320}
      height={compact ? 36 : 80}
      decoding="async"
      className={`object-contain object-left ${compact ? "h-8 w-auto max-w-[140px]" : "h-auto w-full max-w-[min(100%,20rem)]"} ${className}`.trim()}
    />
  );
}
