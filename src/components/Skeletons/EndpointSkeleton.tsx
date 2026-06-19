import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const EndpointSkeleton = () => {
    return (
        <Card className="w-full rounded-none border-x-0 border-t-0 md:rounded-lg md:border">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b">
                <Skeleton className="h-8 w-20 rounded-md shrink-0" />
                <div className="flex-1 min-w-0 space-y-1">
                    <Skeleton className="h-5 w-64 max-w-full" />
                    <Skeleton className="h-4 w-40 max-w-full" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-y-8 lg:gap-y-0 p-4">
                {/* Left — description + params */}
                <div className="lg:col-span-3 lg:pr-6 space-y-8">
                    <section className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-11/12" />
                        <Skeleton className="h-4 w-3/4" />
                    </section>

                    <section className="space-y-3 pt-8 border-t border-border">
                        <Skeleton className="h-3 w-20" />
                        <div className="border rounded-lg border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-3 p-3">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-12 rounded-full" />
                                    <Skeleton className="h-4 w-16 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right — code examples + responses */}
                <div className="lg:col-span-2 lg:border-l lg:border-border lg:pl-6 space-y-8">
                    <section className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-9 w-32" />
                        </div>
                        <div className="space-y-2 bg-muted rounded-lg p-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} className="h-4 w-full" />
                            ))}
                        </div>
                    </section>

                    <section className="space-y-3 pt-8 border-t border-border">
                        <Skeleton className="h-3 w-20" />
                        <div className="flex gap-2">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-8 flex-1 rounded-md" />
                            ))}
                        </div>
                        <div className="space-y-2 mt-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    </section>
                </div>
            </div>
        </Card>
    );
};

export default EndpointSkeleton;
