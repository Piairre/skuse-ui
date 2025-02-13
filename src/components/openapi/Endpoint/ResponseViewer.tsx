import React from 'react';
import {OpenAPIV3} from 'openapi-types';
import {Badge} from "@/components/ui/badge";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {ChevronDown, ChevronRight} from 'lucide-react';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import {cn} from "@/lib/utils";

// Types
interface ResponseViewerProps {
    responses: {[code: string]: OpenAPIV3.ResponseObject}
}

interface SchemaPropertyProps {
    name?: string;
    schema: OpenAPIV3.SchemaObject;
    required?: boolean;
}

// Configuration des statuts HTTP
const STATUS_STYLES = {
    '1': {
        base: 'text-blue-600 dark:text-blue-400 hover:text-white data-[state=active]:text-white',
        hover: 'hover:bg-blue-500 dark:text-white',
        active: 'data-[state=active]:bg-blue-500 bg-blue-500 dark:text-white'
    },
    '2': {
        base: 'text-green-600 dark:text-green-400 hover:text-white data-[state=active]:text-white',
        hover: 'hover:bg-green-500 dark:text-white',
        active: 'data-[state=active]:bg-green-500 bg-green-500 dark:text-white'
    },
    '3': {
        base: 'text-yellow-600 dark:text-yellow-400 hover:text-white data-[state=active]:text-white',
        hover: 'hover:bg-yellow-500 dark:text-white',
        active: 'data-[state=active]:bg-yellow-500 bg-yellow-500 dark:text-white'
    },
    '4': {
        base: 'text-orange-600 dark:text-orange-400 hover:text-white data-[state=active]:text-white',
        hover: 'hover:bg-orange-500 dark:text-white',
        active: 'data-[state=active]:bg-orange-500 bg-orange-500 dark:text-white'
    },
    '5': {
        base: 'text-red-600 dark:text-red-400 hover:text-white data-[state=active]:text-white',
        hover: 'hover:bg-red-500 dark:text-white',
        active: 'data-[state=active]:bg-red-500 bg-red-500 dark:text-white'
    }
} as const;

// Composant pour afficher une propriété du schéma
const SchemaProperty: React.FC<SchemaPropertyProps> = ({ name, schema, required }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const isArrayOfObjects = schema.type === 'array' &&
        (schema.items as OpenAPIV3.SchemaObject).type === 'object';

    const hasChildren = (schema.type === 'object' && schema.properties) ||
        (schema.type === 'array' && schema.items &&
            (schema.items as OpenAPIV3.SchemaObject).properties);

    const renderType = () => {
        if (schema.type === 'array' && schema.items) {
            if ('$ref' in schema.items) {
                return `${schema.items.$ref.split('/').pop()}[]`;
            }
            return `${schema.type}[${(schema.items as OpenAPIV3.SchemaObject).title ||
            (schema.items as OpenAPIV3.SchemaObject).type || ''}]`;
        }
        return schema.type;
    };

    return (
        <div className="py-1">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger className="group flex items-start gap-2 w-full hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded">
                    {hasChildren && (
                        <div className="text-gray-500 dark:text-gray-400 mt-1">
                            {isOpen ?
                                <ChevronDown className="h-4 w-4" /> :
                                <ChevronRight className="h-4 w-4" />
                            }
                        </div>
                    )}
                    <div className="flex flex-col gap-1 text-left">
                        <div className="flex items-center gap-2">
                            {name && (
                                <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                                    {name}{schema.type === 'array' && '[]'}
                                </span>
                            )}
                            <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700">
                                    {renderType()}
                                </Badge>
                                {required && (
                                    <Badge variant="outline"
                                           className="text-xs bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
                                        required
                                    </Badge>
                                )}
                                {schema.format && (
                                    <Badge variant="outline"
                                           className="text-xs bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
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
                            {Object.entries((schema.items as OpenAPIV3.SchemaObject).properties || {})
                                .map(([propName, propSchema]) => (
                                    <SchemaProperty
                                        key={propName}
                                        name={propName}
                                        schema={propSchema as OpenAPIV3.SchemaObject}
                                        required={(schema.items as OpenAPIV3.SchemaObject)
                                            .required?.includes(propName)}
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
                            {schema.type === 'array' && schema.items &&
                                (schema.items as OpenAPIV3.SchemaObject).properties && (
                                    <div className="mt-2">
                                        <SchemaProperty
                                            schema={schema.items as OpenAPIV3.SchemaObject}
                                        />
                                    </div>
                                )}
                        </>
                    )}
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
};

// Composant pour l'onglet de statut
const StatusTab: React.FC<{
    code: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ code, isActive, onClick }) => {
    const statusType = code.charAt(0) as keyof typeof STATUS_STYLES;
    const styles = STATUS_STYLES[statusType] ?? STATUS_STYLES['5'];

    return (
        <TabsTrigger
            value={code}
            className={cn(
                "transition-colors font-medium",
                styles.base,
                styles.hover,
                isActive && styles.active
            )}
            onClick={onClick}
        >
            {code}
        </TabsTrigger>
    );
};

// Composant pour l'affichage du schéma
const SchemaViewer: React.FC<{
    schema: OpenAPIV3.SchemaObject;
    contentType: string;
    description?: string;
}> = ({ schema, description }) => {
    const generateExample = (schema: OpenAPIV3.SchemaObject): any => {
        if (schema.example) return schema.example;

        if (schema.type === 'object' && schema.properties) {
            return Object.fromEntries(
                Object.entries(schema.properties).map(([key, prop]) => [
                    key,
                    generateExample(prop as OpenAPIV3.SchemaObject)
                ])
            );
        }

        if (schema.type === 'array' && schema.items) {
            return [generateExample(schema.items as OpenAPIV3.SchemaObject)];
        }

        const defaultValues = {
            string: schema.format === 'date-time' ? new Date().toISOString() : 'string',
            number: 0,
            integer: 0,
            boolean: true
        };

        return defaultValues[schema.type as keyof typeof defaultValues] ?? null;
    };

    return (
        <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
                <h3 className="text-base font-medium dark:text-gray-100">
                    <FormattedMarkdown markdown={description || ''} />
                </h3>
                <div className="p-2 border rounded-lg border-slate-200 dark:border-slate-700 space-y-1">
                    {schema.type === 'object' && schema.properties ? (
                        Object.entries(schema.properties).map(([propName, propSchema]) => (
                            <SchemaProperty
                                key={propName}
                                name={propName}
                                schema={propSchema as OpenAPIV3.SchemaObject}
                                required={schema.required?.includes(propName)}
                            />
                        ))
                    ) : (
                        <SchemaProperty schema={schema} />
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-base font-medium dark:text-gray-100">Example Response</h3>
                <div>
                    <FormattedMarkdown
                        markdown={`\`\`\`json\n${JSON.stringify(
                            schema?.example || generateExample(schema),
                            null,
                            2
                        )}\n\`\`\``}
                        className="[&_code]:!whitespace-pre-wrap p-2 !border !rounded-lg !border-slate-200 dark:!border-slate-700"
                    />
                </div>
            </div>
        </div>
    );
};

// Composant principal
const ResponseViewer: React.FC<ResponseViewerProps> = ({ responses }) => {
    if (!responses) return null;
    const [activeTab, setActiveTab] = React.useState(Object.keys(responses)[0]);

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start gap-2 h-auto p-1 bg-transparent dark:bg-transparent">
                {Object.entries(responses).map(([code]) => (
                    <StatusTab
                        key={code}
                        code={code}
                        isActive={activeTab === code}
                        onClick={() => setActiveTab(code)}
                    />
                ))}
            </TabsList>

            {Object.entries(responses).map(([code, response]) => {
                if (!response.content) return null;
                const contentType = Object.keys(response.content)[0];
                if (!contentType) return null;

                const content = response.content[contentType];
                const schema = content?.schema as OpenAPIV3.SchemaObject;

                return (
                    <TabsContent key={code} value={code} className="mt-4">
                        <SchemaViewer
                            schema={schema}
                            contentType={contentType}
                            description={response.description}
                        />
                    </TabsContent>
                );
            })}
        </Tabs>
    );
};

export default ResponseViewer;