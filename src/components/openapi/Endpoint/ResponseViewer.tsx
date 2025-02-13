import React from 'react';
import {OpenAPIV3} from 'openapi-types';
import {Badge} from "@/components/ui/badge";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {ChevronDown, ChevronRight} from 'lucide-react';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import {cn} from "@/lib/utils";

interface ResponseViewerProps {
    responses: {[code: string]: | OpenAPIV3.ResponseObject}
}

interface SchemaPropertyProps {
    name?: string;
    schema: OpenAPIV3.SchemaObject;
    required?: boolean;
}

const SchemaProperty: React.FC<SchemaPropertyProps> = ({ name, schema, required }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const isArrayOfObjects = schema.type === 'array' &&
        (schema.items as OpenAPIV3.SchemaObject).type === 'object';
    const hasChildren = (schema.type === 'object' && schema.properties) ||
        (schema.type === 'array' && schema.items && (schema.items as OpenAPIV3.SchemaObject).properties);

    const renderType = () => {
        if (schema.type === 'array' && schema.items) {
            if ('$ref' in schema.items) {
                return `${schema.items.$ref.split('/').pop()}[]`;
            }
            return `${(schema.type)}[${(schema.items.title || schema.items.type) || ''}]`;
        }
        return schema.type;
    };

    const renderPropertyName = () => {
        if (!name) return null;
        if (schema.type === 'array') {
            return `${name}`;
        }
        return name;
    };

    return (
        <div className="py-1">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger
                    className="group flex items-start gap-2 w-full hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded"
                >
                    {hasChildren && (
                        <div className="text-gray-500 dark:text-gray-400 mt-1">
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                    )}
                    <div className="flex flex-col gap-1 text-left">
                        <div className="flex items-center gap-2">
                            {renderPropertyName() && (
                                <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                                    {renderPropertyName()}{schema.type === 'array' && '[]'}
                                </span>
                            )}
                            <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700">
                                    {renderType()}
                                </Badge>
                                {required && (
                                    <Badge variant="outline" className="text-xs bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
                                        required
                                    </Badge>
                                )}
                                {schema.format && (
                                    <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
                                        {schema.format}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        {schema.description && (
                            <FormattedMarkdown
                                className="!text-xs !text-gray-600 dark:!text-gray-400 group-hover:!bg-slate-50 dark:group-hover:!bg-slate-800"
                                markdown={schema.description}
                            />
                        )}
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-6">
                    {isArrayOfObjects ? (
                        <div className="space-y-1 mt-2">
                            {Object.entries((schema.items as OpenAPIV3.SchemaObject).properties || {}).map(([propName, propSchema]) => (
                                <SchemaProperty
                                    key={propName}
                                    name={propName}
                                    schema={propSchema as OpenAPIV3.SchemaObject}
                                    required={(schema.items as OpenAPIV3.SchemaObject).required?.includes(propName)}
                                />
                            ))}
                        </div>
                    ) : (
                        <>
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
                            {schema.type === 'array'&& schema.items && (schema.items as OpenAPIV3.SchemaObject).properties && (
                                <div className="mt-2">
                                    <SchemaProperty schema={schema.items as OpenAPIV3.SchemaObject}/>
                                </div>
                            )}
                        </>
                    )}
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
};

const ResponseViewer: React.FC<ResponseViewerProps> = ({ responses }) => {
    if (!responses) return null;
    const [activeTab, setActiveTab] = React.useState(Object.keys(responses)[0]);

    const getStatusColor = (code: string): string => {
        if (code.startsWith('1')) return 'blue';
        if (code.startsWith('2')) return 'green';
        if (code.startsWith('3')) return 'yellow';
        if (code.startsWith('4')) return 'orange';
        if (code.startsWith('5')) return 'red';
        return 'gray';
    };

    const getStatusStyles = (code: string, isActive: boolean = false): string => {
        const color = getStatusColor(code);
        return cn(
            "transition-colors",
            isActive ? `bg-${color}-500 text-white font-semibold` : `text-${color}-600 dark:text-${color}-400`,
            `hover:bg-${color}-500 hover:text-white`,
            `data-[state=active]:bg-${color}-500 data-[state=active]:text-white`
        );
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start gap-2 h-auto p-1 bg-transparent dark:bg-transparent">
                {Object.entries(responses).map(([code]) => (
                    <TabsTrigger
                        key={code}
                        value={code}
                        className={getStatusStyles(code, activeTab === code)}
                    >
                        {code}
                    </TabsTrigger>
                ))}
            </TabsList>

            {Object.entries(responses).map(([code, response]) => {
                return (
                    <TabsContent key={code} value={code} className="mt-4">
                        {response.content && (
                            <div className="grid grid-cols-1 gap-6">
                                {(() => {
                                    const contentType = Object.keys(response.content)[0];
                                    if (!contentType) return null;

                                    const content = response.content[contentType];
                                    const schema = content?.schema as OpenAPIV3.SchemaObject;

                                    return (
                                        <>
                                            <div className="space-y-2">
                                                <h3 className="text-base font-medium dark:text-gray-100">
                                                    <FormattedMarkdown markdown={response.description} />
                                                </h3>
                                                <div className="p-2 border rounded-lg border-slate-200 dark:border-slate-700 space-y-1">
                                                    {schema.type === 'object' && schema.properties &&
                                                        Object.entries(schema.properties).map(([propName, propSchema]) => (
                                                            <SchemaProperty
                                                                key={propName}
                                                                name={propName}
                                                                schema={propSchema as OpenAPIV3.SchemaObject}
                                                                required={schema.required?.includes(propName)}
                                                            />
                                                        ))
                                                    }
                                                    {((schema.type === 'array') || schema.type !== 'object') &&
                                                        <SchemaProperty schema={schema} />
                                                    }
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="text-base font-medium dark:text-gray-100">Example Response</h3>
                                                <div className="p-2 border rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
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
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </TabsContent>
                );
            })}
        </Tabs>
    );
};

export default ResponseViewer;