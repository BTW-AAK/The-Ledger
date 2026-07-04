export default function LedgerRule({ ticks = 10 }: { ticks?: number }) {
  const width = 700;
  const step = width / ticks;
  const tickPositions = Array.from({ length: ticks + 1 }, (_, i) => i * step);

  return (
    <svg
      width="100%"
      height="8"
      viewBox={`0 0 ${width} 8`}
      preserveAspectRatio="none"
      className="block"
      role="presentation"
    >
      <line x1="0" y1="1" x2={width} y2="1" stroke="#2C4038" strokeWidth="1" />
      {tickPositions.map((x, i) => (
        <line key={i} x1={x} y1="0" x2={x} y2="7" stroke="#2C4038" strokeWidth="1" />
      ))}
    </svg>
  );
}
