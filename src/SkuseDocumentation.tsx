import React from 'react';
import { useSpec } from '@/hooks/useSpec';
import Sidebar from "@/components/layouts/Sidebar";
import { Outlet, useLocation } from "@tanstack/react-router";
import MinimifiedInfo from "@/components/layouts/MinimifiedInfo";
import LayoutSkeleton from '@/components/Skeletons/LayoutSkeleton';

interface SkuseDocumentationProps {
    openApiUrl: string;
}

export const SkuseDocumentation: React.FC<SkuseDocumentationProps> = ({ openApiUrl }) => {
    const { spec, error, loading } = useSpec({ openApiUrl });
    const location = useLocation();

    if (loading) return <LayoutSkeleton />;
    if (error) return <div>Erreur : {error.message}</div>;
    if (!spec) return null;

    const showMinimifiedInfo = location.pathname !== '/';

    return (
        <div className="h-screen flex flex-col">
            <div className="flex flex-1 overflow-hidden">
                <div className="w-80 border-r sticky top-0 h-screen overflow-y-auto">
                    <Sidebar />
                </div>
                <div className="flex-1 overflow-y-auto flex flex-col">
                    {showMinimifiedInfo && <MinimifiedInfo />}
                    <div className="p-4 flex-1">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};