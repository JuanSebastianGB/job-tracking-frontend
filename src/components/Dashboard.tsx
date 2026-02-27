import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { format, parseISO, subDays, isAfter, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subWeeks, isWithinInterval, differenceInDays } from "date-fns";
import { TrendingUp, AlertCircle, CheckCircle2, Clock, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";

// === Design Tokens ===
const glass = {
  card: "backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl",
  cardStrong: "backdrop-blur-xl bg-white/80 border border-white/30",
  stat: "bg-gradient-to-br from-white to-white/60 p-6 rounded-2xl border border-white/30",
};

const shadows = {
  card: "shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)]",
  elevated: "shadow-[0_8px_30px_-3px_rgba(0,0,0,0.1)]",
  hover: "shadow-[0_20px_40px_-4px_rgba(0,0,0,0.12)]",
};

const transitions = {
  default: "transition-all duration-300 ease-out",
};

export default function Dashboard({ isLoading }: { isLoading?: boolean }) {
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await fetch("/api/jobs");
      return res.json();
    },
  });
  const stats = useMemo(() => {
    const now = new Date();
    const total = jobs.length;
    const interviews = jobs.filter(j => j.status === "Interview" || j.status === "Technical Test").length;
    const offers = jobs.filter(j => j.status === "Offer").length;
    const rejected = jobs.filter(j => j.status === "Rejected").length;
    
    const conversionRate = total > 0 ? ((interviews / total) * 100).toFixed(1) : "0";
    
    // Weekly Momentum Data (Last 7 days)
    const last7Days = eachDayOfInterval({
      start: subDays(now, 6),
      end: now
    }).map(date => {
      const count = jobs.filter(j => isSameDay(parseISO(j.date_applied), date)).length;
      return {
        name: format(date, "EEE"),
        fullDate: format(date, "MMM d"),
        count
      };
    });

    // Comparison stats
    const thisWeekStart = startOfWeek(now);
    const lastWeekStart = startOfWeek(subWeeks(now, 1));
    const lastWeekEnd = endOfWeek(subWeeks(now, 1));

    const thisWeekCount = jobs.filter(j => isAfter(parseISO(j.date_applied), thisWeekStart)).length;
    const lastWeekCount = jobs.filter(j => isWithinInterval(parseISO(j.date_applied), { start: lastWeekStart, end: lastWeekEnd })).length;
    
    const weekGrowth = thisWeekCount - lastWeekCount;

    // Stale Applications (Applied > 14 days ago, still in 'Applied' or 'Saved' status)
    const staleApplications = jobs.filter(j => {
      const daysSinceApplied = differenceInDays(now, parseISO(j.date_applied));
      return (j.status === "Applied" || j.status === "Saved") && daysSinceApplied > 14;
    }).sort((a, b) => differenceInDays(now, parseISO(a.date_applied)) - differenceInDays(now, parseISO(b.date_applied)));

    // Tech stack frequency
    const techCount: Record<string, number> = {};
    jobs.forEach(job => {
      if (job.tech_stack && Array.isArray(job.tech_stack)) {
        job.tech_stack.forEach((tech: string) => {
          techCount[tech] = (techCount[tech] || 0) + 1;
        });
      }
    });
    
    const topTech = Object.entries(techCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Funnel data
    const funnelData = [
      { name: "Applied", value: total, color: "#94a3b8" },
      { name: "Interview", value: interviews, color: "#6366f1" },
      { name: "Offer", value: offers, color: "#10b981" },
    ];

    return { 
      total, 
      interviews, 
      offers, 
      rejected, 
      conversionRate, 
      topTech, 
      funnelData, 
      last7Days,
      thisWeekCount,
      weekGrowth,
      staleApplications: staleApplications.slice(0, 5)
    };
  }, [jobs]);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-end">
          <div className="space-y-2">
            <div className="h-9 w-32 bg-white/50 rounded-lg" />
            <div className="h-5 w-64 bg-white/30 rounded" />
          </div>
          <div className="h-12 w-56 bg-white/50 rounded-2xl" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`bg-gradient-to-br from-white to-white/60 p-6 rounded-2xl border border-white/30 ${shadows.card}`}>
              <div className="h-3 w-20 bg-white/50 rounded mb-3" />
              <div className="h-10 w-16 bg-white/50 rounded" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className={`bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-white/30`}>
              <div className="h-6 w-48 bg-white/50 rounded mb-2" />
              <div className="h-4 w-32 bg-white/30 rounded mb-8" />
              <div className="h-72 bg-white/30 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={`bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-white/30`}>
                <div className="h-6 w-24 bg-white/50 rounded mb-6" />
                <div className="h-64 bg-white/30 rounded-xl" />
              </div>
              <div className={`bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-white/30`}>
                <div className="h-6 w-20 bg-white/50 rounded mb-6" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-12 bg-white/30 rounded-2xl" />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className={`bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-white/30 h-[600px]`}>
            <div className="h-6 w-32 bg-white/50 rounded mb-2" />
            <div className="h-4 w-28 bg-white/30 rounded mb-8" />
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 bg-white/30 rounded-2xl">
                  <div className="h-4 w-3/4 bg-white/50 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-white/50 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold text-neutral-700 mb-2">No applications yet</h2>
        <p className="text-neutral-500">Start adding your job applications to see statistics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Dashboard</h1>
          <p className="text-neutral-500 text-sm">Your job search momentum and performance</p>
        </div>
        <div className="px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <div>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1">Weekly Momentum</p>
            <p className="text-sm font-bold text-indigo-900 leading-none">
              {stats.thisWeekCount} applications this week
              <span className={`ml-2 inline-flex items-center ${stats.weekGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stats.weekGrowth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {Math.abs(stats.weekGrowth)}
              </span>
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className={`${glass.stat} ${shadows.card} ${transitions.default} hover:${shadows.hover} hover:-translate-y-1 relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Calendar className="w-12 h-12 text-neutral-900" />
          </div>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Total Tracking</p>
          <p className="text-4xl font-black text-neutral-900 tracking-tight">{stats.total}</p>
          <p className="text-[10px] text-neutral-500 mt-2 font-medium">Active applications</p>
        </div>
        
        <div className={`${glass.stat} ${shadows.card} ${transitions.default} hover:${shadows.hover} hover:-translate-y-1 relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Clock className="w-12 h-12 text-blue-600" />
          </div>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Interviews</p>
          <p className="text-4xl font-black text-blue-600 tracking-tight">{stats.interviews}</p>
          <p className="text-[10px] text-neutral-500 mt-2 font-medium">Stage reached</p>
        </div>

        <div className={`${glass.stat} ${shadows.card} ${transitions.default} hover:${shadows.hover} hover:-translate-y-1 relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-12 h-12 text-indigo-600" />
          </div>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Success Rate</p>
          <p className="text-4xl font-black text-indigo-600 tracking-tight">{stats.conversionRate}%</p>
          <p className="text-[10px] text-neutral-500 mt-2 font-medium">Interview conversion</p>
        </div>

        <div className={`${glass.stat} ${shadows.card} ${transitions.default} hover:${shadows.hover} hover:-translate-y-1 relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Offers</p>
          <p className="text-4xl font-black text-emerald-600 tracking-tight">{stats.offers}</p>
          <p className="text-[10px] text-neutral-500 mt-2 font-medium">Goal achieved</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className={`${glass.card} ${shadows.card} p-8 ${transitions.default} hover:${shadows.elevated}`}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Application Momentum</h3>
                <p className="text-sm text-neutral-500">Activity over the last 7 days</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50/50 rounded-full border border-indigo-100/50 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Live Tracking</span>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.last7Days}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    labelStyle={{fontWeight: 700, color: '#1e293b'}}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#6366f1" 
                    strokeWidth={4} 
                    dot={{fill: '#6366f1', strokeWidth: 2, r: 4, stroke: '#fff'}}
                    activeDot={{r: 6, strokeWidth: 0}}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={`${glass.card} ${shadows.card} p-8 ${transitions.default} hover:${shadows.elevated}`}>
              <h3 className="text-lg font-bold text-neutral-900 tracking-tight mb-6">Hiring Funnel</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#64748b'}} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                      {stats.funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`${glass.card} ${shadows.card} p-8 ${transitions.default} hover:${shadows.elevated}`}>
              <h3 className="text-lg font-bold text-neutral-900 tracking-tight mb-6">Top Skills</h3>
              <div className="grid grid-cols-1 gap-3">
                {stats.topTech.length > 0 ? (
                  stats.topTech.map(tech => (
                    <div key={tech.name} className="flex items-center justify-between p-3 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30 group hover:border-indigo-200 hover:bg-white/70 transition-all duration-300">
                      <span className="text-sm font-bold text-neutral-700">{tech.name}</span>
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50/50 backdrop-blur-sm px-2 py-1 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">{tech.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-500 text-sm italic">No skills data available yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className={`${glass.card} ${shadows.card} p-8 h-full ${transitions.default} hover:${shadows.elevated}`}>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-rose-50 rounded-xl">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Action Required</h3>
                <p className="text-xs text-neutral-500">Applications needing follow-up</p>
              </div>
            </div>

            <div className="space-y-4">
              {stats.staleApplications.length > 0 ? (
                stats.staleApplications.map(job => (
                  <div key={job.id} className="p-4 bg-white/50 backdrop-blur-sm border border-white/30 rounded-2xl shadow-sm hover:border-rose-200 hover:bg-white/70 transition-all duration-300">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-neutral-900 truncate pr-2">{job.title}</h4>
                      <span className="text-[10px] font-black text-rose-600 bg-rose-50/50 backdrop-blur-sm px-2 py-0.5 rounded-full uppercase tracking-wider">Stale</span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-3">{job.company}</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400">
                      <Clock className="w-3 h-3" />
                      Applied {differenceInDays(new Date(), parseISO(job.date_applied))} days ago
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-bold text-neutral-900 mb-1">All caught up!</p>
                  <p className="text-xs text-neutral-500">No applications need immediate follow-up.</p>
                </div>
              )}
            </div>
            
            {stats.staleApplications.length > 0 && (
              <p className="mt-6 text-[10px] text-neutral-400 text-center italic">
                Tip: Following up after 2 weeks can increase your chances by 30%.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
