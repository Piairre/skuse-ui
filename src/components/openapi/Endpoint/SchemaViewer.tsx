import React from 'react';
import { OpenAPIV3 } from 'openapi-types';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";

interface SchemaViewerProps {
    schema: OpenAPIV3.SchemaObject;
}

const SchemaViewer: React.FC<SchemaViewerProps> = ({ schema }) => {
    if (!schema) return null;

    const formatSchema = (schema: OpenAPIV3.SchemaObject): any => {
        if (schema.type === 'object' && schema.properties) {
            return Object.fromEntries(
                Object.entries(schema.properties).map(([key, prop]) => [
                    key,
                    typeof prop === 'object' && 'type' in prop
                        ? formatSchema(prop as OpenAPIV3.SchemaObject)
                        : prop,
                ])
            );
        }
        return schema.type || 'unknown';
    };

    const jsonSchema = JSON.stringify(formatSchema(schema), null, 2);

    return <FormattedMarkdown markdown={`\`\`\`json\n${jsonSchema}\n\`\`\``} />;
};

export default SchemaViewer;
