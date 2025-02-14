import React from 'react';
import {OpenAPIV3} from 'openapi-types';
import {Badge} from "@/components/ui/badge";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import SchemaProperty from './SchemaProperty';
import { generateExample } from '@/utils/openapi';
import MediaTypeObject = OpenAPIV3.MediaTypeObject;

interface RequestBodyViewerProps {
    requestBody: OpenAPIV3.RequestBodyObject;
}

const ContentTypeTab: React.FC<{
    contentType: string;
    content: OpenAPIV3.MediaTypeObject;
    isActive: boolean;
}> = ({ contentType, isActive }) => {
    return (
        <TabsTrigger
            value={contentType}
            className={`text-sm ${isActive ? 'font-medium' : ''}`}
        >
            {contentType}
        </TabsTrigger>
    );
};

const RequestBodyViewer: React.FC<RequestBodyViewerProps> = ({ requestBody }) => {
    const contentTypes = Object.keys(requestBody.content);
    const [activeContentType, setActiveContentType] = React.useState<string>(contentTypes[0] as string);

    React.useEffect(() => {
        if (!contentTypes.includes(activeContentType)) {
            setActiveContentType(contentTypes[0] as string);
        }
    }, [contentTypes, activeContentType]);

    return (
        <div className="space-y-6">
            {requestBody.description && (
                <div className="prose dark:prose-invert max-w-none">
                    <FormattedMarkdown markdown={requestBody.description} />
                </div>
            )}

            <Tabs
                value={activeContentType}
                onValueChange={setActiveContentType}
                className="w-full"
            >
                {contentTypes.length > 1 && (
                    <TabsList className="w-full justify-center gap-2 h-auto p-1 bg-muted">
                        {contentTypes.map(contentType => (
                            <ContentTypeTab
                                key={contentType}
                                contentType={contentType}
                                content={requestBody.content[contentType] as MediaTypeObject}
                                isActive={activeContentType === contentType}
                            />
                        ))}
                    </TabsList>
                )}

                {contentTypes.map(contentType => {
                    const content = requestBody.content[contentType];
                    if (!content?.schema) return null;

                    return (
                        <TabsContent key={contentType} value={contentType} className="mt-4">
                            <div className="space-y-6">
                                {/* Schema */}
                                <div className="space-y-2">
                                    <h3 className="text-base font-medium dark:text-gray-100">Request Schema</h3>
                                    <div className="p-2 border rounded-lg border-slate-200 dark:border-slate-700 space-y-1">
                                        <SchemaProperty
                                            schema={content.schema as OpenAPIV3.SchemaObject}
                                            isRoot={true}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-base font-medium dark:text-gray-100">Example Request</h3>
                                    <div>
                                        <FormattedMarkdown
                                            markdown={`\`\`\`json\n${JSON.stringify(
                                                (content.schema as OpenAPIV3.SchemaObject).example || generateExample(content.schema as OpenAPIV3.SchemaObject),
                                                null,
                                                2
                                            )}\n\`\`\``}
                                            className="[&_code]:!whitespace-pre-wrap p-2 !border !rounded-lg !border-slate-200 dark:!border-slate-700"
                                        />
                                    </div>
                                </div>

                                {content.encoding && (
                                    <div className="space-y-2">
                                        <h3 className="text-base font-medium dark:text-gray-100">Encoding Information</h3>
                                        <div className="p-2 border rounded-lg border-slate-200 dark:border-slate-700">
                                            {Object.entries(content.encoding).map(([key, encoding]) => (
                                                <div key={key} className="space-y-1">
                                                    <h4 className="font-medium text-sm">{key}</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {encoding.contentType && (
                                                            <Badge variant="outline">
                                                                {encoding.contentType}
                                                            </Badge>
                                                        )}
                                                        {encoding.style && (
                                                            <Badge variant="outline">
                                                                style: {encoding.style}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
};

export default RequestBodyViewer;