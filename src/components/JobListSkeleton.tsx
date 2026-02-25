export default function JobListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-end">
          <div className="space-y-1">
            <div className="h-9 w-40 bg-neutral-200 rounded-lg" />
            <div className="h-5 w-72 bg-neutral-100 rounded" />
          </div>
          <div className="relative flex-1 min-w-[240px]">
            <div className="w-full h-11 bg-neutral-100 rounded-xl animate-pulse" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
          <div className="h-4 w-12 bg-neutral-200 rounded" />
          <div className="h-8 w-28 bg-neutral-100 rounded-lg animate-pulse" />
          <div className="h-8 w-24 bg-neutral-100 rounded-lg animate-pulse" />
          <div className="h-8 w-28 bg-neutral-100 rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="space-y-12">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-12 bg-neutral-200 rounded-lg" />
            <div className="h-px flex-1 bg-neutral-200" />
          </div>
          
          <div className="space-y-4">
            <div className="h-5 w-40 bg-neutral-200 rounded" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2 flex-1">
                        <div className="h-5 w-3/4 bg-neutral-100 rounded animate-pulse" />
                        <div className="h-4 w-1/2 bg-neutral-50 rounded animate-pulse" />
                      </div>
                      <div className="h-6 w-20 bg-neutral-100 rounded-full animate-pulse" />
                    </div>

                    <div className="space-y-2 mt-4">
                      <div className="h-4 w-2/3 bg-neutral-50 rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-neutral-50 rounded animate-pulse" />
                      <div className="h-4 w-1/3 bg-neutral-50 rounded animate-pulse" />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <div className="h-5 w-14 bg-neutral-50 rounded animate-pulse" />
                      <div className="h-5 w-16 bg-neutral-50 rounded animate-pulse" />
                      <div className="h-5 w-12 bg-neutral-50 rounded animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-50 flex justify-between items-center">
                    <div className="flex gap-2">
                      <div className="h-6 w-6 bg-neutral-100 rounded animate-pulse" />
                      <div className="h-6 w-6 bg-neutral-100 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-20 bg-neutral-100 rounded animate-pulse" />
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
