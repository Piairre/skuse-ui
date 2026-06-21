import React from 'react';
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import {cn} from "@/lib/utils";
import {ResponseObject, SchemaObject, HeaderObject, LinkObject} from "@/types/unified-openapi-types";
import SchemaViewer from './SchemaViewer';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {renderSchemaType, isEmptySchema, groupEndpointsByTags, getOperationId} from "@/utils/openapi";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useOpenAPIContext } from '@/hooks/OpenAPIContext';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

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
                                    {(header.type || header.schema) ? (header.schema ? renderSchemaType(header.schema) : 'unknown') : ''}
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

const ResponseLinks: React.FC<{ links: Record<string, LinkObject> }> = ({ links }) => {
    const { spec } = useOpenAPIContext();
    const navigate = useNavigate();

    const findRoute = (operationId: string) => {
        const grouped = groupEndpointsByTags(spec.paths);
        for (const [tag, ops] of Object.entries(grouped)) {
            const op = ops.find(o => o.operationId === operationId);
            if (op) return { tag, operationIdentifier: getOperationId(op) };
        }
        return null;
    };

    return (
        <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">See also</p>
            <div className="flex flex-wrap gap-2">
                {Object.entries(links).map(([name, link]) => {
                    const route = link.operationId ? findRoute(link.operationId) : null;
                    return (
                        <button
                            key={name}
                            title={link.description}
                            onClick={() => route && navigate({ to: '/$tag/$operationIdentifier', params: route })}
                            className={cn(
                                "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors",
                                route
                                    ? "border-primary/50 text-primary hover:bg-primary/10 cursor-pointer"
                                    : "border-muted-foreground/30 text-muted-foreground cursor-default"
                            )}
                        >
                            <ArrowRight className="h-3 w-3 shrink-0" />
                            {name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const ResponseContent: React.FC<{ response: ResponseObject }> = ({ response }) => {
    const { preferredContentType, setPreferredContentType } = useOpenAPIContext();
    const contentTypes = response.content ? Object.keys(response.content) : [];

    const resolve = () => preferredContentType && contentTypes.includes(preferredContentType)
        ? preferredContentType
        : (contentTypes[0] ?? '');

    const [activeContentType, setActiveContentType] = React.useState<string>(resolve);

    React.useEffect(() => {
        setActiveContentType(resolve());
    }, [response, preferredContentType]);

    const handleSelect = (ct: string) => {
        setActiveContentType(ct);
        setPreferredContentType(ct);
    };

    const schema = activeContentType ? response.content?.[activeContentType]?.schema as SchemaObject | undefined : undefined;

    return (
        <div className="space-y-4">
            {response.description && (
                <div className="prose dark:prose-invert max-w-none">
                    <FormattedMarkdown markdown={response.description} />
                </div>
            )}

            {response.headers && <HeaderViewer headers={response.headers} />}

            {response.links && Object.keys(response.links).length > 0 && (
                <ResponseLinks links={response.links} />
            )}

            {contentTypes.length > 0 ? (
                <div className="space-y-3">
                    {contentTypes.length > 1 ? (
                        <Select value={activeContentType} onValueChange={handleSelect}>
                            <SelectTrigger className="w-48 h-7 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {contentTypes.map(ct => (
                                    <SelectItem key={ct} value={ct} className="text-xs">{ct}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Badge variant="outline" className="text-xs font-mono">{contentTypes[0]}</Badge>
                    )}

                    {schema ? (
                        isEmptySchema(schema) ? (
                            <p className="text-sm text-muted-foreground italic">No schema defined.</p>
                        ) : (
                            <SchemaViewer
                                contentType={activeContentType}
                                schema={schema}
                                description={response.description}
                                examples={response.content?.[activeContentType]?.examples}
                                example={response.content?.[activeContentType]?.example}
                            />
                        )
                    ) : null}
                </div>
            ) : !response.headers && (
                <p className="text-sm text-muted-foreground italic">No response body.</p>
            )}
        </div>
    );
};

const ResponseViewer: React.FC<ResponseViewerProps> = ({responses}) => {
    const responseKeys = React.useMemo(() => responses ? Object.keys(responses) : [], [responses]);
    const [activeTab, setActiveTab] = React.useState<string>(responseKeys[0] ?? '');

    React.useEffect(() => {
        if (responseKeys.length > 0 && !responseKeys.includes(activeTab)) {
            setActiveTab(responseKeys[0] as string);
        }
    }, [responses, activeTab, responseKeys]);

    if (!responses || responseKeys.length === 0) return null;

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex-wrap justify-center gap-2 h-auto p-1 bg-muted">
                {Object.entries(responses).map(([code]) => {
                    const statusType = code.charAt(0) as keyof typeof STATUS_STYLES;
                    const styles = STATUS_STYLES[statusType] ?? STATUS_STYLES['5'];
                    return (
                        <TabsTrigger
                            key={code}
                            value={code}
                            className={cn(
                                "flex-1 transition-colors font-medium",
                                styles.base,
                                styles.hover,
                                activeTab === code && styles.active
                            )}
                        >
                            {code}
                        </TabsTrigger>
                    );
                })}
            </TabsList>

            {Object.entries(responses).map(([code, response]) => (
                <TabsContent key={code} value={code} className="mt-4">
                    <ResponseContent response={response} />
                </TabsContent>
            ))}
        </Tabs>
    );
};

export default ResponseViewer;
