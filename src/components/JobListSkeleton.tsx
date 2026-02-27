export default function JobListSkeleton() {
  return (
    <div className="space-y-6">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-end">
          <div className="space-y-1">
            <div className="h-9 w-40 bg-white/50 backdrop-blur-sm rounded-lg shimmer" />
            <div className="h-5 w-72 bg-white/30 backdrop-blur-sm rounded shimmer" />
          </div>
          <div className="relative flex-1 min-w-[240px]">
            <div className="w-full h-11 bg-white/50 backdrop-blur-sm rounded-xl shimmer" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30">
          <div className="h-4 w-12 bg-white/50 backdrop-blur-sm rounded shimmer" />
          <div className="h-8 w-28 bg-white/50 backdrop-blur-sm rounded-lg shimmer" />
          <div className="h-8 w-24 bg-white/50 backdrop-blur-sm rounded-lg shimmer" />
          <div className="h-8 w-28 bg-white/50 backdrop-blur-sm rounded-lg shimmer" />
        </div>
      </div>

      <div className="space-y-12">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-12 bg-white/50 backdrop-blur-sm rounded-lg shimmer" />
            <div className="h-px flex-1 bg-white/30 backdrop-blur-sm" />
          </div>
          
          <div className="space-y-4">
            <div className="h-5 w-40 bg-white/50 backdrop-blur-sm rounded shimmer" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] overflow-hidden">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2 flex-1">
                        <div className="h-5 w-3/4 bg-white/50 backdrop-blur-sm rounded shimmer" />
                        <div className="h-4 w-1/2 bg-white/30 backdrop-blur-sm rounded shimmer" />
                      </div>
                      <div className="h-6 w-20 bg-white/50 backdrop-blur-sm rounded-full shimmer" />
                    </div>

                    <div className="space-y-2 mt-4">
                      <div className="h-4 w-2/3 bg-white/30 backdrop-blur-sm rounded shimmer" />
                      <div className="h-4 w-1/2 bg-white/30 backdrop-blur-sm rounded shimmer" />
                      <div className="h-4 w-1/3 bg-white/30 backdrop-blur-sm rounded shimmer" />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <div className="h-5 w-14 bg-white/50 backdrop-blur-sm rounded shimmer" />
                      <div className="h-5 w-16 bg-white/50 backdrop-blur-sm rounded shimmer" />
                      <div className="h-5 w-12 bg-white/50 backdrop-blur-sm rounded shimmer" />
                    </div>
                  </div>
                  
                  <div className="px-5 py-3 bg-white/40 backdrop-blur-sm border-t border-white/30 flex justify-between items-center">
                    <div className="flex gap-2">
                      <div className="h-6 w-6 bg-white/50 backdrop-blur-sm rounded shimmer" />
                      <div className="h-6 w-6 bg-white/50 backdrop-blur-sm rounded shimmer" />
                    </div>
                    <div className="h-4 w-20 bg-white/50 backdrop-blur-sm rounded shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
