import { Skeleton } from '@/components/ui/skeleton';

export default function LessonDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      <Skeleton className="h-12 w-3/4 mb-4" />
      <div className="mt-8 space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <br />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <br />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="my-12 flex justify-center">
        <Skeleton className="h-12 w-48 rounded-md" />
      </div>
    </div>
  );
}
