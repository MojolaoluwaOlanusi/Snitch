import { Skeleton } from './ui/skeleton';

export function PostSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden p-4">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-20 w-full mb-3" />
      <Skeleton className="h-64 w-full rounded-lg mb-3" />
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

export function StorySkeleton() {
  return (
    <div className="flex-shrink-0 w-28">
      <Skeleton className="w-28 h-40 rounded-xl" />
    </div>
  );
}

export function WarpSkeleton() {
  return (
    <div className="aspect-[9/16] rounded-xl overflow-hidden">
      <Skeleton className="w-full h-full" />
    </div>
  );
}

export function GroupSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Skeleton className="h-32 w-full" />
      <div className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function MarketplaceSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Skeleton className="h-56 w-full" />
      <div className="p-4">
        <Skeleton className="h-8 w-24 mb-2" />
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex-1 border-r border-border">
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10 p-4">
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-48 w-full" />
      <div className="px-4 pb-4">
        <Skeleton className="w-32 h-32 rounded-full -mt-16 mb-4 border-4 border-background" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-20 w-full mb-4" />
        <div className="flex gap-4 mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <StorySkeleton key={i} />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}
