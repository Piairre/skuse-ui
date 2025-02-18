import React from 'react';
import { useSpec } from '@/hooks/useSpec';
import Sidebar from "@/components/layouts/Sidebar";
import {Outlet, useLocation} from "@tanstack/react-router";
import MinimifiedInfo from "@/components/layouts/MinimifiedInfo";

interface SkuseDocumentationProps {
    openApiUrl: string;
}

export const SkuseDocumentation: React.FC<SkuseDocumentationProps> = ({ openApiUrl }) => {
    const { spec, error, loading } = useSpec({ openApiUrl });
    const location = useLocation();

    if (loading) return <div>Chargement...</div>;
    if (error) return <div>Erreur : {error.message}</div>;
    if (!spec) return null;

    const showMinimifiedInfo = location.pathname !== '/';

    return (
        <div className="h-screen flex flex-col">
            <div className="flex flex-1 overflow-hidden">
                <div className="w-70 border-r sticky top-0 h-screen overflow-y-auto">
                    <Sidebar />
                </div>
                <div className="flex-1 overflow-y-auto m-2">
                    {showMinimifiedInfo && <MinimifiedInfo />}
                    <Outlet />
                </div>
            </div>
        </div>
    );
};