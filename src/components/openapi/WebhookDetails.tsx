import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Webhook, Copy, Check } from 'lucide-react';
import { getBadgeColor, findWebhookOperation, generateExample } from '@/utils/openapi';
import { useOpenAPIContext } from '@/hooks/OpenAPIContext';
import { EnhancedOperationObject } from '@/types/openapi';
import { SchemaObject, RequestBodyObject } from '@/types/unified-openapi-types';
import FormattedMarkdown from '@/components/openapi/FormattedMarkdown';
import ExternalDocsLink from '@/components/openapi/Endpoint/ExternalDocsLink';
import ParametersViewer from '@/components/openapi/Endpoint/ParametersViewer';
import RequestBodyViewer from '@/components/openapi/Endpoint/RequestBodyViewer';
import ResponseViewer from '@/components/openapi/Endpoint/ResponseViewer';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const SectionCard: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="rounded-xl bg-muted/50 p-4 space-y-3">
        {title && <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>}
        {children}
    </div>
);

const CopyNameButton: React.FC<{ name: string }> = ({ name }) => {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(name); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Copy webhook name"
        >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    );
};

const WebhookPayloadPreview: React.FC<{ requestBody: RequestBodyObject }> = ({ requestBody }) => {
    const contentTypes = Object.keys(requestBody.content);
    const [activeContentType, setActiveContentType] = useState(contentTypes[0] ?? '');
    const content = requestBody.content[activeContentType];
    const schema = content?.schema as SchemaObject | undefined;

    const example = content?.examples
        ? Object.values(content.examples)[0]?.value
        : content?.example ?? schema?.example ?? generateExample(schema);

    const lang = activeContentType?.includes('json') ? 'json'
        : activeContentType?.includes('xml') ? 'xml'
        : activeContentType?.includes('yaml') ? 'yaml'
        : 'json';

    return (
        <div className="space-y-2">
            {contentTypes.length > 1 ? (
                <Select value={activeContentType} onValueChange={setActiveContentType}>
                    <SelectTrigger className="w-48 h-7 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {contentTypes.map(ct => (
                            <SelectItem key={ct} value={ct} className="text-xs">{ct}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : (
                activeContentType && <Badge variant="outline" className="text-xs font-mono">{activeContentType}</Badge>
            )}
            <FormattedMarkdown
                markdown={typeof example === 'string' ? example : JSON.stringify(example, null, 2)}
                languageCode={lang}
                className="[&_code]:!whitespace-pre-wrap"
            />
        </div>
    );
};

const WebhookContent: React.FC<{ operation: EnhancedOperationObject; webhookName: string }> = ({ operation, webhookName }) => {
    const { parameters = [], requestBody, responses } = operation;
    const hasDescription = !!(operation.description || operation.deprecated || operation.externalDocs);

    // Two-column layout only makes sense when there's a payload to preview on the right
    const hasTwoColumns = !!requestBody;

    return (
        <Card className="w-full rounded-none border-x-0 border-t-0 md:rounded-lg md:border">
            <div className="sticky top-0 md:top-16 z-40 bg-card flex flex-wrap items-center gap-3 px-6 py-4 border-b rounded-t-lg">
                <Badge className={`${getBadgeColor(operation.method.toLowerCase())} text-white font-mono px-3 py-1 shrink-0`}>
                    {operation.method}
                </Badge>
                <div className="min-w-0 flex-1 flex items-center gap-2">
                    <h2 className="text-base font-semibold font-mono leading-snug truncate">{webhookName}</h2>
                    <CopyNameButton name={webhookName} />
                </div>
                <div className="ml-auto flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="gap-1.5 border-violet-400 text-violet-600 dark:text-violet-400 font-mono">
                        <Webhook className="h-3.5 w-3.5" />
                        webhook
                    </Badge>
                </div>
                {operation.summary && (
                    <p className="w-full text-sm text-muted-foreground -mt-1">{operation.summary}</p>
                )}
            </div>

            {hasTwoColumns ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 p-4">
                    <div className="lg:col-span-3 space-y-4">
                        {hasDescription && (
                            <div className="prose dark:prose-invert max-w-none text-sm">
                                {operation.deprecated && (
                                    <Badge variant="outline" className="mb-2 border-orange-400 text-orange-500">Deprecated</Badge>
                                )}
                                {operation.description && <FormattedMarkdown markdown={operation.description} />}
                                {operation.externalDocs && <ExternalDocsLink url={operation.externalDocs.url} />}
                            </div>
                        )}
                        {parameters.length > 0 && (
                            <SectionCard title="Parameters">
                                <ParametersViewer parameters={parameters} />
                            </SectionCard>
                        )}
                        <SectionCard title="Schema">
                            <RequestBodyViewer requestBody={requestBody} hideExample />
                        </SectionCard>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        <SectionCard title="Incoming payload">
                            <WebhookPayloadPreview requestBody={requestBody} />
                        </SectionCard>
                        <SectionCard title="Responses">
                            <ResponseViewer responses={responses} />
                        </SectionCard>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 p-4">
                    {hasDescription && (
                        <div className="prose dark:prose-invert max-w-none text-sm">
                            {operation.deprecated && (
                                <Badge variant="outline" className="mb-2 border-orange-400 text-orange-500">Deprecated</Badge>
                            )}
                            {operation.description && <FormattedMarkdown markdown={operation.description} />}
                            {operation.externalDocs && <ExternalDocsLink url={operation.externalDocs.url} />}
                        </div>
                    )}
                    {parameters.length > 0 && (
                        <SectionCard title="Parameters">
                            <ParametersViewer parameters={parameters} />
                        </SectionCard>
                    )}
                    <SectionCard title="Responses">
                        <ResponseViewer responses={responses} />
                    </SectionCard>
                </div>
            )}
        </Card>
    );
};

const WebhookDetails: React.FC = () => {
    const { webhookName, operationId } = useParams({ from: '/webhooks/$webhookName/$operationId' });
    const { spec, loading } = useOpenAPIContext();
    const navigate = useNavigate();

    const operation = useMemo(() => {
        if (!loading && spec?.webhooks) {
            return findWebhookOperation(spec.webhooks, webhookName, operationId);
        }
    }, [loading, spec, webhookName, operationId]);

    React.useEffect(() => {
        if (!loading && !operation) navigate({ to: '/' });
    }, [loading, operation, navigate]);

    if (!operation) return null;

    return <WebhookContent operation={operation} webhookName={webhookName} />;
};

export default WebhookDetails;
