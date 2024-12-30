import React from 'react';
import {useSpec} from '@/hooks/useSpec';
import Sidebar from "@/components/openapi/Sidebar";
import {Outlet} from "@tanstack/react-router";

interface SkuseDocumentationProps {
    openApiUrl: string;
}

export const SkuseDocumentation: React.FC<SkuseDocumentationProps> = ({ openApiUrl }) => {

    const { spec, error, loading } = useSpec({ openApiUrl });

    if (loading) return <div>Chargement...</div>;
    if (error) return <div>Erreur : {error.message}</div>;
    if (!spec) return null;

    return (
        <div className="h-screen bg-gray-50 flex">
            <div className="w-70 bg-white border-r sticky top-0 h-screen overflow-y-auto">
                <Sidebar />
            </div>
            <div className="flex-1 overflow-y-auto m-2">
                <div className="sticky top-0 bg-white">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}