import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EnhancedOperationObject } from "@/types/openapi";
import { getBadgeColor, resolveReferences } from "@/utils/openapi";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import { ChevronDown, ChevronRight, Code, Play, FileJson } from 'lucide-react';
import { OpenAPIV3 } from 'openapi-types';
import {useOpenAPIContext} from "@/hooks/OpenAPIContext";

interface EndpointDetailsProps {
    operation: EnhancedOperationObject | null;
}

type ResolvedParameter = OpenAPIV3.ParameterObject;
type ResolvedRequestBody = OpenAPIV3.RequestBodyObject;
type ResolvedResponse = OpenAPIV3.ResponseObject;

interface RequestValues {
    parameters: Record<string, string>;
    body: string;
}

const EndpointDetails: React.FC<EndpointDetailsProps> = ({ operation }) => {
    const [isParametersOpen, setIsParametersOpen] = useState(true);
    const [activeTab, setActiveTab] = useState("parameters");
    const [requestValues, setRequestValues] = useState<RequestValues>({
        parameters: {},
        body: ""
    });
    
    const spec = useOpenAPIContext().spec as OpenAPIV3.Document;

    if (!operation) {
        return (
            <div>
                Not found
            </div>
        );
    }

    // Resolve references
    const resolvedParameters = operation.parameters
        ? resolveReferences(operation.parameters, spec) as OpenAPIV3.ParameterObject[]
        : [];

    const resolvedRequestBody = operation.requestBody
        ? resolveReferences(operation.requestBody, spec) as OpenAPIV3.RequestBodyObject
        : null;

    const resolvedResponses = operation.responses
        ? resolveReferences(operation.responses, spec) as Record<string, OpenAPIV3.ResponseObject>
        : {};

    const hasParameters = resolvedParameters.length > 0;
    const hasRequestBody = resolvedRequestBody !== null;
    const hasResponses = Object.keys(resolvedResponses).length > 0;

    const renderSchemaExample = (schema?: OpenAPIV3.SchemaObject): string => {
        if (!schema) return "";

        if (schema.example) {
            return JSON.stringify(schema.example, null, 2);
        }

        if (schema.type === 'object' && schema.properties) {
            const example: Record<string, any> = {};
            Object.entries(schema.properties).forEach(([key, prop]) => {
                if (typeof prop === 'object' && !('$ref' in prop)) {
                    example[key] = prop.example || '';
                }
            });
            return JSON.stringify(example, null, 2);
        }

        return "";
    };

    const renderParameters = () => {
        if (!hasParameters) return null;

        return (
            <div className="space-y-6">
                {resolvedParameters.map((param: ResolvedParameter, index) => (
                    <div key={index} className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="font-medium">
                                {param.name}
                                {param.required && <span className="text-red-500 ml-1">*</span>}
                            </div>
                            <Badge variant="outline">{param.in}</Badge>
                            {param.schema && 'type' in param.schema && (
                                <Badge variant="outline" className="bg-gray-100">
                                    {param.schema.type}
                                </Badge>
                            )}
                        </div>
                        {param.description && (
                            <span className="text-sm text-gray-500">{param.description}</span>
                        )}
                        {param.schema && 'enum' in param.schema && param.schema.enum && (
                            <div className="text-sm text-gray-500">
                                Choices: {param.schema.enum.join(', ')}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderRequestBody = () => {
        if (!hasRequestBody || !resolvedRequestBody) return null;

        const contentType = Object.keys(resolvedRequestBody.content)[0] as string;
        const schema = resolvedRequestBody.content[contentType]?.schema;
        const example = schema ? renderSchemaExample(resolveReferences(schema, spec) as OpenAPIV3.SchemaObject) : "";

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Badge variant="outline">{contentType}</Badge>
                    {resolvedRequestBody.required && (
                        <Badge variant="outline" className="bg-red-50">Required</Badge>
                    )}
                </div>
                {resolvedRequestBody.description && (
                    <p className="text-sm text-gray-600">{resolvedRequestBody.description}</p>
                )}

                {example && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRequestValues(prev => ({ ...prev, body: example }))}
                        >
                            Utiliser l'exemple
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    const renderResponses = () => {
        if (!hasResponses) return null;

        return (
            <div className="space-y-4">
                {Object.entries(resolvedResponses).map(([code, response]) => {
                    const contentType = response.content ? Object.keys(response.content)[0] as string : "";
                    const schema = contentType && response.content ? response.content[contentType]?.schema : null;
                    const example = schema ? renderSchemaExample(resolveReferences(schema, spec) as OpenAPIV3.SchemaObject) : null;

                    return (
                        <div key={code} className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge
                                    variant="outline"
                                    className={code.startsWith('2') ? 'bg-green-100' :
                                        code.startsWith('4') ? 'bg-orange-100' :
                                            code.startsWith('5') ? 'bg-red-100' : ''}
                                >
                                    {code}
                                </Badge>
                                <span className="font-medium">{response.description}</span>
                                {contentType && (
                                    <Badge variant="outline">{contentType}</Badge>
                                )}
                            </div>
                            {example && (
                                <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                                    <code className="text-sm">
                                        {example}
                                    </code>
                                </pre>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <Card className="w-full mx-auto">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Badge
                        className={`${getBadgeColor(operation.method.toLowerCase())} text-white text-lg uppercase flex justify-center items-center`}
                    >
                        {operation.method}
                    </Badge>
                    <CardTitle className="text-2xl">
                        {operation.path}
                    </CardTitle>
                </div>
                <CardDescription className="text-base">
                    {operation.summary}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {operation.description && (
                    <FormattedMarkdown className="p-2" markdown={operation.description} />
                )}

                <Tabs defaultValue="parameters" className="w-full">
                    <TabsList>
                        {hasParameters && (
                            <TabsTrigger value="parameters">
                                Parameters
                                {resolvedParameters.some(p => p.required) && (
                                    <Badge variant="outline" className="ml-2 bg-red-50">
                                        Required
                                    </Badge>
                                )}
                            </TabsTrigger>
                        )}
                        {hasRequestBody && (
                            <TabsTrigger value="body">
                                Request Body
                                {resolvedRequestBody?.required && (
                                    <Badge variant="outline" className="ml-2 bg-red-50">
                                        Required
                                    </Badge>
                                )}
                            </TabsTrigger>
                        )}
                        {hasResponses && (
                            <TabsTrigger value="responses">
                                Responses
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="example">
                            Exemple
                        </TabsTrigger>
                    </TabsList>

                    {hasParameters && (
                        <TabsContent value="parameters" className="space-y-4">
                            {renderParameters()}
                        </TabsContent>
                    )}

                    {hasRequestBody && (
                        <TabsContent value="body" className="space-y-4">
                            {renderRequestBody()}
                        </TabsContent>
                    )}

                    {hasResponses && (
                        <TabsContent value="responses" className="space-y-4">
                            {renderResponses()}
                        </TabsContent>
                    )}

                    <TabsContent value="example" className="space-y-4">
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <pre className="text-sm overflow-x-auto">
                                    <code>
                                        {`curl -X ${operation.method} \\
  '${operation.path}' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer <YOUR_TOKEN>' \\
  ${requestValues.body ? `-d '${JSON.stringify(JSON.parse(requestValues.body || "{}"), null, 2)}'` : ''}`}
                                    </code>
                                </pre>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                    <Code className="w-4 h-4 mr-2" />
                                    Copier
                                </Button>
                                <Button variant="outline" size="sm">
                                    <FileJson className="w-4 h-4 mr-2" />
                                    Télécharger Collection Postman
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default EndpointDetails;