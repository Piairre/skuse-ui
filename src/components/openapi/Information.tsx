import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Scale, Mail, Earth, ServerIcon, ShieldCheck } from 'lucide-react';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import Servers from "@/components/openapi/Servers";
import { useOpenAPIContext } from "@/hooks/OpenAPIContext";
import AuthCard from "@/components/openapi/Auth/AuthCard";
import TagsOverview from "@/components/openapi/TagsOverview";

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="rounded-xl bg-muted/50 p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            {icon}
            {title}
        </h3>
        {children}
    </div>
);

const Information: React.FC = () => {
    const { spec } = useOpenAPIContext();

    return (
        <Card className="w-full rounded-none border-x-0 border-t-0 md:rounded-lg md:border">
            {/* Header */}
            <div className="px-6 py-5 border-b">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-6">
                    <div>
                        <h1 className="text-2xl font-bold">{spec.info.title}</h1>
                        {spec.info.summary && (
                            <p className="text-sm text-muted-foreground mt-1">{spec.info.summary}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className="font-mono">v{spec.info.version}</Badge>
                            <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">
                                {spec.openapi || spec.swagger}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-start sm:justify-end items-center gap-x-4 gap-y-2 text-sm text-muted-foreground sm:shrink-0">
                        {spec.info.contact?.name && (
                            <span className="flex items-center gap-1.5">
                                <Mail className="h-4 w-4" />
                                {spec.info.contact.name}
                            </span>
                        )}
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
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                <div className="grid lg:grid-cols-2 gap-4">
                    <SectionCard title={spec.servers && spec.servers.length > 0 ? 'Servers' : 'Default Server'} icon={<ServerIcon className="h-3.5 w-3.5" />}>
                        <Servers servers={spec.servers ?? []} />
                    </SectionCard>
                    <SectionCard title="Authentication" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
                        <AuthCard securitySchemes={spec.components?.securitySchemes} />
                    </SectionCard>
                </div>

                {spec.info.description && (
                    <div className="rounded-xl bg-muted/50 p-4">
                        <FormattedMarkdown className="break-words" markdown={spec.info.description} maxLength={5000} />
                    </div>
                )}

                <TagsOverview />
            </div>
        </Card>
    );
};

export default Information;
