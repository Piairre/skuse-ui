import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export const SidebarSkeleton = () => {
    return (
        <div className="w-80 border-r h-screen">
            <div className="flex flex-col h-full">
                <div className="flex-grow py-2 px-2 space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-10 w-full rounded-lg" />
                            <div className="space-y-2 pl-4">
                                {[1, 2, 3].map((j) => (
                                    <div key={j} className="flex items-center space-x-2 p-2">
                                        <Skeleton className="h-6 w-14 rounded" />
                                        <div className="flex-1 space-y-1">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-auto border-t p-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-16" />
                        <div className="flex items-center space-x-2">
                            <Skeleton className="h-6 w-10" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};