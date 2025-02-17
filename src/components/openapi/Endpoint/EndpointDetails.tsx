import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {EnhancedOperationObject, ParameterObject, RequestBodyObject, ResponseObject} from "@/types/openapi";
import { getBadgeColor } from "@/utils/openapi";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import { PlayCircle, FileJson, Database, Info, Lock } from 'lucide-react';
import { useOpenAPIContext } from "@/hooks/OpenAPIContext";
import CodeExamples from './CodeExamples';
import ResponseViewer from './ResponseViewer';
import ParametersViewer from './ParametersViewer';
import RequestBodyViewer from "@/components/openapi/Endpoint/RequestBodyViewer";

interface TabPanelProps {
    children: React.ReactNode;
    className?: string;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, className = "" }) => (
    <div className={`rounded-lg border p-4 ${className}`}>
        {children}
    </div>
);

const EndpointPlayground: React.FC<{ operation: EnhancedOperationObject }> = ({ operation }) => {
    const { spec } = useOpenAPIContext();

    const [activeTab, setActiveTab] = useState('info');
    const [requestValues] = useState<{
        parameters: Record<string, string>;
        body: string;
    }>({
        parameters: {},
        body: ''
    });

    // Résolution des références
    const parameters = operation.parameters as ParameterObject[] ?? [];
    const requestBody = operation.requestBody as RequestBodyObject || null;
    const responses = operation.responses as {[code: string]: | ResponseObject};

    const serverUrl = spec.servers?.[0]?.url || 'https://api.example.com';

    const renderInfo = () => (
        <div className="space-y-6">

            <div className="prose prose-slate max-w-none">

                {operation.security && (
                    <span className={"flex text-xs mb-1"}>
                        <Lock className="w-4 h-4 me-2" />Authentication Required
                    </span>
                )}

                {operation.description && (
                    <FormattedMarkdown markdown={operation.description} />
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

    const renderRequestBody = () => {
        if (!requestBody) return null;
        return <RequestBodyViewer requestBody={requestBody} />;
    };

    const renderResponses = () => (
        <ResponseViewer responses={responses}/>
    );

    const availableTabs = React.useMemo(() => {
        const tabs = ['info'];
        if (parameters.length > 0) tabs.push('parameters');
        if (requestBody) tabs.push('body');
        tabs.push('responses');
        return tabs;
    }, [parameters.length, requestBody]);

    React.useEffect(() => {
        if (!availableTabs.includes(activeTab)) {
            setActiveTab(availableTabs[0] || 'info');
        }
    }, [operation.operationId, availableTabs, activeTab]);

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

                {/* Right Column - Code Examples */}
                <div className="col-span-2 border-l pl-6">
                    <div className="sticky top-4">
                        <CodeExamples
                            method={operation.method}
                            path={operation.path}
                            serverUrl={serverUrl}
                            requestBody={requestValues.body}
                            headers={{
                                ...(operation.security ? {
                                    'Authorization': 'Bearer YOUR_API_KEY'
                                } : {}),
                                ...(requestBody ? {
                                    'Content-Type': 'application/json'
                                } : {})
                            }}
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default EndpointPlayground;