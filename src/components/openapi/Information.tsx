import React from 'react';
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {
    ExternalLink,
    Scale,
    Mail,
    Earth
} from 'lucide-react';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import Servers from "@/components/openapi/Servers";
import {useOpenAPIContext} from "@/hooks/OpenAPIContext";
import AuthCard from "@/components/openapi/Auth/AuthCard";

const Information: React.FC = () => {
    const {spec} = useOpenAPIContext();

    return (
        <Card className="w-full mx-auto">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="flex">
                        <Badge variant="outline"
                               className="border-black dark:border-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black flex justify-center items-center px-3 py-1 me-2">
                            API: {spec.info.version}
                        </Badge>
                        <Badge variant="outline"
                               className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white flex justify-center items-center px-3 py-1 me-2">
                            OAS: {spec?.openapi || spec?.swagger}
                        </Badge>
                    </div>

                    <div>
                        <div className="flex justify-end">
                            {spec.info.contact?.email && (
                                <Badge variant="secondary" className="flex justify-center items-center px-3 py-1 me-2">
                                    <a href={`mailto:${spec.info.contact.email}`}
                                       className="flex items-center hover:underline">
                                        <Mail className="w-4 h-4 me-2 text-primary"/>
                                        {spec.info.contact.email}
                                    </a>
                                </Badge>
                            )}

                            {spec.info.contact?.url && (
                                <Badge variant="secondary" className="flex justify-center items-center px-3 py-1 me-2">
                                    <a href={spec.info.contact.url} target="_blank" rel="noopener noreferrer"
                                       className="flex items-center hover:underline">
                                        <Earth className="w-4 h-4 me-2 text-primary"/>
                                        {spec.info.contact.url}
                                    </a>
                                </Badge>
                            )}

                            {spec?.externalDocs && (
                                <Badge variant="secondary" className="flex justify-center items-center px-3 py-1 me-2">
                                    <a href={spec.externalDocs.url} target="_blank" rel="noopener noreferrer"
                                       className="flex items-center hover:underline">
                                        <ExternalLink className="w-4 h-4 me-2 text-primary"/>
                                        {spec.externalDocs.description || 'Documentation'}
                                    </a>
                                </Badge>
                            )}
                        </div>

                        <div className="flex justify-end">
                            {spec.info.license && (
                                <Badge variant="secondary"
                                       className="flex justify-center items-center px-3 py-1 me-2 mt-1">
                                    <a href={spec.info.license.url} target="_blank" rel="noopener noreferrer"
                                       className="flex items-center hover:underline">
                                        <Scale className="w-4 h-4 me-2 text-primary"/>
                                        {spec.info.license.name}
                                    </a>
                                </Badge>
                            )}

                            {spec.info.termsOfService && (
                                <Badge variant="secondary"
                                       className="flex justify-center items-center px-3 py-1 me-2 mt-1">
                                    <a href={spec.info.termsOfService} target="_blank" rel="noopener noreferrer"
                                       className="flex items-center hover:underline">
                                        <ExternalLink className="w-4 h-4 me-2 text-primary"/>
                                        Terms of Service
                                    </a>
                                </Badge>
                            )}
                        </div>

                    </div>
                </div>

                <CardTitle className="text-2xl font-bold">
                    {spec.info.title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid lg:grid-cols-2 gap-2 mb-2">
                    <Servers servers={spec.servers ?? []}/>
                    <AuthCard securitySchemes={spec.components?.securitySchemes}/>
                </div>

                {spec.info.description && (
                    <FormattedMarkdown className={"p-6"} style={{wordBreak: 'break-word'}} markdown={spec.info.description} maxLength={5000}/>
                )}
            </CardContent>
        </Card>
    );
};

export default Information;
