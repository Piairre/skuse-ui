import React from 'react';
import { OpenAPIV3 } from 'openapi-types';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, ChevronDown } from 'lucide-react';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";

interface ResponseViewerProps {
    responses: Record<string, OpenAPIV3.ResponseObject>;
    resolveReferences: (ref: any, spec: OpenAPIV3.Document) => any;
    spec: OpenAPIV3.Document;
}

const SchemaProperty: React.FC<{
    name?: string;
    schema: OpenAPIV3.SchemaObject;
    required?: boolean;
}> = ({ name, schema, required }) => {
    const [isOpen, setIsOpen] = React.useState(true);
    const hasChildren = schema.type === 'object' || schema.type === 'array';

    const renderType = () => {
        if (schema.type === 'array' && schema.items) {
            if ('$ref' in schema.items) {
                const refName = schema.items.$ref.split('/').pop();
                return `array[${refName}]`;
            }
            return `array[${(schema.items as OpenAPIV3.SchemaObject).type || 'object'}]`;
        }
        return schema.type;
    };

    return (
        <div className="py-1">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-slate-50 p-1 rounded text-sm">
                    {hasChildren && (
                        <div className="text-gray-500">
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                        {name && <span className="font-mono text-sm">{name}</span>}
                        <Badge variant="outline" className="text-xs">
                            {renderType()}
                        </Badge>
                        {required && (
                            <Badge variant="outline" className="bg-red-50 text-xs">
                                required
                            </Badge>
                        )}
                        {schema.format && (
                            <Badge variant="outline" className="text-xs bg-blue-50">
                                {schema.format}
                            </Badge>
                        )}
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-4">
                    {schema.description && (
                        <p className="text-xs text-gray-600 mt-1">{schema.description}</p>
                    )}
                    {schema.type === 'object' && schema.properties && (
                        <div className="space-y-1 mt-2">
                            {Object.entries(schema.properties).map(([propName, propSchema]) => (
                                <SchemaProperty
                                    key={propName}
                                    name={propName}
                                    schema={propSchema as OpenAPIV3.SchemaObject}
                                    required={schema.required?.includes(propName)}
                                />
                            ))}
                        </div>
                    )}
                    {schema.type === 'array' && schema.items && (
                        <div className="mt-2">
                            <SchemaProperty
                                name="[]"
                                schema={schema.items as OpenAPIV3.SchemaObject}
                            />
                        </div>
                    )}
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
};

const ResponseViewer: React.FC<ResponseViewerProps> = ({ responses, resolveReferences, spec }) => {
    if (!responses) return null;

    const getStatusStyles = (code: string): string => {
        if (code.startsWith('2')) {
            return 'text-green-600 bg-transparent hover:bg-green-500 hover:text-white data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:font-semibold';
        }
        if (code.startsWith('4')) {
            return 'text-orange-600 bg-transparent hover:bg-orange-500 hover:text-white data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:font-semibold';
        }
        if (code.startsWith('5')) {
            return 'text-red-600 bg-transparent hover:bg-red-500 hover:text-white data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:font-semibold';
        }
        return 'text-gray-600 bg-transparent hover:bg-gray-500 hover:text-white data-[state=active]:bg-gray-500 data-[state=active]:text-white data-[state=active]:font-semibold';
    };

    const generateExample = (schema: OpenAPIV3.SchemaObject): any => {
        if (schema.example) return schema.example;

        if (schema.type === 'object' && schema.properties) {
            const example: Record<string, any> = {};
            Object.entries(schema.properties).forEach(([key, prop]) => {
                example[key] = generateExample(prop as OpenAPIV3.SchemaObject);
            });
            return example;
        }

        if (schema.type === 'array' && schema.items) {
            return [generateExample(schema.items as OpenAPIV3.SchemaObject)];
        }

        switch (schema.type) {
            case 'string':
                return schema.format === 'date-time' ? new Date().toISOString() : 'string';
            case 'number':
                return 0;
            case 'integer':
                return 0;
            case 'boolean':
                return true;
            default:
                return null;
        }
    };

    return (
        <Tabs defaultValue={Object.keys(responses)[0]} className="w-full">
            <TabsList className="w-full justify-start gap-2 h-auto p-1">
                {Object.entries(responses).map(([code]) => (
                    <TabsTrigger
                        key={code}
                        value={code}
                        className={`transition-colors ${getStatusStyles(code)}`}
                    >
                        {code}
                    </TabsTrigger>
                ))}
            </TabsList>

            {Object.entries(responses).map(([code, response]) => {
                const resolvedResponse = '$ref' in response
                    ? resolveReferences(response, spec) as OpenAPIV3.ResponseObject
                    : response;

                if (!resolvedResponse.content) return null;

                const contentType = Object.keys(resolvedResponse.content || {})[0];
                if (!contentType || !resolvedResponse.content) return null;
                const content = resolvedResponse.content[contentType];
                const schema = content?.schema
                    ? resolveReferences(content.schema, spec) as OpenAPIV3.SchemaObject
                    : null;

                return (
                    <TabsContent key={code} value={code} className="mt-4">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-base font-medium">Schema</h3>
                                <div className="p-4 border rounded-lg bg-white">
                                    {schema && <SchemaProperty schema={schema} />}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-base font-medium">Example Response</h3>
                                <div className="p-4 border rounded-lg bg-slate-50">
                                    <FormattedMarkdown
                                        markdown={`\`\`\`json\n${JSON.stringify(
                                            content?.example || schema?.example || (schema ? generateExample(schema) : {}),
                                            null,
                                            2
                                        )}\n\`\`\``}
                                        className="[&_code]:!whitespace-pre-wrap text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                );
            })}
        </Tabs>
    );
};

export default ResponseViewer;