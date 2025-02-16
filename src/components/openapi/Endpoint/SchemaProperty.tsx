import React from 'react';
import {OpenAPIV3} from 'openapi-types';
import {Badge} from "@/components/ui/badge";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {ChevronDown, ChevronRight} from 'lucide-react';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import {isNullableSchema, renderSchemaType} from "@/utils/openapi";
import ExternalDocsLink from "@/components/openapi/Endpoint/ExternalDocsLink";

interface SchemaPropertyProps {
    name?: string;
    schema: OpenAPIV3.SchemaObject;
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

    const isArrayOfObjects = schema.type === 'array' &&
        (schema.items as OpenAPIV3.SchemaObject).type === 'object';

    const hasChildren = (schema.type === 'object' && schema.properties) ||
        (schema.type === 'array' && schema.items &&
            (schema.items as OpenAPIV3.SchemaObject).properties) ||
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

    const renderEnumBadges = () => {
        if (!schema.enum) return null;

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
                            {name && (
                                <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                                    {name}{schema.type === 'array' && '[]'}
                                </span>
                            )}
                            <div className="flex flex-wrap gap-1 items-center">
                                {renderPropertyDetails()}
                            </div>
                        </div>
                        {(schema.description || schema.enum) && (
                            <div className="space-y-0">
                                {schema.description && (
                                    <FormattedMarkdown
                                        className="!text-xs !text-gray-600 dark:!text-gray-400"
                                        markdown={schema.description}
                                    />
                                )}
                                {renderEnumBadges()}
                            </div>
                        )}
                    </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="ml-6">
                    {schema.anyOf ? (
                        <div className="space-y-0 mt-2">
                            {schema.anyOf.map((subSchema: OpenAPIV3.SchemaObject, index) => {
                                if (isNullableSchema(subSchema)) {
                                    return (
                                        <div key={index} className="py-1">
                                            <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700">
                                                null
                                            </Badge>
                                        </div>
                                    );
                                }

                                return (
                                    <div className={"border-l-2 border-slate-200 dark:border-slate-700 pl-4"}>
                                        <SchemaProperty
                                            key={index}
                                            schema={subSchema}
                                            isRoot={false}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : schema.oneOf ? (
                        <div className="space-y-0 mt-2">
                            {schema.oneOf.map((subSchema, index) => (
                                <SchemaProperty
                                    key={index}
                                    schema={subSchema as OpenAPIV3.SchemaObject}
                                    isRoot={false}
                                />
                            ))}
                        </div>
                    ) : isArrayOfObjects ? (
                        <div className="space-y-0 mt-2">
                            {Object.entries((schema.items as OpenAPIV3.SchemaObject).properties || {})
                                .map(([propName, propSchema]) => (
                                    <div key={propName} className="border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                                        <SchemaProperty
                                            key={propName}
                                            name={propName}
                                            schema={propSchema as OpenAPIV3.SchemaObject}
                                            required={(schema.items as OpenAPIV3.SchemaObject)
                                                .required?.includes(propName)}
                                            isRoot={false}
                                        />
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <>
                            {schema.type === 'object' && schema.properties && (
                                <div className="space-y-0 mt-2">
                                    {Object.entries(schema.properties).map(([propName, propSchema]) => (
                                        <div key={propName} className={isRoot ? '' : 'border-l-2 border-slate-200 dark:border-slate-700 pl-4'}>
                                            <SchemaProperty
                                                key={propName}
                                                name={propName}
                                                schema={propSchema as OpenAPIV3.SchemaObject}
                                                required={schema.required?.includes(propName)}
                                                isRoot={false}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {schema.type === 'array' && schema.items &&
                                (schema.items as OpenAPIV3.SchemaObject).properties && (
                                    <div className="mt-2 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                                        <SchemaProperty
                                            schema={schema.items as OpenAPIV3.SchemaObject}
                                            isRoot={false}
                                        />
                                    </div>
                                )}
                        </>
                    )}
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
};

export default SchemaProperty;