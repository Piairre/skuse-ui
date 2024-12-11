import React from 'react';
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {
    ExternalLink,
    Scale,
    Mail,
    Earth
} from 'lucide-react';
import {OpenAPIV3} from "openapi-types";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import Servers from "@/components/openapi/Servers";
import Auth from "@/components/openapi/Auth/AuthButton";

interface OpenAPIHeaderProps {
    document: OpenAPIV3.Document;
}

const Header: React.FC<OpenAPIHeaderProps> = ({document}) => {
    // Provide default values and handle potential undefined cases
    const info = document?.info ?? {
        title: 'API Documentation',
        version: '1.0.0',
        description: '',
        contact: undefined,
        license: undefined,
        termsOfService: undefined
    };

    return (
        <Card className="w-full mx-auto">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="flex">
                        <Badge variant="outline"
                               className="border-black text-black hover:bg-black hover:text-white flex justify-center items-center px-3 py-1 me-2">
                            API: {info.version}
                        </Badge>
                        <Badge variant="outline"
                               className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white flex justify-center items-center px-3 py-1 me-2">
                            OAS: {document.openapi}
                        </Badge>
                    </div>

                    <div className="flex">
                        {info.contact?.email && (
                            <Badge variant="secondary" className="flex justify-center items-center px-3 py-1 me-2">
                                <a href={`mailto:${info.contact.email}`}
                                   className="flex items-center hover:underline">
                                    <Mail className="w-4 h-4 me-2 text-primary"/>
                                    {info.contact.email}
                                </a>
                            </Badge>
                        )}

                        {info.contact?.url && (
                            <Badge variant="secondary" className="flex justify-center items-center px-3 py-1 me-2">
                                <a href={info.contact.url} target="_blank" rel="noopener noreferrer"
                                   className="flex items-center hover:underline">
                                    <Earth className="w-4 h-4 me-2 text-primary"/>
                                    {info.contact.url}
                                </a>
                            </Badge>
                        )}

                        {info.license && (
                            <Badge variant="secondary" className="flex justify-center items-center px-3 py-1 me-2">
                                <a href={info.license.url} target="_blank" rel="noopener noreferrer"
                                   className="flex items-center hover:underline">
                                    <Scale className="w-4 h-4 me-2 text-primary"/>
                                    {info.license.name}
                                </a>
                            </Badge>
                        )}

                        {info.termsOfService && (
                            <Badge variant="secondary" className="flex justify-center items-center px-3 py-1 me-2">
                                <a href={info.termsOfService} target="_blank" rel="noopener noreferrer"
                                   className="flex items-center hover:underline">
                                    <ExternalLink className="w-4 h-4 me-2 text-primary"/>
                                    Terms of Service
                                </a>
                            </Badge>
                        )}

                        {document.externalDocs && (
                            <Badge variant="secondary" className="flex justify-center items-center px-3 py-1 me-2">
                                <a href={document.externalDocs.url} target="_blank" rel="noopener noreferrer"
                                   className="flex items-center hover:underline">
                                    <ExternalLink className="w-4 h-4 me-2 text-primary"/>
                                    {document.externalDocs.description || 'Documentation'}
                                </a>
                            </Badge>
                        )}
                    </div>
                </div>

                <CardTitle className="text-2xl font-bold">
                    {info.title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid lg:grid-cols-2 gap-2">
                    <Servers servers={document.servers ?? []}/>
                    <Auth securitySchemes={document.components?.securitySchemes ?? null}/>
                </div>

                {info.description && (
                    <FormattedMarkdown markdown={info.description}/>
                )}
            </CardContent>
        </Card>
    );
};

export default Header;
