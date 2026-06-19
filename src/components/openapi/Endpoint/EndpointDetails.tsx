import React, {useState, useMemo} from 'react';
import { useParams, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EnhancedOperationObject } from "@/types/openapi";
import { getBadgeColor, findOperationByOperationIdAndTag } from "@/utils/openapi";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import { ExternalLink, Lock, Copy, Check } from 'lucide-react';
import CodeExamples from './CodeExamples';
import ResponseViewer from './ResponseViewer';
import ParametersViewer from './ParametersViewer';
import RequestBodyViewer from "@/components/openapi/Endpoint/RequestBodyViewer";
import CallbackViewer from "@/components/openapi/Endpoint/CallbackViewer";
import { useOpenAPIContext } from '@/hooks/OpenAPIContext';

interface EndpointContentProps {
    operation: EnhancedOperationObject;
}

const SectionCard: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="rounded-xl bg-muted/50 p-4 space-y-3">
        {title && <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>}
        {children}
    </div>
);

const CopyPathButton: React.FC<{ path: string }> = ({ path }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(path);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={handleCopy}
            className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Copy path"
        >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    );
};

const EndpointContent: React.FC<EndpointContentProps> = ({ operation }) => {
    const [requestValues] = useState({ parameters: {} as Record<string, string>, body: '' });
    const { parameters = [], requestBody, responses } = operation;
    const { spec } = useOpenAPIContext();

    const effectiveSecurity = operation.security !== undefined ? operation.security : (spec.security ?? []);
    const requiresAuth = effectiveSecurity.length > 0;

    const effectiveDescription = operation.description ?? operation.pathDescription;
    const effectiveSummary = operation.summary ?? operation.pathSummary;

    const hasDescription = !!(effectiveDescription || operation.deprecated || operation.externalDocs);
    const hasLeft = hasDescription || parameters.length > 0 || !!requestBody;

    return (
        <Card className="w-full rounded-none border-x-0 border-t-0 md:rounded-lg md:border">
            <div className="sticky top-0 md:top-16 z-40 bg-card flex flex-wrap items-center gap-3 px-6 py-4 border-b rounded-t-lg">
                <Badge className={`${getBadgeColor(operation.method.toLowerCase())} text-white font-mono px-3 py-1 shrink-0`}>
                    {operation.method}
                </Badge>
                <div className="min-w-0 flex-1 flex items-center gap-2">
                    <h2 className="text-base font-semibold font-mono leading-snug truncate">
                        {operation.path}
                    </h2>
                    <CopyPathButton path={operation.path} />
                </div>
                {requiresAuth && (
                    <Badge variant="outline" className="ml-auto shrink-0 gap-1.5 border-amber-400 text-amber-600 dark:text-amber-400">
                        <Lock className="h-3.5 w-3.5" />
                        Authentication Required
                    </Badge>
                )}
                {effectiveSummary && (
                    <p className="w-full text-sm text-muted-foreground -mt-1">{effectiveSummary}</p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 p-4">
                {/* Left — Description, Parameters, Request Body */}
                {hasLeft && (
                    <div className="lg:col-span-3 space-y-4">
                        {hasDescription && (
                            <section className="space-y-3 px-1">
                                {operation.deprecated && (
                                    <Alert variant="destructive">
                                        <AlertDescription>
                                            This endpoint is deprecated and might be removed in future versions.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {effectiveDescription && (
                                    <div className="prose prose-slate dark:prose-invert max-w-none">
                                        <FormattedMarkdown markdown={effectiveDescription} maxLength={1000} />
                                    </div>
                                )}
                                {operation.externalDocs && (
                                    <a
                                        href={operation.externalDocs.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-sm text-blue-500 hover:underline"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        {operation.externalDocs.description || 'External Documentation'}
                                    </a>
                                )}
                            </section>
                        )}

                        {parameters.length > 0 && (
                            <SectionCard title="Parameters">
                                <ParametersViewer parameters={parameters} />
                            </SectionCard>
                        )}

                        {requestBody && (
                            <SectionCard title="Request Body">
                                <RequestBodyViewer requestBody={requestBody} />
                            </SectionCard>
                        )}

                        {operation.callbacks && Object.keys(operation.callbacks).length > 0 && (
                            <SectionCard title="Callbacks">
                                <CallbackViewer callbacks={operation.callbacks} />
                            </SectionCard>
                        )}
                    </div>
                )}

                {/* Right — Code Examples + Responses */}
                <div className={`${hasLeft ? 'lg:col-span-2' : 'lg:col-span-5'} space-y-4`}>
                    <SectionCard>
                        <CodeExamples
                            method={operation.method}
                            path={operation.path}
                            requestBody={requestValues.body}
                            hasRequestBody={!!requestBody}
                            defaultContentType={requestBody ? Object.keys(requestBody.content)[0] : undefined}
                            security={operation.security}
                        />
                    </SectionCard>

                    <SectionCard title="Responses">
                        <ResponseViewer responses={responses} />
                    </SectionCard>
                </div>
            </div>

        </Card>
    );
};

const EndpointDetails: React.FC = () => {
    const { tag, operationId } = useParams({ from: '/$tag/$operationId' });
    const { spec, loading } = useOpenAPIContext();
    const navigate = useNavigate();

    const operation = useMemo(() => {
        if (!loading && spec) {
            return findOperationByOperationIdAndTag(spec.paths, operationId, tag);
        }
    }, [loading, spec, operationId, tag]);

    React.useEffect(() => {
        if (!loading && (!spec || !operation)) {
            navigate({ to: '/' });
        }
    }, [loading, spec, operation, navigate]);

    if (!operation) return null;

    return <EndpointContent operation={operation} />;
};

export default EndpointDetails;
