import React from 'react';
import {Badge} from "@/components/ui/badge";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import SchemaProperty from './SchemaProperty';
import { generateExample } from '@/utils/openapi';
import {
    MediaTypeObject,
    RequestBodyObject,
    SchemaObject,
    ExampleObject
} from "@/types/unified-openapi-types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface RequestBodyViewerProps {
    requestBody: RequestBodyObject;
}

const ContentTypeTab: React.FC<{
    contentType: string;
    content: MediaTypeObject | undefined;
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

const ExamplesSelector: React.FC<{
    examples: Record<string, ExampleObject>;
    onSelect: (value: string) => void;
    selectedExample: string;
}> = ({ examples, onSelect, selectedExample }) => {
    return (
        <div className="mb-2">
            <Select defaultValue={selectedExample} onValueChange={onSelect}>
                <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select an example" />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(examples).map(([key, example]) => (
                        <SelectItem key={key} value={key}>
                            {example.summary || key}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

const RequestBodyViewer: React.FC<RequestBodyViewerProps> = ({ requestBody }) => {
    const contentTypes = Object.keys(requestBody.content);
    const firstContentType = contentTypes[0] as string;

    const [activeContentType, setActiveContentType] = React.useState<string>(firstContentType);
    const firstExample = requestBody.content[firstContentType]?.examples
        ? Object.keys(requestBody.content[firstContentType].examples)[0] || ''
        : '';
    const [selectedExample, setSelectedExample] = React.useState<string>(firstExample);

    React.useEffect(() => {
        if (!contentTypes.includes(activeContentType)) {
            setActiveContentType(firstContentType);
        }
    }, [contentTypes, activeContentType]);

    const getExampleValue = (content: MediaTypeObject) => {
        if (content.examples && selectedExample) {
            return content.examples[selectedExample]?.value;
        }
        if (content.example) {
            return content.example;
        }
        if (content.schema?.example) {
            return content.schema.example;
        }
        return generateExample(content.schema as SchemaObject);
    };

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
                                content={requestBody.content[contentType]}
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
                                <div className="space-y-2">
                                    <h3 className="text-base font-medium dark:text-gray-100">Request Schema</h3>
                                    <div className="p-2 border rounded-lg border-slate-200 dark:border-slate-700 space-y-1">
                                        <SchemaProperty
                                            schema={content.schema}
                                            isRoot={true}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-base font-medium dark:text-gray-100">Example Request</h3>
                                    {content.examples && Object.keys(content.examples).length > 0 && (
                                        <ExamplesSelector
                                            examples={content.examples}
                                            onSelect={setSelectedExample}
                                            selectedExample={selectedExample}
                                        />
                                    )}
                                    <div>
                                        <FormattedMarkdown
                                            markdown={JSON.stringify(getExampleValue(content), null, 2)}
                                            languageCode={'json'}
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