import React, {useEffect} from 'react';
import {useSpec} from '@/hooks/useSpec';
import Sidebar from "@/components/openapi/Sidebar";
import {Outlet} from "@tanstack/react-router";

interface SkuseDocumentationProps {
    openApiUrl: string;
}

export const SkuseDocumentation: React.FC<SkuseDocumentationProps> = ({openApiUrl}) => {
    const {spec, error, loading} = useSpec({openApiUrl});

    useEffect(() => {
        if (spec?.info?.title) {
            document.title = `${spec.info.title} - Skuse UI`;
        } else {
            document.title = 'API Docs - Skuse UI';
        }
    }, [spec]);

    if (loading) return <div>Chargement...</div>;
    if (error) return <div>Erreur : {error.message}</div>;
    if (!spec) return null;

    return (
        <div className="h-screen flex">
            <div className="w-70 border-r sticky top-0 h-screen overflow-y-auto">
                <Sidebar/>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                <Outlet/>
            </div>
        </div>
    );
};