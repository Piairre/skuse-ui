import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedOperationObject } from "@/types/openapi";
import { getBadgeColor, resolveReferences } from "@/utils/openapi";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import { PlayCircle, FileJson, Database, Info, Lock } from 'lucide-react';
import { OpenAPIV3 } from 'openapi-types';
import { useOpenAPIContext } from "@/hooks/OpenAPIContext";
import SchemaViewer from './SchemaViewer';
import CodeExamples from './CodeExamples';
import ResponseViewer from './ResponseViewer';
import ParametersViewer from './ParametersViewer';

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
    const spec = useOpenAPIContext().spec as OpenAPIV3.Document;
    const [activeTab, setActiveTab] = useState('info');
    const [requestValues, setRequestValues] = useState<{
        parameters: Record<string, string>;
        body: string;
    }>({
        parameters: {},
        body: ''
    });

    // Résolution des références
    const resolvedParameters = operation.parameters
        ? resolveReferences(operation.parameters, spec) as OpenAPIV3.ParameterObject[]
        : [];
    const resolvedRequestBody = operation.requestBody
        ? resolveReferences(operation.requestBody, spec) as OpenAPIV3.RequestBodyObject
        : null;
    const resolvedResponses = operation.responses
        ? Object.entries(operation.responses).reduce((acc, [code, response]) => {
            acc[code] = resolveReferences(response, spec) as OpenAPIV3.ResponseObject;
            return acc;
        }, {} as Record<string, OpenAPIV3.ResponseObject>)
        : {};

    const serverUrl = spec.servers?.[0]?.url || 'https://api.example.com';

    const renderInfo = () => (
        <div className="space-y-6">
            {operation.description && (
                <div className="prose prose-slate max-w-none">
                    <FormattedMarkdown markdown={operation.description} />
                </div>
            )}

            {operation.deprecated && (
                <Alert variant="destructive">
                    <AlertDescription>
                        This endpoint is deprecated and might be removed in future versions.
                    </AlertDescription>
                </Alert>
            )}

            {operation.security && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Authentication Required
                    </h4>
                    <p className="text-sm text-gray-600">
                        This endpoint requires authentication. Make sure to include your API key in the request headers.
                    </p>
                </div>
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
        <ParametersViewer
            parameters={resolvedParameters}
            resolveReferences={(ref) => resolveReferences(ref, spec)}
            spec={spec}
        />
    );

    const renderRequestBody = () => {
        if (!resolvedRequestBody) return null;

        const contentType = Object.keys(resolvedRequestBody.content)[0] || 'application/json';
        const schema = resolvedRequestBody.content[contentType]?.schema;
        const resolvedSchema = schema
            ? resolveReferences(schema, spec) as OpenAPIV3.SchemaObject
            : null;

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Badge variant="outline">{contentType}</Badge>
                    {resolvedRequestBody.required && (
                        <Badge variant="outline" className="bg-red-50">Required</Badge>
                    )}
                </div>

                {resolvedRequestBody.description && (
                    <div className="prose prose-slate max-w-none">
                        <FormattedMarkdown markdown={resolvedRequestBody.description} />
                    </div>
                )}

                {resolvedSchema && (
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Schema</h4>
                        <SchemaViewer schema={resolvedSchema} />
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Request Body</Label>
                </div>
            </div>
        );
    };

    const renderResponses = () => (
        <ResponseViewer
            responses={resolvedResponses}
            resolveReferences={(ref) => resolveReferences(ref, spec)}
            spec={spec}
        />
    );

    const renderSecurityInfo = () => {
        if (!operation.security) return null;

        return (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Authentication Required
                </h4>
                <p className="text-sm text-gray-600">
                    This endpoint requires authentication. Make sure to include your API key in the request headers.
                </p>
            </div>
        );
    };

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
                        <p className="text-sm text-gray-600 mt-1">
                            {operation.summary}
                        </p>
                    </div>
                </div>
            </div>

            <div className="container grid grid-cols-5 gap-6 p-4">
                {/* Left Column - Documentation */}
                <div className="col-span-3">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="w-full">
                            <TabsTrigger value="info" className="flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Info
                            </TabsTrigger>
                            <TabsTrigger value="parameters" className="flex items-center gap-2">
                                <Database className="w-4 h-4" />
                                Parameters
                            </TabsTrigger>
                            {resolvedRequestBody && (
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
                                    {renderSecurityInfo()}
                                </TabPanel>
                            </TabsContent>

                            <TabsContent value="parameters">
                                <TabPanel>{renderParameters()}</TabPanel>
                            </TabsContent>

                            {resolvedRequestBody && (
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
                                ...(resolvedRequestBody ? {
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