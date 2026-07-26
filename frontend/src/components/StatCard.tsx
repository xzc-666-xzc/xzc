interface StatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  icon: JSX.Element;
  trend?: 'up' | 'down' | 'flat';
  trendLabel?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'teal';
}

const colorMap = {
  blue: { text: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  green: { text: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500' },
  amber: { text: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  red: { text: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500' },
  teal: { text: 'text-teal-600', bg: 'bg-teal-50', dot: 'bg-teal-500' },
};

export default function StatCard({ label, value, suffix, icon, trend, trendLabel, color = 'blue' }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-card card-hover p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
          <span className={c.text}>{icon}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold ${c.text}`}>{value}</span>
        {suffix && <span className="text-base font-normal text-slate-400 ml-0.5">{suffix}</span>}
      </div>
      {trend && trendLabel && (
        <div className="flex items-center gap-1 mt-2">
          <span className={`text-xs ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}
