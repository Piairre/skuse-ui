import React from 'react';
import {Badge} from "@/components/ui/badge";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {ChevronRight} from 'lucide-react';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import {isNullableSchema, renderSchemaType} from "@/utils/openapi";
import {SchemaObject} from "@/types/unified-openapi-types";
import ExternalDocsLink from "@/components/openapi/Endpoint/ExternalDocsLink";

interface SchemaPropertyProps {
    name?: string;
    schema: SchemaObject;
    required?: boolean;
    isRoot?: boolean;
}

const SchemaProperty: React.FC<SchemaPropertyProps> = ({
                                                           name,
                                                           schema,
                                                           required,
                                                           isRoot = false
                                                       }) => {
    const [isOpen, setIsOpen] = React.useState(isRoot);

    const isArrayType = schema.type === 'array';
    const isObjectType = !schema.type && schema.properties;
    const hasProperties = schema.properties || (isArrayType && schema.items && (schema.items as SchemaObject).properties);
    const hasChildren = hasProperties || schema.items ||
        (schema.oneOf && schema.oneOf.length > 0) ||
        (schema.anyOf && schema.anyOf.length > 0);

    const renderPropertyDetails = (): JSX.Element[] => {
        const details: JSX.Element[] = [];

        details.push(
            <Badge key="type" variant="outline" className="text-xs border-slate-200 dark:border-slate-700">
                {renderSchemaType(schema)}
            </Badge>
        );

        if (required) {
            details.push(
                <Badge key="required" variant="outline"
                       className="text-xs bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
                    required
                </Badge>
            );
        }

        if (schema.format) {
            details.push(
                <Badge key="format" variant="outline"
                       className="text-xs bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
                    {schema.format}
                </Badge>
            );
        }

        if (schema.deprecated) {
            details.push(
                <Badge key="deprecated" variant="outline"
                       className="text-xs bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800">
                    deprecated
                </Badge>
            );
        }

        if (schema.readOnly) {
            details.push(
                <Badge key="readonly" variant="outline"
                       className="text-xs bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800">
                    readonly
                </Badge>
            );
        }

        if (schema.externalDocs?.url) {
            details.push(<ExternalDocsLink key="external-docs" url={schema.externalDocs.url} />);
        }

        return details;
    };

    const renderPropertyContent = () => {
        if (schema.oneOf) {
            return (
                <div className="pl-4">
                    {schema.oneOf.map((subSchema: SchemaObject, index) => (
                        <div key={index} className="mt-2">
                            <Collapsible>
                                <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded group">
                                    <ChevronRight className="h-4 w-4 group-data-[state=open]:rotate-90 transition-transform" />
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                Option {index + 1}
                                            </Badge>
                                            {subSchema.description && (
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {subSchema.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="ml-6 mt-2">
                                    {subSchema.properties && (
                                        <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                                            {Object.entries(subSchema.properties).map(([propName, propSchema]) => (
                                                <SchemaProperty
                                                    key={propName}
                                                    name={propName}
                                                    schema={propSchema}
                                                    required={subSchema.required?.includes(propName)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    ))}
                </div>
            );
        }

        if (isObjectType || (schema.type === 'object' && schema.properties)) {
            const properties = schema.properties || {};
            return (
                <div className="pl-4">
                    {Object.entries(properties).map(([propName, propSchema]) => (
                        <div key={propName} className="border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                            <SchemaProperty
                                name={propName}
                                schema={propSchema}
                                required={schema.required?.includes(propName)}
                            />
                        </div>
                    ))}
                </div>
            );
        }

        if (isArrayType && schema.items) {
            const itemSchema = schema.items as SchemaObject;
            return (
                <div className="pl-4">
                    <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                        {itemSchema.type === 'object' || itemSchema.properties ? (
                            Object.entries(itemSchema.properties || {}).map(([propName, propSchema]) => (
                                <SchemaProperty
                                    key={propName}
                                    name={propName}
                                    schema={propSchema}
                                    required={itemSchema.required?.includes(propName)}
                                />
                            ))
                        ) : (
                            <SchemaProperty
                                schema={itemSchema}
                                isRoot={false}
                            />
                        )}
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="py-1">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger className="group flex items-start gap-2 w-full hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded">
                    {hasChildren && (
                        <ChevronRight className="h-4 w-4 mt-1 group-data-[state=open]:rotate-90 transition-transform" />
                    )}
                    <div className="flex flex-col gap-1 text-left">
                        <div className="flex items-center gap-2">
                            {name && (
                                <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                                    {name}{isArrayType && '[]'}
                                </span>
                            )}
                            <div className="flex flex-wrap gap-1 items-center">
                                {renderPropertyDetails()}
                            </div>
                        </div>
                        {schema.description && (
                            <FormattedMarkdown
                                className="!text-xs !text-gray-600 dark:!text-gray-400"
                                markdown={schema.description}
                            />
                        )}
                    </div>
                </CollapsibleTrigger>
                {hasChildren && (
                    <CollapsibleContent className="mt-2">
                        {renderPropertyContent()}
                    </CollapsibleContent>
                )}
            </Collapsible>
        </div>
    );
};

export default SchemaProperty;