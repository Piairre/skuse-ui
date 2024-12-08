import React from 'react';
import {useSwaggerClient} from '@/hooks/useClient';
import {groupEndpointsByTags} from '@/utils/openapi';
import Header from "@/components/openapi/Header";
import Sidebar from "@/components/openapi/Sidebar";
import Auth from "@/components/openapi/Auth/AuthButton";
import Servers from "@/components/openapi/Servers";

interface SkuseDocumentationProps {
    openApiUrl: string;
}

export const SkuseDocumentation: React.FC<SkuseDocumentationProps> = ({ openApiUrl }) => {
    const {spec, error, isLoading} = useSwaggerClient({openApiUrl: openApiUrl});

    if (isLoading) return <div>Chargement...</div>;
    if (error) return <div>Erreur : {error.message}</div>;
    if (!spec) return null;

    const groupedEndpoints = groupEndpointsByTags(spec.paths);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <div className="w-70 bg-white border-r">
                <Sidebar groupedEndpointsByTag={groupedEndpoints}/>
            </div>
            <div className="flex-1 m-2">
                <Header document={spec}/>
                <div className="grid lg:grid-cols-2 gap-2 mt-2">
                    <Servers servers={spec.servers}/>
                    <Auth securitySchemes={spec.components.securitySchemes}/>
                </div>
            </div>
        </div>
    );
}