export function ProjectProgress({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-surface-muted"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${percent}%` }} />
    </div>
  );
}
