import React, {useState, useEffect, useMemo} from 'react';
import { useParams, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EnhancedOperationObject } from "@/types/openapi";
import { getBadgeColor, findOperationByOperationIdAndTag } from "@/utils/openapi";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import { SlidersHorizontal, FileJson, ArrowDownToLine, Info, Lock, ExternalLink } from 'lucide-react';
import CodeExamples from './CodeExamples';
import ResponseViewer from './ResponseViewer';
import ParametersViewer from './ParametersViewer';
import RequestBodyViewer from "@/components/openapi/Endpoint/RequestBodyViewer";
import { useOpenAPIContext } from '@/hooks/OpenAPIContext';

interface EndpointContentProps {
    operation: EnhancedOperationObject;
}

interface RequestValues {
    parameters: Record<string, string>;
    body: string;
}

const EndpointContent: React.FC<EndpointContentProps> = ({ operation }) => {
    const [activeTab, setActiveTab] = useState<string>('info');
    const [requestValues] = useState<RequestValues>({ parameters: {}, body: '' });

    const { parameters = [], requestBody, responses } = operation;

    const availableTabs = useMemo(() => {
        const tabs = ['info'];
        if (parameters.length > 0) tabs.push('parameters');
        if (requestBody) tabs.push('body');
        tabs.push('responses');
        return tabs;
    }, [parameters.length, requestBody]);

    useEffect(() => {
        if (!availableTabs.includes(activeTab)) {
            setActiveTab(availableTabs[0] || 'info');
        }
    }, [operation.operationId, availableTabs, activeTab]);

    return (
        <Card className="w-full">
            <div className="flex items-center gap-4 px-6 py-4 border-b">
                <Badge className={`${getBadgeColor(operation.method.toLowerCase())} text-white font-mono px-3 py-1 shrink-0`}>
                    {operation.method}
                </Badge>
                <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold font-mono leading-snug truncate">
                        {operation.path}
                    </h2>
                    {operation.summary && (
                        <p className="text-sm text-muted-foreground mt-0.5">{operation.summary}</p>
                    )}
                </div>
                {operation.security && (
                    <Badge variant="outline" className="shrink-0 gap-1.5 border-amber-400 text-amber-600 dark:text-amber-400">
                        <Lock className="h-3.5 w-3.5" />
                        Authentication Required
                    </Badge>
                )}
            </div>

            <div className="grid grid-cols-5 gap-6 p-4">
                <div className="col-span-3">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="w-full">
                            <TabsTrigger value="info" className="flex-1 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Info
                            </TabsTrigger>
                            {parameters.length > 0 && (
                                <TabsTrigger value="parameters" className="flex-1 flex items-center gap-2">
                                    <SlidersHorizontal className="w-4 h-4" />
                                    Parameters
                                </TabsTrigger>
                            )}
                            {requestBody && (
                                <TabsTrigger value="body" className="flex-1 flex items-center gap-2">
                                    <FileJson className="w-4 h-4" />
                                    Body
                                </TabsTrigger>
                            )}
                            <TabsTrigger value="responses" className="flex-1 flex items-center gap-2">
                                <ArrowDownToLine className="w-4 h-4" />
                                Responses
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="mt-4 space-y-4">
                            {operation.deprecated && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        This endpoint is deprecated and might be removed in future versions.
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <FormattedMarkdown markdown={operation.description || '_No description provided_'} maxLength={1000} />
                            </div>
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
                        </TabsContent>

                        {parameters.length > 0 && (
                            <TabsContent value="parameters" className="mt-4">
                                <ParametersViewer parameters={parameters} />
                            </TabsContent>
                        )}
                        {requestBody && (
                            <TabsContent value="body" className="mt-4">
                                <RequestBodyViewer requestBody={requestBody} />
                            </TabsContent>
                        )}
                        <TabsContent value="responses" className="mt-4">
                            <ResponseViewer responses={responses} />
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="col-span-2 border-l border-border pl-6">
                    <div className="sticky top-20">
                        <CodeExamples
                            method={operation.method}
                            path={operation.path}
                            requestBody={requestValues.body}
                        />
                    </div>
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

    useEffect(() => {
        if (!loading && (!spec || !operation)) {
            navigate({ to: '/' });
        }
    }, [loading, spec, operation, navigate]);

    if (!operation) return null;

    return <EndpointContent operation={operation} />;
};

export default EndpointDetails;
