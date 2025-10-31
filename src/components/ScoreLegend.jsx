export default function ScoreLegendBar() {
  const labels = ["Excellent", "Good", "Fair", "Poor", "Bad"];

  return (
    <div className="mt-5">
      {/* Labels */}
      <div className="flex justify-between text-[0.7rem] text-slate-600 font-medium mb-1 px-1">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      {/* Gradient bar */}
      <div
        className="h-2 w-full rounded-full shadow-inner"
        style={{
          background: "linear-gradient(to right, #22c55e, #84cc16, #facc15, #f97316, #ef4444)",
        }}
      />

      {/* Range labels (optional numbers) */}
      <div className="flex justify-between text-[0.65rem] text-slate-400 font-medium mt-0.5 px-1">
        <span>70</span>
        <span>50</span>
        <span>30</span>
        <span>15</span>
        <span>0</span>
      </div>
    </div>
  );
}
