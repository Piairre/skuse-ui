import React, { useState } from 'react';
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
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
import { SchemaExpandContext } from "@/components/openapi/Endpoint/SchemaExpandContext";

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

    const [expandState, setExpandState] = useState<{ version: number; allOpen: boolean }>({ version: 0, allOpen: false });

    const getExampleValue = () => {
        if (examples && selectedExample) {
            return examples[selectedExample]?.value;
        }
        return schema?.example || generateExample(schema);
    };

    return (
        <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium text-foreground">Response Schema</h3>
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
                <div className="p-2 border rounded-lg border-slate-200 dark:border-slate-700 space-y-1">
                    <SchemaExpandContext.Provider value={expandState}>
                        <SchemaProperty schema={schema} isRoot={true} />
                    </SchemaExpandContext.Provider>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium text-foreground">Example Response</h3>
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
                    {(() => {
                        const val = getExampleValue();
                        return (
                            <FormattedMarkdown
                                markdown={typeof val === 'string' ? val : JSON.stringify(val, null, 2)}
                                languageCode={'json'}
                                className="[&_code]:!whitespace-pre-wrap p-2 !border !rounded-lg !border-slate-200 dark:!border-slate-700"
                            />
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

export default SchemaViewer;
