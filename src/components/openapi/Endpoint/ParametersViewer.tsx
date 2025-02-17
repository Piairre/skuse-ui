import React from 'react';
import {Badge} from "@/components/ui/badge";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {ChevronDown, ChevronRight} from 'lucide-react';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import { renderSchemaType } from '@/utils/openapi';
import {ParameterObject, SchemaObject} from "@/types/unified-openapi-types";

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
            className="flex items-center gap-1.5 py-2"
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
    if (schema.type === 'array' && schema.items) {
        const itemSchema = schema.items as SchemaObject;
        return (
            <div className="space-y-1 mt-2">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Array items:
                </div>
                {itemSchema.type === 'object' && itemSchema.properties && (
                    Object.entries(itemSchema.properties).map(([propName, propSchema]) => (
                        <div key={propName} className="border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                            <ParameterProperty
                                parameter={{
                                    name: propName,
                                    in: parameterLocation,
                                    schema: propSchema as SchemaObject,
                                    required: itemSchema.required?.includes(propName)
                                }}
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
                    <div key={propName} className="border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                        <ParameterProperty
                            parameter={{
                                name: propName,
                                in: parameterLocation,
                                schema: propSchema as SchemaObject,
                                required: schema.required?.includes(propName)
                            }}
                            isRoot={false}
                        />
                    </div>
                ))}
            </div>
        );
    }

    if (schema.oneOf) {
        return (
            <div className="space-y-1 mt-2">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    One of:
                </div>
                {schema.oneOf.map((subSchema, index) => (
                    <div key={index} className="border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                        <ParameterProperty
                            parameter={{
                                name: `option${index + 1}`,
                                in: parameterLocation,
                                schema: subSchema as SchemaObject
                            }}
                            isRoot={false}
                        />
                    </div>
                ))}
            </div>
        );
    }

    if (schema.anyOf) {
        return (
            <div className="space-y-1 mt-2">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Any of:
                </div>
                {schema.anyOf.map((subSchema, index) => (
                    <div key={index} className="border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                        <ParameterProperty
                            parameter={{
                                name: `option${index + 1}`,
                                in: parameterLocation,
                                schema: subSchema as SchemaObject
                            }}
                            isRoot={false}
                        />
                    </div>
                ))}
            </div>
        );
    }

    if (schema.allOf) {
        return (
            <div className="space-y-1 mt-2">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    All of:
                </div>
                {schema.allOf.map((subSchema, index) => (
                    <div key={index} className="border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                        <ParameterProperty
                            parameter={{
                                name: `condition${index + 1}`,
                                in: parameterLocation,
                                schema: subSchema as SchemaObject
                            }}
                            isRoot={false}
                        />
                    </div>
                ))}
            </div>
        );
    }

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

    const renderPropertyDetails = (): JSX.Element[] => {
        const details: JSX.Element[] = [];

        // Type badge
        if (schema) {
            details.push(
                <Badge key="type" variant="outline" className="text-xs border-slate-200 dark:border-slate-700">
                    {renderSchemaType(schema)}
                </Badge>
            );
        }

        // Required badge
        if (parameter.required) {
            details.push(
                <Badge key="required" variant="outline"
                       className="text-xs bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
                    required
                </Badge>
            );
        }

        if (schema) {
            if (schema.format) {
                details.push(
                    <Badge key="format" variant="outline"
                           className="text-xs bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
                        {schema.format}
                    </Badge>
                );
            }

            if (schema.default !== undefined) {
                details.push(
                    <Badge key="default" variant="outline"
                           className="text-xs bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800">
                        default: {JSON.stringify(schema.default)}
                    </Badge>
                );
            }

            // TODO: Add more badges here
        }

        return details;
    };

    const renderEnumBadges = () => {
        if (!schema?.enum) return null;

        return (
            <div className="flex flex-wrap items-center gap-1 mt-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">enum:</span>
                {schema.enum.map((value) => (
                    <Badge
                        key={value}
                        variant="outline"
                        className="text-xs bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800"
                    >
                        {value}
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
                        <div className="text-gray-500 dark:text-gray-400 mt-1">
                            {isOpen ?
                                <ChevronDown className="h-4 w-4" /> :
                                <ChevronRight className="h-4 w-4" />
                            }
                        </div>
                    )}
                    <div className="flex flex-col gap-1 text-left">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                                {parameter.name}
                            </span>
                            <div className="flex flex-wrap gap-1 items-center">
                                {renderPropertyDetails()}
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