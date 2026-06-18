import React from 'react';
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import {cn} from "@/lib/utils";
import {ResponseObject, SchemaObject, HeaderObject} from "@/types/unified-openapi-types";
import SchemaViewer from './SchemaViewer';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {renderSchemaType, isEmptySchema} from "@/utils/openapi";

interface ResponseViewerProps {
    responses: { [code: string]: ResponseObject }
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

interface HeaderViewerProps {
    headers: { [name: string]: HeaderObject };
}

const HeaderViewer: React.FC<HeaderViewerProps> = ({headers}) => {
    if (!headers || Object.keys(headers).length === 0) return null;

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle className="text-base">Headers</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {Object.entries(headers).map(([name, header]) => (
                        <div key={name} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">{name}</span>
                                {header.required && (
                                    <Badge variant="outline"
                                           className="text-xs bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
                                        required
                                    </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                    { (header.type || header.schema) ? (header.schema ? renderSchemaType(header.schema) : 'unknown') : '' }
                                </Badge>
                                {header.schema?.pattern && (
                                    <Badge variant="outline"
                                           className="text-xs bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
                                        pattern
                                    </Badge>
                                )}
                            </div>
                            {header.description && (
                                <FormattedMarkdown
                                    markdown={header.description}
                                    className="!text-xs text-gray-600 dark:text-gray-400"
                                />
                            )}
                            {header.schema?.pattern && (
                                <div className="text-xs font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                    Pattern: {header.schema.pattern}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

const StatusTab: React.FC<{
    code: string;
    isActive: boolean;
}> = ({code, isActive}) => {
    const statusType = code.charAt(0) as keyof typeof STATUS_STYLES;
    const styles = STATUS_STYLES[statusType] ?? STATUS_STYLES['5'];

    return (
        <TabsTrigger
            value={code}
            className={cn(
                "flex-1 transition-colors font-medium",
                styles.base,
                styles.hover,
                isActive && styles.active
            )}
        >
            {code}
        </TabsTrigger>
    );
};


const ResponseViewer: React.FC<ResponseViewerProps> = ({responses}) => {
    const responseKeys = React.useMemo(() => responses ? Object.keys(responses) : [], [responses]);
    const defaultTab = responseKeys.length > 0 ? responseKeys[0] as string : '';
    const [activeTab, setActiveTab] = React.useState<string>(defaultTab);
    const [activeContentType, setActiveContentType] = React.useState<string | null>(null);

    const getContentTypes = (response: ResponseObject): string[] => {
        if (!response.content) return [];
        return Object.keys(response.content);
    };

    React.useEffect(() => {
        if (responseKeys.length > 0) {
            if (!responseKeys.includes(activeTab)) {
                setActiveTab(responseKeys[0] as string);
            }
        }
    }, [responses, activeTab, responseKeys]);

    React.useEffect(() => {
        if (!responses) return;
        const currentResponse = responses[activeTab];
        if (currentResponse) {
            const contentTypes = getContentTypes(currentResponse);
            const firstContentType = contentTypes.length > 0 ? contentTypes[0] : null;
            if (firstContentType !== undefined) {
                setActiveContentType(firstContentType);
            }
        }
    }, [activeTab, responses]);

    if (!responses || responseKeys.length === 0) return null;

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full flex-wrap justify-center gap-2 h-auto p-1 bg-muted">
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
                                        <FormattedMarkdown markdown={response.description}/>
                                    </div>
                                )}

                                {response.headers && (
                                    <HeaderViewer headers={response.headers}/>
                                )}

                                {contentTypes.length === 0 ? null : (
                                    <>
                                        {contentTypes.length > 1 && activeContentType ? (
                                            <Tabs
                                                value={activeContentType}
                                                onValueChange={setActiveContentType}
                                                className="w-full"
                                            >
                                                <TabsList className="w-full h-auto bg-muted">
                                                    {contentTypes.map(contentType => (
                                                        <TabsTrigger
                                                            key={contentType}
                                                            value={contentType}
                                                            className="flex-1 text-sm"
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
                                                            {isEmptySchema(content.schema) ? (
                                                                <p className="text-sm text-muted-foreground italic">No schema defined.</p>
                                                            ) : (
                                                                <SchemaViewer
                                                                    contentType={contentType}
                                                                    schema={content.schema}
                                                                    description={response.description}
                                                                    examples={content.examples}
                                                                />
                                                            )}
                                                        </TabsContent>
                                                    );
                                                })}
                                            </Tabs>
                                        ) : contentTypes[0] && response.content?.[contentTypes[0]]?.schema ? (
                                            (() => {
                                                const schema = response.content?.[contentTypes[0]]?.schema as SchemaObject;
                                                return isEmptySchema(schema) ? (
                                                    <p className="text-sm text-muted-foreground italic">No schema defined.</p>
                                                ) : (
                                                    <SchemaViewer
                                                        contentType={contentTypes[0]}
                                                        schema={schema}
                                                        description={response.description}
                                                        examples={response.content?.[contentTypes[0]]?.examples}
                                                    />
                                                );
                                            })()
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