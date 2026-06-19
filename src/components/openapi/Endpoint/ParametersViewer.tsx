import React from 'react';
import {Badge} from "@/components/ui/badge";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {ChevronRight} from 'lucide-react';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import {ParameterObject, SchemaObject} from "@/types/unified-openapi-types";
import SchemaBadges from "@/components/openapi/Endpoint/SchemaBadges";

type ParameterLocation = 'query' | 'path' | 'header' | 'cookie';

const LOCATION_ORDER: ParameterLocation[] = ['path', 'query', 'header', 'cookie'];

const LOCATION_STYLES: Record<ParameterLocation, string> = {
    path:   'border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40',
    query:  'border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40',
    header: 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40',
    cookie: 'border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/40',
};

interface ParametersViewerProps {
    parameters: ParameterObject[];
}

const NestedProperties: React.FC<{
    schema: SchemaObject;
    parameterLocation: ParameterLocation;
}> = ({ schema, parameterLocation }) => {
    const renderCompositeSchemas = (schemas: SchemaObject[], label: string, namePrefix: string) => (
        <div className="space-y-1 mt-2">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">{label}</div>
            {schemas.map((subSchema, index) => (
                <div key={index} className="border-l-2 border-slate-300 dark:border-slate-600 pl-4">
                    <ParameterProperty
                        parameter={{ name: `${namePrefix}${index + 1}`, in: parameterLocation, schema: subSchema }}
                        isRoot={false}
                    />
                </div>
            ))}
        </div>
    );

    if (schema.type === 'array' && schema.items) {
        const itemSchema = schema.items;
        return (
            <div className="space-y-1 mt-2">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Array items:</div>
                {itemSchema.type === 'object' && itemSchema.properties && (
                    Object.entries(itemSchema.properties).map(([propName, propSchema]) => (
                        <div key={propName} className="border-l-2 border-slate-300 dark:border-slate-600 pl-4">
                            <ParameterProperty
                                parameter={{ name: propName, in: parameterLocation, schema: propSchema, required: itemSchema.required?.includes(propName) }}
                                isRoot={false}
                            />
                        </div>
                    ))
                )}
            </div>
        );
    }

    if (schema.type === 'object' && schema.properties) {
        return (
            <div className="space-y-1 mt-2">
                {Object.entries(schema.properties).map(([propName, propSchema]) => (
                    <div key={propName} className="border-l-2 border-slate-300 dark:border-slate-600 pl-4">
                        <ParameterProperty
                            parameter={{ name: propName, in: parameterLocation, schema: propSchema, required: schema.required?.includes(propName) }}
                            isRoot={false}
                        />
                    </div>
                ))}
            </div>
        );
    }

    if (schema.oneOf) return renderCompositeSchemas(schema.oneOf, 'One of:', 'option');
    if (schema.anyOf) return renderCompositeSchemas(schema.anyOf, 'Any of:', 'option');
    if (schema.allOf) return renderCompositeSchemas(schema.allOf, 'All of:', 'condition');

    return null;
};

const ParameterProperty: React.FC<{
    parameter: ParameterObject;
    isRoot?: boolean;
}> = ({ parameter, isRoot = false }) => {
    const [isOpen, setIsOpen] = React.useState(isRoot);
    const schema = parameter.schema;
    const location = parameter.in as ParameterLocation;

    const hasChildren =
        (schema?.type === 'object' && !!schema.properties) ||
        (schema?.type === 'array' && Array.isArray(schema.items) && schema.items.length > 0) ||
        (Array.isArray(schema?.oneOf) && schema.oneOf.length > 0) ||
        (Array.isArray(schema?.anyOf) && schema.anyOf.length > 0) ||
        (Array.isArray(schema?.allOf) && schema.allOf.length > 0);

    const renderEnumBadges = () => {
        if (!schema?.enum) return null;
        return (
            <div className="flex flex-wrap items-center gap-1 mt-1" onClick={e => e.stopPropagation()}>
                <span className="text-xs text-gray-600 dark:text-gray-400">enum:</span>
                {schema.enum.map((value, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800">
                        {JSON.stringify(value)}
                    </Badge>
                ))}
            </div>
        );
    };

    const isDeprecated = parameter.deprecated === true;

    const inner = (
        <div className={`flex flex-col gap-1 text-left ${isDeprecated ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-mono text-sm text-gray-900 dark:text-gray-100 ${isDeprecated ? 'line-through' : ''}`}>
                    {parameter.name}{parameter.required && <span className="text-red-500 ml-0.5">*</span>}
                </span>
                {isDeprecated && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal border-slate-300 text-slate-500">
                        deprecated
                    </Badge>
                )}
                {isRoot && location && LOCATION_STYLES[location] && (
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 font-normal ${LOCATION_STYLES[location]}`}>
                        {location}
                    </Badge>
                )}
                <div className="flex flex-wrap gap-1 items-center">
                    {schema && <SchemaBadges schema={schema} />}
                </div>
            </div>
            {(parameter.description || schema?.enum) && (
                <div className="space-y-1" onClick={e => e.stopPropagation()}>
                    {parameter.description && (
                        <FormattedMarkdown
                            className="!text-xs !text-gray-600 dark:!text-gray-400"
                            markdown={parameter.description}
                        />
                    )}
                    {renderEnumBadges()}
                </div>
            )}
        </div>
    );

    return (
        <div className="py-1">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                {hasChildren ? (
                    <>
                        <CollapsibleTrigger className="group flex items-start gap-2 w-full hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded">
                            <ChevronRight className="h-4 w-4 mt-1 shrink-0 text-gray-500 dark:text-gray-400 group-data-[state=open]:rotate-90 transition-transform" />
                            {inner}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="ml-6">
                            <NestedProperties schema={schema!} parameterLocation={location} />
                        </CollapsibleContent>
                    </>
                ) : (
                    <div className="flex items-start gap-2 p-2">
                        <div className="w-4 shrink-0" />
                        {inner}
                    </div>
                )}
            </Collapsible>
        </div>
    );
};

const ParametersViewer: React.FC<ParametersViewerProps> = ({ parameters }) => {
    const sorted = React.useMemo(() =>
        [...parameters].sort((a, b) =>
            LOCATION_ORDER.indexOf(a.in as ParameterLocation) - LOCATION_ORDER.indexOf(b.in as ParameterLocation)
        ),
    [parameters]);

    if (parameters.length === 0) {
        return (
            <div className="text-sm text-muted-foreground p-4 text-center bg-slate-50 dark:bg-slate-800 rounded-lg">
                No parameters required for this endpoint.
            </div>
        );
    }

    return (
        <div className="divide-y divide-border/60">
            {sorted.map((parameter, index) => (
                <ParameterProperty
                    key={`${parameter.name}-${index}`}
                    parameter={parameter}
                    isRoot={true}
                />
            ))}
        </div>
    );
};

export default ParametersViewer;
