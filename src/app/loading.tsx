import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="container max-w-screen-2xl px-4 md:px-8 py-6 space-y-8">
            <div className="space-y-4">
                <Skeleton className="h-12 w-[250px]" />
                <Skeleton className="h-4 w-[300px]" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col space-y-3">
                        <Skeleton className="h-[125px] w-full rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[80%]" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
