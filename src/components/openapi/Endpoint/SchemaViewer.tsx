import React from 'react';
import {generateExample} from "@/utils/openapi";
import { SchemaObject } from '@/types/unified-openapi-types';
import SchemaProperty from "@/components/openapi/Endpoint/SchemaProperty";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";

interface SchemaViewerProps {
    schema: SchemaObject;
    contentType: string;
    description?: string;
}

const SchemaViewer: React.FC<SchemaViewerProps> = ({ schema }) => {
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
                        markdown={JSON.stringify(schema?.example || generateExample(schema), null, 2)}
                        languageCode={'json'}
                        className="[&_code]:!whitespace-pre-wrap p-2 !border !rounded-lg !border-slate-200 dark:!border-slate-700"
                    />
                </div>
            </div>
        </div>
    );
};

export default SchemaViewer;