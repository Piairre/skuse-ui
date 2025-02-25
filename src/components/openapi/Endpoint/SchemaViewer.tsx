import React from 'react';
import { Badge } from "@/components/ui/badge";
import {renderSchemaType} from "@/utils/openapi";
import { SchemaObject } from '@/types/unified-openapi-types';

interface SchemaViewerProps {
    schema: SchemaObject;
    name?: string;
    required?: boolean;
}

const SchemaViewer: React.FC<SchemaViewerProps> = ({ schema, name, required }) => {
    const renderPropertyContent = () => {
        if (schema.type === 'object' && schema.properties) {
            return Object.entries(schema.properties).map(([propName, propSchema]) => (
                <div key={propName} className="mt-2">
                    <SchemaViewer
                        schema={propSchema}
                        name={propName}
                        required={schema.required?.includes(propName)}
                    />
                </div>
            ));
        }

        if (schema.type === 'array' && schema.items) {
            return (
                <div className="mt-2">
                    <SchemaViewer
                        schema={schema.items}
                        name="Item"
                    />
                </div>
            );
        }

        return null;
    };

    const renderPropertyHeader = () => (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                {name && <span className="font-mono">{name}</span>}
                <Badge variant="outline" className="text-xs">
                    {renderSchemaType(schema)}
                </Badge>
                {required && (
                    <Badge variant="outline" className="bg-red-50 text-xs">
                        required
                    </Badge>
                )}
                {schema.format && (
                    <Badge variant="outline" className="bg-blue-50 text-xs">
                        {schema.format}
                    </Badge>
                )}
                {schema.pattern && (
                    <Badge variant="outline" className="bg-purple-50 text-xs">
                        pattern: {schema.pattern}
                    </Badge>
                )}
                {schema.default !== undefined && (
                    <Badge variant="outline" className="bg-gray-50 text-xs">
                        default: {String(schema.default)}
                    </Badge>
                )}
            </div>
            {schema.description && (
                <p className="text-sm text-gray-600 ml-4">{schema.description}</p>
            )}
            {schema.enum && (
                <div className="flex gap-1 ml-4 mt-1 flex-wrap">
                    <span className="text-sm text-gray-600">Enum:</span>
                    {schema.enum.map((value, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                            {String(value)}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="py-1">
            {renderPropertyHeader()}
            <div className="ml-4">
                {renderPropertyContent()}
            </div>
        </div>
    );
};

export default SchemaViewer;