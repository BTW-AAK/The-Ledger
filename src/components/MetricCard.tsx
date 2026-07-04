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
    <div className="bg-panel rounded-[10px] p-4">
      <div className="text-xs text-sage mb-1.5">{label}</div>
      <div className={`font-mono text-lg ${valueClassName}`}>{value}</div>
    </div>
  );
}
