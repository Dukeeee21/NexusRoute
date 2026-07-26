/** Reusable KPI card — same look as the Dashboard's original inline cards. */
export default function MetricsCard({ label, value, hint, hintColor = "text-slate-400", Icon }) {
  return (
    <div className="rounded-xl border border-nexus-border bg-nexus-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        {Icon && (
          <span className="text-slate-500">
            <Icon width={18} height={18} />
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
      {hint && <p className={`mt-1 text-xs ${hintColor}`}>{hint}</p>}
    </div>
  );
}
