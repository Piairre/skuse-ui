import React from 'react';
import { SidebarSkeleton } from './SidebarSkeleton';
import EndpointSkeleton from './EndpointSkeleton';
import { useLocation } from '@tanstack/react-router';
import HomeSkeleton from "@/components/Skeletons/HomeSkeleton";

const LayoutSkeleton = () => {
    const location = useLocation();
    const isHomeRoute = location.pathname === '/';

    return (
        <div className="h-screen flex flex-col">
            <div className="flex flex-1 overflow-hidden">
                <div className="w-70 border-r sticky top-0 h-screen overflow-y-auto">
                    <SidebarSkeleton />
                </div>
                <div className="flex-1 overflow-y-auto m-2">
                    {isHomeRoute ? <HomeSkeleton /> : <EndpointSkeleton />}
                </div>
            </div>
        </div>
    );
};

export default LayoutSkeleton;