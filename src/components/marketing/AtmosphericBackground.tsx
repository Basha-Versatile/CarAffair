'use client';

/**
 * Persistent ambient background for the customer-facing public site.
 * Sits fixed behind everything; orbs drift slowly so the page never feels static.
 * Calibrated for both light and dark themes.
 */
export default function AtmosphericBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none overflow-hidden mesh-bg">
      {/* Drifting glow orbs — softer in light, richer in dark */}
      <div className="absolute top-[5%] left-[10%] w-[34rem] h-[34rem] rounded-full bg-red-500/10 dark:bg-red-500/20 blur-3xl animate-drift-1" />
      <div className="absolute top-[40%] right-[5%] w-[40rem] h-[40rem] rounded-full bg-red-700/10 dark:bg-red-700/18 blur-3xl animate-drift-2" />
      <div className="absolute bottom-[10%] left-[35%] w-[36rem] h-[36rem] rounded-full bg-red-400/8 dark:bg-red-400/14 blur-3xl animate-drift-3" />

      {/* Dot grid overlay */}
      <div className="absolute inset-0 dot-grid" />

      {/* Vignette — subtle in light mode, deeper in dark */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.08)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.5)_100%)]" />
    </div>
  );
}
