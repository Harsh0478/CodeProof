import { CheckCircle2, Clock3, Cpu, ShieldCheck, XCircle } from 'lucide-react';
export default function MetricsGrid({verification={}}){
  const passed=verification.passedTests??0,total=verification.totalTests??0;
  const cards=[
    ['Behavioral match',`${verification.score??0}%`,ShieldCheck,'text-emerald-600'],
    ['Tests',`${passed}/${total}`,CheckCircle2,'text-violet-600'],
    ['Compilation errors',`${verification.compilationErrors??0}`,XCircle,'text-rose-600'],
    ['Runtime errors',`${verification.runtimeErrors??0}`,Cpu,'text-amber-600'],
    ['Execution time',`${verification.executionTime??0} ms`,Clock3,'text-sky-600'],
    ['AI confidence',verification.aiConfidence!=null?`${Math.round(verification.aiConfidence*100)}%`:'—',ShieldCheck,'text-fuchsia-600'],
  ];
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([label,value,Icon,iconClass])=><div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#111a2c]"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><Icon size={17} className={iconClass}/></div><div className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">{value}</div></div>)}</div>
}
