/**
 * Full-stage black overlay above the scene and below the cursor follower and
 * modals (SPEC §4). Never intercepts clicks, so the tray stays usable while dimmed.
 */
export function DimOverlay({ opacity }: { opacity: number }) {
  return <div aria-hidden className="pointer-events-none absolute inset-0 bg-black" style={{ opacity }} />;
}
