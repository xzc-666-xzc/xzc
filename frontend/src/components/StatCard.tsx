interface StatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  icon: JSX.Element;
  trend?: 'up' | 'down' | 'flat';
  trendLabel?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'teal' | 'purple';
}

const colorMap = {
  blue:   { text: 'text-accent-700', bg: 'bg-accent-50', dot: 'bg-accent-500', icon: 'text-accent-600' },
  green:  { text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500', icon: 'text-emerald-600' },
  amber:  { text: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500', icon: 'text-amber-600' },
  red:    { text: 'text-rose-700', bg: 'bg-rose-50', dot: 'bg-rose-500', icon: 'text-rose-600' },
  teal:   { text: 'text-teal-700', bg: 'bg-teal-50', dot: 'bg-teal-500', icon: 'text-teal-600' },
  purple: { text: 'text-brand-700', bg: 'bg-brand-50', dot: 'bg-brand-500', icon: 'text-brand-600' },
};

export default function StatCard({ label, value, suffix, icon, trend, trendLabel, color = 'blue' }: StatCardProps) {
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className="card card-hover p-5 group cursor-default">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-slate-500 tracking-wide">{label}</p>
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center
                        transition-transform duration-300 group-hover:scale-110 group-hover:shadow-sm`}>
          <span className={c.icon}>{icon}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-[32px] font-extrabold tracking-tight ${c.text} tabular-nums`}>{value}</span>
        {suffix && (
          <span className="text-sm font-medium text-slate-400 ml-0.5">{suffix}</span>
        )}
      </div>
      {trend && trendLabel && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-50">
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full
            ${trend === 'up' ? 'bg-emerald-50 text-emerald-700' :
              trend === 'down' ? 'bg-rose-50 text-rose-600' :
              'bg-slate-50 text-slate-500'}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}
