import React from 'react';
import {OpenAPIV3} from 'openapi-types';
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import {cn} from "@/lib/utils";
import SchemaProperty from './SchemaProperty';
import {generateExample, isNullableSchema} from "@/utils/openapi";

interface ResponseViewerProps {
    responses: {[code: string]: OpenAPIV3.ResponseObject}
}

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
        active: 'data-[state=active]:bg-yellow-500 bg-green-500 dark:text-white'
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

const StatusTab: React.FC<{
    code: string;
    isActive: boolean;
}> = ({ code, isActive }) => {
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
        >
            {code}
        </TabsTrigger>
    );
};

const SchemaViewer: React.FC<{
    schema: OpenAPIV3.SchemaObject;
    contentType: string;
    description?: string;
}> = ({ schema }) => {
    return (
        <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
                <h3 className="text-base font-medium dark:text-gray-100">Response Schema</h3>
                <div className="p-2 border rounded-lg border-slate-200 dark:border-slate-700 space-y-1">
                    <SchemaProperty schema={schema} isRoot={true} />
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

interface ContentTypeTabProps {
    contentType: string;
    schema: OpenAPIV3.SchemaObject;
    description?: string;
}

const ContentTypeTab: React.FC<ContentTypeTabProps> = ({ contentType, schema, description }) => {
    return (
        <div className="space-y-4">
            <SchemaViewer
                schema={schema}
                contentType={contentType}
                description={description}
            />
        </div>
    );
};

const ResponseViewer: React.FC<ResponseViewerProps> = ({ responses }) => {
    if (!responses) return null;

    const responseKeys = Object.keys(responses);
    const defaultTab = responseKeys.length > 0 ? responseKeys[0] as string : '';
    const [activeTab, setActiveTab] = React.useState<string>(defaultTab);
    const [activeContentType, setActiveContentType] = React.useState<string | null>(null);

    const getContentTypes = (response: OpenAPIV3.ResponseObject): string[] => {
        if (!response.content) return [];
        return Object.keys(response.content);
    };

    React.useEffect(() => {
        if (responseKeys.length > 0) {
            if (!responseKeys.includes(activeTab)) {
                setActiveTab(responseKeys[0] as string);
            }
        }
    }, [responses, activeTab]);

    React.useEffect(() => {
        const currentResponse = responses[activeTab];
        if (currentResponse) {
            const contentTypes = getContentTypes(currentResponse);
            const firstContentType = contentTypes.length > 0 ? contentTypes[0] : null;
            if (firstContentType !== undefined) {
                setActiveContentType(firstContentType);
            }
        }
    }, [activeTab, responses]);

    if (responseKeys.length === 0) return null;

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-center gap-2 h-auto p-1 bg-muted">
                    {Object.entries(responses).map(([code]) => (
                        <StatusTab
                            key={code}
                            code={code}
                            isActive={activeTab === code}
                        />
                    ))}
                </TabsList>

                {Object.entries(responses).map(([code, response]) => {
                    const contentTypes = getContentTypes(response);

                    return (
                        <TabsContent key={code} value={code} className="mt-4">
                            <div className="space-y-4">
                                {response.description && (
                                    <div className="prose dark:prose-invert max-w-none">
                                        <FormattedMarkdown markdown={response.description} />
                                    </div>
                                )}

                                {contentTypes.length === 0 ? null : (
                                    <>
                                        {contentTypes.length > 1 && activeContentType ? (
                                            <Tabs
                                                value={activeContentType}
                                                onValueChange={setActiveContentType}
                                                className="w-full"
                                            >
                                                <TabsList className="w-full justify-center gap-2 h-auto bg-muted">
                                                    {contentTypes.map(contentType => (
                                                        <TabsTrigger
                                                            key={contentType}
                                                            value={contentType}
                                                            className="text-sm"
                                                        >
                                                            {contentType}
                                                        </TabsTrigger>
                                                    ))}
                                                </TabsList>

                                                {contentTypes.map(contentType => {
                                                    const content = response.content?.[contentType];
                                                    if (!content?.schema) return null;

                                                    return (
                                                        <TabsContent key={contentType} value={contentType}>
                                                            <ContentTypeTab
                                                                contentType={contentType}
                                                                schema={content.schema as OpenAPIV3.SchemaObject}
                                                                description={response.description}
                                                            />
                                                        </TabsContent>
                                                    );
                                                })}
                                            </Tabs>
                                        ) : contentTypes[0] && response.content?.[contentTypes[0]]?.schema ? (
                                            <ContentTypeTab
                                                contentType={contentTypes[0]}
                                                schema={response.content?.[contentTypes[0]]?.schema as OpenAPIV3.SchemaObject}
                                                description={response.description}
                                            />
                                        ) : null}
                                    </>
                                )}
                            </div>
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
};

export default ResponseViewer;