import React from 'react';
import { SidebarSkeleton } from './SidebarSkeleton';
import EndpointSkeleton from './EndpointSkeleton';
import { useLocation } from '@tanstack/react-router';
import HomeSkeleton from "@/components/Skeletons/HomeSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

const LayoutSkeleton = () => {
    const location = useLocation();
    const isHomeRoute = location.pathname === '/';

    return (
        <div className="h-screen flex flex-col">
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar — desktop only */}
                <div className="hidden md:block md:w-80 border-r sticky top-0 h-screen overflow-y-auto">
                    <SidebarSkeleton />
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col min-w-0">
                    {/* Navbar skeleton */}
                    {isHomeRoute ? (
                        <div className="md:hidden bg-muted/60 shadow-sm px-4 py-2 flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
                            <Skeleton className="h-4 w-36" />
                        </div>
                    ) : (
                        <div className="bg-muted/60 shadow-sm px-4 py-2 flex flex-col md:flex-row md:h-16 md:items-center gap-2 md:gap-3">
                            <div className="flex items-center gap-2 shrink-0">
                                <Skeleton className="md:hidden h-8 w-8 rounded-md" />
                                <Skeleton className="h-8 w-8 rounded-md" />
                                <Skeleton className="h-4 w-36" />
                            </div>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Skeleton className="h-10 flex-1" />
                                <Skeleton className="h-10 w-24 shrink-0" />
                            </div>
                        </div>
                    )}

                    <div className="p-0 md:p-4 flex-1">
                        {isHomeRoute ? <HomeSkeleton /> : <EndpointSkeleton />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LayoutSkeleton;
