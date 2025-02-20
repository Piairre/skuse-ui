import React, {useState, useEffect, useMemo} from 'react';
import { useParams, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EnhancedOperationObject } from "@/types/openapi";
import { getBadgeColor, findOperationByOperationIdAndTag } from "@/utils/openapi";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import { PlayCircle, FileJson, Database, Info, Lock } from 'lucide-react';
import CodeExamples from './CodeExamples';
import ResponseViewer from './ResponseViewer';
import ParametersViewer from './ParametersViewer';
import RequestBodyViewer from "@/components/openapi/Endpoint/RequestBodyViewer";
import { useOpenAPIContext } from "@/hooks/OpenAPIContext";

interface TabPanelProps {
    children: React.ReactNode;
    className?: string;
}

interface EndpointContentProps {
    operation: EnhancedOperationObject;
}

interface RequestValues {
    parameters: Record<string, string>;
    body: string;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, className = "" }) => (
    <div className={`rounded-lg border p-4 ${className}`}>
        {children}
    </div>
);

const EndpointContent: React.FC<EndpointContentProps> = ({ operation }) => {
    const [activeTab, setActiveTab] = useState<string>('info');
    const [requestValues] = useState<RequestValues>({
        parameters: {},
        body: ''
    });

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

    const renderInfo = () => (
        <div className="space-y-6">
            <div className="prose prose-slate max-w-none">
                {operation.security && (
                    <span className="flex text-xs mb-1">
                        <Lock className="w-4 h-4 me-2" />Authentication Required
                    </span>
                )}

                {operation.description && (
                    <FormattedMarkdown markdown={operation.description} maxLength={1000} />
                )}
            </div>

            {operation.deprecated && (
                <Alert variant="destructive">
                    <AlertDescription>
                        This endpoint is deprecated and might be removed in future versions.
                    </AlertDescription>
                </Alert>
            )}

            {operation.externalDocs && (
                <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">External Documentation</h3>
                    <a
                        href={operation.externalDocs.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                    >
                        {operation.externalDocs.description || 'Learn more'}
                    </a>
                </div>
            )}
        </div>
    );

    const renderParameters = () => (
        <ParametersViewer parameters={parameters} />
    );

    const renderRequestBody = () => (
        requestBody ? <RequestBodyViewer requestBody={requestBody} /> : null
    );

    const renderResponses = () => (
        <ResponseViewer responses={responses} />
    );

    return (
        <Card className="w-full">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                    <Badge
                        className={`${getBadgeColor(operation.method.toLowerCase())} text-white px-4 py-1`}
                    >
                        {operation.method}
                    </Badge>
                    <div>
                        <h2 className="text-xl font-semibold">{operation.path}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {operation.summary}
                        </p>
                    </div>
                </div>
            </div>

            <div className="container grid grid-cols-5 gap-6 p-4">
                <div className="col-span-3">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="w-full">
                            <TabsTrigger value="info" className="flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Info
                            </TabsTrigger>
                            {parameters.length > 0 && (
                                <TabsTrigger value="parameters" className="flex items-center gap-2">
                                    <Database className="w-4 h-4" />
                                    Parameters
                                </TabsTrigger>
                            )}
                            {requestBody && (
                                <TabsTrigger value="body" className="flex items-center gap-2">
                                    <FileJson className="w-4 h-4" />
                                    Request Body
                                </TabsTrigger>
                            )}
                            <TabsTrigger value="responses" className="flex items-center gap-2">
                                <PlayCircle className="w-4 h-4" />
                                Responses
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-4">
                            <TabsContent value="info">
                                <TabPanel>
                                    {renderInfo()}
                                </TabPanel>
                            </TabsContent>
                            {parameters.length > 0 && (
                                <TabsContent value="parameters">
                                    <TabPanel>{renderParameters()}</TabPanel>
                                </TabsContent>
                            )}
                            {requestBody && (
                                <TabsContent value="body">
                                    <TabPanel>{renderRequestBody()}</TabPanel>
                                </TabsContent>
                            )}
                            <TabsContent value="responses">
                                <TabPanel>{renderResponses()}</TabPanel>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <div className="col-span-2 border-l pl-6">
                    <div className="sticky top-4">
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
    const { tag, operationId } = useParams({
        from: '/$tag/$operationId'
    });
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

    if (!operation) {
        return null;
    }

    return <EndpointContent operation={operation} />;
};

export default EndpointDetails;