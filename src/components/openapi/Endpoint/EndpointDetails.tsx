import React, {useState, useMemo} from 'react';
import { useParams, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EnhancedOperationObject } from "@/types/openapi";
import { getBadgeColor, findOperationByOperationIdAndTag, generateExample } from "@/utils/openapi";
import { SchemaObject } from "@/types/unified-openapi-types";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import { ExternalLink, Lock, Copy, Check, BookOpen, Play, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import CodeExamples from './CodeExamples';
import ResponseViewer from './ResponseViewer';
import ParametersViewer from './ParametersViewer';
import RequestBodyViewer from "@/components/openapi/Endpoint/RequestBodyViewer";
import CallbackViewer from "@/components/openapi/Endpoint/CallbackViewer";
import PlaygroundForm from './PlaygroundForm';
import PlaygroundResponse from './PlaygroundResponse';
import { usePlayground } from '@/hooks/usePlayground';
import { useOpenAPIContext } from '@/hooks/OpenAPIContext';

interface EndpointContentProps {
    operation: EnhancedOperationObject;
}

const SectionCard: React.FC<{ title?: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, action, children }) => (
    <div className="rounded-xl bg-muted/50 p-4 space-y-3">
        {(title || action) && (
            <div className="flex items-center justify-between">
                {title && <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>}
                {action}
            </div>
        )}
        {children}
    </div>
);

const CopyCurlButton: React.FC<{ curlCommand: string }> = ({ curlCommand }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(curlCommand);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Terminal className="h-3 w-3" />}
            {copied ? 'Copied!' : 'Copy cURL'}
        </button>
    );
};

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
    const [mode, setMode] = useState<'reference' | 'playground'>(() =>
        new URLSearchParams(window.location.search).get('mode') === 'try' ? 'playground' : 'reference'
    );

    const syncUrl = (currentMode: 'reference' | 'playground') => {
        const url = new URL(window.location.href);
        if (currentMode === 'playground') url.searchParams.set('mode', 'try');
        else url.searchParams.delete('mode');
        window.history.replaceState({}, '', url.toString());
    };

    const handleModeChange = (newMode: 'reference' | 'playground') => {
        setMode(newMode);
        syncUrl(newMode);
    };

    React.useEffect(() => {
        syncUrl(mode);
    }, [operation.path, operation.method]); // eslint-disable-line react-hooks/exhaustive-deps
    const { parameters = [], requestBody, responses } = operation;
    const { spec } = useOpenAPIContext();

    const exampleBody = useMemo(() => {
        if (!requestBody) return '';
        const contentType = Object.keys(requestBody.content)[0];
        const schema = contentType ? requestBody.content[contentType]?.schema : undefined;
        if (!schema) return '';
        return JSON.stringify(generateExample(schema as SchemaObject), null, 2);
    }, [requestBody]);

    const examplePath = useMemo(() => {
        let p = operation.path;
        for (const param of parameters) {
            if (param.in === 'path' && param.schema) {
                const val = generateExample(param.schema as SchemaObject);
                p = p.replace(`{${param.name}}`, String(val ?? param.name));
            }
        }
        return p;
    }, [operation.path, parameters]);

    const exampleQueryParams = useMemo(() => {
        const qp: Record<string, string> = {};
        for (const param of parameters) {
            if (param.in === 'query' && param.schema) {
                const def = (param.schema as SchemaObject).default;
                if (def !== null && def !== undefined) qp[param.name] = String(def);
            }
        }
        return qp;
    }, [parameters]);

    const exampleHeaderParams = useMemo(() => {
        const headers: Array<{ key: string; value: string }> = [];
        for (const param of parameters) {
            if (param.in === 'header' && param.schema) {
                const val = generateExample(param.schema as SchemaObject);
                if (val !== null && val !== undefined) headers.push({ key: param.name, value: String(val) });
            }
        }
        return headers;
    }, [parameters]);

    const effectiveSecurity = operation.security !== undefined ? operation.security : (spec.security ?? []);
    const requiresAuth = effectiveSecurity.length > 0;

    const playground = usePlayground({
        method: operation.method,
        path: operation.path,
        parameters,
        security: effectiveSecurity as Record<string, string[]>[],
        requestBody,
    });

    const effectiveDescription = operation.description ?? operation.pathDescription;
    const effectiveSummary = operation.summary || operation.pathSummary;

    const hasDescription = !!(effectiveDescription || operation.deprecated || operation.externalDocs);
    const hasParams = parameters.length > 0 || !!requestBody || !!(operation.callbacks && Object.keys(operation.callbacks).length > 0);
    const hasLeft = hasDescription || hasParams;
    const onlyDescription = hasDescription && !hasParams;

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
                {!requiresAuth && (
                    <div className="ml-auto flex rounded-md border overflow-hidden text-xs shrink-0">
                        <button
                            onClick={() => handleModeChange('reference')}
                            className={cn('w-28 flex items-center justify-center gap-1.5 py-1.5 transition-colors', mode === 'reference' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                        >
                            <BookOpen className="h-3.5 w-3.5" />
                            Reference
                        </button>
                        <button
                            onClick={() => handleModeChange('playground')}
                            className={cn('w-28 flex items-center justify-center gap-1.5 py-1.5 transition-colors border-l', mode === 'playground' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                        >
                            <Play className="h-3.5 w-3.5" />
                            Try it
                        </button>
                    </div>
                )}
                {(effectiveSummary || requiresAuth) && (
                    <div className="w-full flex items-center justify-between gap-3 -mt-1">
                        {effectiveSummary
                            ? <p className="text-sm text-muted-foreground">{effectiveSummary}</p>
                            : <span />}
                        {requiresAuth && (
                            <div className="flex rounded-md border overflow-hidden text-xs shrink-0">
                                <button
                                    onClick={() => handleModeChange('reference')}
                                    className={cn('w-28 flex items-center justify-center gap-1.5 py-1.5 transition-colors', mode === 'reference' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                                >
                                    <BookOpen className="h-3.5 w-3.5" />
                                    Reference
                                </button>
                                <button
                                    onClick={() => handleModeChange('playground')}
                                    className={cn('w-28 flex items-center justify-center gap-1.5 py-1.5 transition-colors border-l', mode === 'playground' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                                >
                                    <Play className="h-3.5 w-3.5" />
                                    Try it
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {mode === 'playground' ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 p-4">
                    <div className="lg:col-span-3 space-y-4">
                        <div className="rounded-xl bg-muted/50 p-4">
                            <PlaygroundForm
                                parameters={parameters}
                                requestBody={requestBody}
                                pathValues={playground.pathValues}
                                setPathValues={playground.setPathValues}
                                queryValues={playground.queryValues}
                                setQueryValues={playground.setQueryValues}
                                headerValues={playground.headerValues}
                                setHeaderValues={playground.setHeaderValues}
                                body={playground.body}
                                setBody={playground.setBody}
                                contentType={playground.contentType}
                                setContentType={playground.setContentType}
                                contentTypes={playground.contentTypes}
                                validationErrors={playground.validationErrors}
                                enabledParams={playground.enabledParams}
                                setParamEnabled={playground.setParamEnabled}
                            />
                        </div>
                        <SectionCard title="Expected Responses">
                            <ResponseViewer responses={responses} />
                        </SectionCard>
                    </div>
                    <div className="lg:col-span-2">
                        <SectionCard title="Response" action={<CopyCurlButton curlCommand={playground.curlCommand} />}>
                            <PlaygroundResponse
                                result={playground.result}
                                loading={playground.loading}
                                error={playground.error}
                                previewUrl={playground.previewUrl}
                                method={operation.method}
                                expectedStatusCodes={Object.keys(responses ?? {})}
                                onSend={playground.send}
                            />
                        </SectionCard>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 p-4">
                    {/* Left — Description, Parameters, Request Body */}
                    {hasLeft && (
                        <div className={`${onlyDescription ? 'lg:col-span-5' : 'lg:col-span-3'} space-y-4`}>
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
                    <div className={`${!hasLeft || onlyDescription ? 'lg:col-span-5' : 'lg:col-span-2'} space-y-4`}>
                        <SectionCard>
                            <CodeExamples
                                method={operation.method}
                                path={examplePath}
                                requestBody={exampleBody}
                                hasRequestBody={!!requestBody}
                                defaultContentType={requestBody ? Object.keys(requestBody.content)[0] : undefined}
                                security={operation.security}
                                exampleQueryParams={exampleQueryParams}
                                exampleHeaderParams={exampleHeaderParams}
                            />
                        </SectionCard>

                        <SectionCard title="Responses">
                            <ResponseViewer responses={responses} />
                        </SectionCard>
                    </div>
                </div>
            )}

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
