import React from 'react';
import {Badge} from "@/components/ui/badge";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {ChevronRight} from 'lucide-react';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import {ParameterObject, SchemaObject} from "@/types/unified-openapi-types";
import SchemaBadges from "@/components/openapi/Endpoint/SchemaBadges";

type ParameterLocation = 'query' | 'path' | 'header' | 'cookie';

interface ParametersViewerProps {
    parameters: ParameterObject[];
}

const LocationTab: React.FC<{
    location: ParameterLocation;
    isActive: boolean;
    count: number;
}> = ({ location, count }) => {
    return (
        <TabsTrigger
            value={location}
            className="flex-1 flex items-center gap-1.5 py-2"
        >
            <div className="relative ps-0.5">
                <span className="capitalize">{location}</span>
                <Badge
                    variant="outline"
                    className="ml-0.5 translate-y-[-8px] px-1 py-0 text-[10px] min-w-[16px] h-3.5 inline-flex items-center justify-center leading-none"
                >
                    {count}
                </Badge>
            </div>
        </TabsTrigger>
    );
};

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

    const hasChildren =
        (schema?.type === 'object' && !!schema.properties) ||
        (schema?.type === 'array' && Array.isArray(schema.items) && schema.items.length > 0) ||
        (Array.isArray(schema?.oneOf) && schema.oneOf.length > 0) ||
        (Array.isArray(schema?.anyOf) && schema.anyOf.length > 0) ||
        (Array.isArray(schema?.allOf) && schema.allOf.length > 0);


    const renderEnumBadges = () => {
        if (!schema?.enum) return null;

        return (
            <div className="flex flex-wrap items-center gap-1 mt-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">enum:</span>
                {schema.enum.map((value, i) => (
                    <Badge
                        key={i}
                        variant="outline"
                        className="text-xs bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800"
                    >
                        {JSON.stringify(value)}
                    </Badge>
                ))}
            </div>
        );
    };

    return (
        <div className="py-1">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger className="group flex items-start gap-2 w-full hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded">
                    {hasChildren && (
                        <ChevronRight className="h-4 w-4 mt-1 shrink-0 text-gray-500 dark:text-gray-400 group-data-[state=open]:rotate-90 transition-transform" />
                    )}
                    <div className="flex flex-col gap-1 text-left">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                                {parameter.name}{parameter.required && <span className="text-red-500 ml-0.5">*</span>}
                            </span>
                            <div className="flex flex-wrap gap-1 items-center">
                                {schema && <SchemaBadges schema={schema} />}
                            </div>
                        </div>
                        {(parameter.description || schema?.enum) && (
                            <div className="space-y-1">
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
                </CollapsibleTrigger>

                {hasChildren && schema && (
                    <CollapsibleContent className="ml-6">
                        <NestedProperties schema={schema} parameterLocation={parameter.in as ParameterLocation} />
                    </CollapsibleContent>
                )}
            </Collapsible>
        </div>
    );
};

const ParametersViewer: React.FC<ParametersViewerProps> = ({ parameters }) => {
    const groupedParameters = React.useMemo(() => {
        return parameters.reduce((acc, param) => {
            const location = param.in as ParameterLocation;
            if (!acc[location]) {
                acc[location] = [];
            }
            acc[location].push(param);
            return acc;
        }, {} as Record<ParameterLocation, ParameterObject[]>);
    }, [parameters]);

    const locations = Object.keys(groupedParameters) as ParameterLocation[];
    const defaultLocation = locations[0];
    const [activeLocation, setActiveLocation] = React.useState<ParameterLocation | null>(defaultLocation || null);

    React.useEffect(() => {
        if (!locations.includes(activeLocation as ParameterLocation) && locations.length > 0) {
            setActiveLocation(locations[0] as ParameterLocation);
        }
    }, [locations, activeLocation]);

    if (parameters.length === 0) {
        return (
            <div className="text-sm text-muted-foreground p-4 text-center bg-slate-50 dark:bg-slate-800 rounded-lg">
                No parameters required for this endpoint.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Tabs value={activeLocation || ''} onValueChange={(value) => setActiveLocation(value as ParameterLocation)} className="w-full">
                <TabsList className="w-full justify-center gap-2 h-auto p-1 bg-muted">
                    {locations.map((location) => (
                        <LocationTab
                            key={location}
                            location={location}
                            isActive={activeLocation === location}
                            count={groupedParameters[location].length}
                        />
                    ))}
                </TabsList>

                {locations.map((location) => (
                    <TabsContent key={location} value={location}>
                        {groupedParameters[location].map((parameter, index) => (
                            <ParameterProperty
                                key={`${parameter.name}-${index}`}
                                parameter={parameter}
                                isRoot={true}
                            />
                        ))}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
};

export default ParametersViewer;