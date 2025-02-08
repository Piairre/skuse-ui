import React from 'react';
import { OpenAPIV3 } from 'openapi-types';
import { Badge } from "@/components/ui/badge";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import SchemaViewer from "./SchemaViewer";

interface ParametersViewerProps {
    parameters: OpenAPIV3.ParameterObject[];
    resolveReferences: (ref: any, spec: OpenAPIV3.Document) => any;
    spec: OpenAPIV3.Document;
}

const ParametersViewer: React.FC<ParametersViewerProps> = ({ parameters, resolveReferences, spec }) => {
    const paramsByType = parameters.reduce((acc, param) => {
        const type = param.in;
        if (!acc[type]) acc[type] = [];
        acc[type].push(param);
        return acc;
    }, {} as Record<string, OpenAPIV3.ParameterObject[]>);

    return (
        <div className="space-y-8">
            {Object.entries(paramsByType).map(([type, params]) => (
                <div key={type} className="space-y-4">
                    <h3 className="text-lg font-medium capitalize">{type} Parameters</h3>
                    <div className="space-y-6">
                        {params.map(param => {
                            const schema = param.schema
                                ? resolveReferences(param.schema, spec) as OpenAPIV3.SchemaObject
                                : null;

                            return (
                                <div key={param.name} className="space-y-2 border-b pb-4 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono">{param.name}</span>
                                        {param.required && (
                                            <Badge variant="outline" className="bg-red-50">
                                                required
                                            </Badge>
                                        )}
                                        {param.deprecated && (
                                            <Badge variant="outline" className="bg-yellow-50">
                                                deprecated
                                            </Badge>
                                        )}
                                        {schema?.type && (
                                            <Badge variant="outline">
                                                {schema.type}
                                            </Badge>
                                        )}
                                    </div>

                                    {param.description && (
                                        <div className="text-sm text-gray-600">
                                            <FormattedMarkdown markdown={param.description} />
                                        </div>
                                    )}

                                    {schema && (
                                        <div className="bg-slate-50 p-4 rounded-lg">
                                            <SchemaViewer schema={schema} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ParametersViewer;