import React from 'react';
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {ExternalLink, Scale, Mail, Earth} from 'lucide-react';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import Servers from "@/components/openapi/Servers";
import {useOpenAPIContext} from "@/hooks/OpenAPIContext";
import AuthCard from "@/components/openapi/Auth/AuthCard";

const Information: React.FC = () => {
    const {spec} = useOpenAPIContext();

    return (
        <Card className="w-full rounded-none border-x-0 border-t-0 md:rounded-lg md:border">
            <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-6">
                    <div>
                        <CardTitle className="text-2xl font-bold">{spec.info.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className="font-mono">
                                v{spec.info.version}
                            </Badge>
                            <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">
                                {spec.openapi || spec.swagger}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-start sm:justify-end items-center gap-x-4 gap-y-2 text-sm text-muted-foreground sm:shrink-0">
                        {spec.info.contact?.email && (
                            <a href={`mailto:${spec.info.contact.email}`}
                               className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                                <Mail className="h-4 w-4" />
                                {spec.info.contact.email}
                            </a>
                        )}
                        {spec.info.contact?.url && (
                            <a href={spec.info.contact.url} target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                                <Earth className="h-4 w-4" />
                                Website
                            </a>
                        )}
                        {spec.externalDocs && (
                            <a href={spec.externalDocs.url} target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                                <ExternalLink className="h-4 w-4" />
                                {spec.externalDocs.description || 'Docs'}
                            </a>
                        )}
                        {spec.info.license && (
                            spec.info.license.url ? (
                                <a href={spec.info.license.url} target="_blank" rel="noopener noreferrer"
                                   className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                                    <Scale className="h-4 w-4" />
                                    {spec.info.license.name}
                                </a>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <Scale className="h-4 w-4" />
                                    {spec.info.license.name}
                                </span>
                            )
                        )}
                        {spec.info.termsOfService && (
                            <a href={spec.info.termsOfService} target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                                <ExternalLink className="h-4 w-4" />
                                Terms
                            </a>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="grid lg:grid-cols-2 gap-4 mb-4">
                    <Servers servers={spec.servers ?? []} />
                    <AuthCard securitySchemes={spec.components?.securitySchemes} />
                </div>
                {spec.info.description && (
                    <FormattedMarkdown className="p-6 break-words" markdown={spec.info.description} maxLength={5000} />
                )}
            </CardContent>
        </Card>
    );
};

export default Information;
