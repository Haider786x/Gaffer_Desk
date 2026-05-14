import { useState } from "react";
import { GafferDeskLogo } from "../brand/GafferDeskLogo.jsx";

const HERO_PUBLIC_PATH = "/auth-hero.png";

/**
 * Split-panel shell for login / signup — ops terminal aesthetic (reference: GAFFER-DESK access gate).
 */
export function AuthTerminalLayout({
  mode = "login",
  eyebrow,
  instruction,
  children,
  footerExtra,
}) {
  const title =
    mode === "signup" ? "OPERATOR_ONBOARDING" : "OPS_ACCESS_INITIATED";

  const [heroFailed, setHeroFailed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--gd-background)] text-[var(--gd-on-background)] font-[family-name:var(--gd-font-sans)]">
      {/* Left — branding + hero (stacked on narrow viewports) */}
      <aside className="relative flex w-full lg:w-[58%] xl:w-[60%] min-h-[220px] sm:min-h-[280px] lg:min-h-screen flex-col border-b lg:border-b-0 lg:border-r border-[var(--gd-outline-variant)] overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[#09090b]" aria-hidden="true" />

        {!heroFailed ? (
          <img
            src={HERO_PUBLIC_PATH}
            alt=""
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-[center_32%] grayscale contrast-[1.06] brightness-[0.88] opacity-55 mix-blend-luminosity"
            onError={() => setHeroFailed(true)}
          />
        ) : null}

        <div
          className={`absolute inset-0 auth-terminal-noise ${heroFailed ? "opacity-90" : "opacity-40"}`}
          aria-hidden="true"
        />

        <div
          className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/88 to-[#09090b]/40"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 opacity-[0.06] app-gridlines auth-grid-fine"
          aria-hidden="true"
        />

        <div className="relative z-10 flex justify-between items-start p-4 gap-4">
          <p className="font-[family-name:var(--gd-font-mono)] text-[10px] tracking-[0.12em] uppercase text-[var(--gd-primary)] tabular-nums">
            🛡️ CONNECTION_SECURE
          </p>
          <div className="text-right font-[family-name:var(--gd-font-mono)] text-[9px] leading-tight tracking-wide text-[var(--gd-inverse-surface)] tabular-nums">
            <span className="block text-[var(--gd-on-surface-variant)]">
              NODE_ALPHA_01
            </span>
            <span className="block mt-0.5 text-[var(--gd-outline)]">
              LAT: 51.5560 N / LON: 0.2795 W
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-auto p-6 lg:p-8">
          <div className="border-l-2 border-[var(--gd-primary)] pl-4">
            <GafferDeskLogo className="drop-shadow-sm" />
            <p className="mt-5 font-[family-name:var(--gd-font-mono)] text-[11px] sm:text-xs leading-relaxed text-[var(--gd-on-surface-variant)] tracking-[0.06em] uppercase max-w-md">
              INTELLIGENCE UNIT TERMINAL.
              <br />
              UNAUTHORIZED ACCESS PROHIBITED. ALL
              <br />
              ACTIONS LOGGED.
            </p>
          </div>
        </div>
      </aside>

      {/* Right — access panel (#131315) */}
      <main className="flex-1 flex flex-col min-h-screen bg-[var(--gd-background)]">
        <div className="flex-1 flex flex-col px-4 py-8 sm:px-6 sm:py-10 lg:pl-12 lg:pr-16 lg:py-12 w-full max-w-md xl:max-w-lg mx-auto lg:mx-0 lg:ml-8 xl:ml-12">
          <header className="mb-8 space-y-3">
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-sm border border-[var(--gd-outline-variant)] bg-[var(--gd-surface-container-lowest)] px-2 py-1.5">
                <GafferDeskLogo compact />
              </div>
              <div className="min-w-0">
                <p className="gd-section-header text-[var(--gd-inverse-surface)]">
                  {eyebrow ?? title}
                </p>
                <p className="mt-1 text-sm text-[var(--gd-on-surface-variant)] leading-snug max-w-sm gd-body-compact">
                  {instruction}
                </p>
              </div>
            </div>
          </header>

          <div className="flex-1 flex flex-col">{children}</div>

          {footerExtra}

          <footer className="mt-auto pt-8 border-t border-[var(--gd-outline-variant)] flex justify-between items-center gap-4 text-[10px] uppercase tracking-[0.14em] font-[family-name:var(--gd-font-mono)]">
            <span className="text-[var(--gd-outline)] tabular-nums">
              VERSION_4.2.0
            </span>
            <span className="text-[var(--gd-outline)] flex items-center gap-1.5 tabular-nums">
              <span
                className="h-1.5 w-1.5 rounded-full bg-[var(--gd-primary)]"
                aria-hidden="true"
              />
              SYSTEM_ONLINE
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}
