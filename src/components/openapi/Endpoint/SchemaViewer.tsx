import React, { useState } from 'react';
import { generateExample } from "@/utils/openapi";
import {ExampleObject, SchemaObject} from '@/types/unified-openapi-types';
import SchemaProperty from "@/components/openapi/Endpoint/SchemaProperty";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface SchemaViewerProps {
    schema: SchemaObject;
    contentType: string;
    description?: string;
    examples?: { [key: string]: ExampleObject };
}

const SchemaViewer: React.FC<SchemaViewerProps> = ({ schema, examples }) => {
    const [selectedExample, setSelectedExample] = useState<string | null>(() : string | null => {
        if (!examples || Object.keys(examples).length === 0) return null;
        return Object.keys(examples)[0] || null;
    });

    const getExampleValue = () => {
        if (examples && selectedExample) {
            return examples[selectedExample]?.value;
        }
        return schema?.example || generateExample(schema);
    };

    return (
        <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
                <h3 className="text-base font-medium dark:text-gray-100">Response Schema</h3>
                <div className="p-2 border rounded-lg border-slate-200 dark:border-slate-700 space-y-1">
                    <SchemaProperty schema={schema} isRoot={true} />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium dark:text-gray-100">Example Response</h3>
                    {examples && Object.keys(examples).length > 1 && (
                        <Select
                            value={selectedExample || undefined}
                            onValueChange={setSelectedExample}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Select example" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(examples).map((key) => (
                                    <SelectItem key={key} value={key}>
                                        Example {key}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <div>
                    <FormattedMarkdown
                        markdown={
                            typeof getExampleValue() === 'string'
                            ? getExampleValue()
                            : JSON.stringify(getExampleValue(), null, 2)}
                        languageCode={'json'}
                        className="[&_code]:!whitespace-pre-wrap p-2 !border !rounded-lg !border-slate-200 dark:!border-slate-700"
                    />
                </div>
            </div>
        </div>
    );
};

export default SchemaViewer;