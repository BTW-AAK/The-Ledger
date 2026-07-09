export default function MetricCard({
  label,
  value,
  valueClassName = "text-paper",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="bg-panel rounded-[10px] p-3 sm:p-4 min-w-0">
      <div className="text-xs text-sage mb-1.5 truncate">{label}</div>
      <div className={`font-mono text-base sm:text-lg truncate ${valueClassName}`}>{value}</div>
    </div>
  );
}
