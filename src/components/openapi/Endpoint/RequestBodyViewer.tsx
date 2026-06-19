import React from 'react';
import { useOpenAPIContext } from '@/hooks/OpenAPIContext';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import SchemaProperty from './SchemaProperty';
import { generateExample } from '@/utils/openapi';
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { SchemaExpandContext } from "@/components/openapi/Endpoint/SchemaExpandContext";
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
import { Badge } from "@/components/ui/badge";

interface RequestBodyViewerProps {
    requestBody: RequestBodyObject;
}

const ExamplesSelector: React.FC<{
    examples: Record<string, ExampleObject>;
    onSelect: (value: string) => void;
    selectedExample: string;
}> = ({ examples, onSelect, selectedExample }) => (
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

const RequestBodyViewer: React.FC<RequestBodyViewerProps> = ({ requestBody }) => {
    const { preferredContentType, setPreferredContentType } = useOpenAPIContext();
    const contentTypes = Object.keys(requestBody.content);
    const firstContentType = contentTypes[0] as string;

    const resolve = () => preferredContentType && contentTypes.includes(preferredContentType)
        ? preferredContentType
        : firstContentType;

    const [activeContentType, setActiveContentType] = React.useState<string>(resolve);
    const firstExample = requestBody.content[firstContentType]?.examples
        ? Object.keys(requestBody.content[firstContentType].examples)[0] || ''
        : '';
    const [selectedExample, setSelectedExample] = React.useState<string>(firstExample);
    const [expandState, setExpandState] = React.useState<{ version: number; allOpen: boolean }>({ version: 0, allOpen: false });

    React.useEffect(() => {
        setActiveContentType(resolve());
    }, [preferredContentType, firstContentType]);

    const handleSelect = (ct: string) => {
        setActiveContentType(ct);
        setPreferredContentType(ct);
    };

    const content = requestBody.content[activeContentType] as MediaTypeObject | undefined;

    const getExampleValue = (ct: MediaTypeObject) => {
        if (ct.examples && selectedExample) return ct.examples[selectedExample]?.value;
        if (ct.example) return ct.example;
        if (ct.schema?.example) return ct.schema.example;
        return generateExample(ct.schema as SchemaObject);
    };

    return (
        <div className="space-y-6">
            {requestBody.description && (
                <div className="prose dark:prose-invert max-w-none">
                    <FormattedMarkdown markdown={requestBody.description} />
                </div>
            )}

            <div className="flex items-center gap-3">
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
                    <Badge variant="outline" className="text-xs font-mono">{firstContentType}</Badge>
                )}
                {requestBody.required && (
                    <Badge variant="outline" className="text-xs bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">required</Badge>
                )}
            </div>

            {content?.schema && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-foreground">Schema</h4>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setExpandState(s => ({ version: s.version + 1, allOpen: true }))}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <ChevronsUpDown className="h-3.5 w-3.5" />
                                Expand all
                            </button>
                            <button
                                onClick={() => setExpandState(s => ({ version: s.version + 1, allOpen: false }))}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <ChevronsDownUp className="h-3.5 w-3.5" />
                                Collapse all
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <SchemaExpandContext.Provider value={expandState}>
                            <SchemaProperty schema={content.schema} isRoot={true} />
                        </SchemaExpandContext.Provider>
                    </div>
                </div>
            )}

            {content && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Example</h4>
                    {content.examples && Object.keys(content.examples).length > 0 && (
                        <ExamplesSelector
                            examples={content.examples}
                            onSelect={setSelectedExample}
                            selectedExample={selectedExample}
                        />
                    )}
                    <FormattedMarkdown
                        markdown={JSON.stringify(getExampleValue(content), null, 2)}
                        languageCode="json"
                        className="[&_code]:!whitespace-pre-wrap"
                    />
                </div>
            )}

            {content?.encoding && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Encoding</h4>
                    <div className="p-2 border rounded-lg border-slate-200 dark:border-slate-700">
                        {Object.entries(content.encoding).map(([key, encoding]) => (
                            <div key={key} className="space-y-1">
                                <h5 className="font-medium text-sm">{key}</h5>
                                <div className="flex flex-wrap gap-2">
                                    {encoding.contentType && <Badge variant="outline">{encoding.contentType}</Badge>}
                                    {encoding.style && <Badge variant="outline">style: {encoding.style}</Badge>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestBodyViewer;
