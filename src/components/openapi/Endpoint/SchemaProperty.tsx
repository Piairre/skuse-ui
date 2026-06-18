import React from 'react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from 'lucide-react';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import { renderSchemaType, flattenSchema } from "@/utils/openapi";
import { SchemaObject } from "@/types/unified-openapi-types";
import SchemaBadges from "@/components/openapi/Endpoint/SchemaBadges";
import { SchemaExpandContext } from "@/components/openapi/Endpoint/SchemaExpandContext";

interface SchemaPropertyProps {
    name?: string;
    schema: SchemaObject;
    required?: boolean;
    isRoot?: boolean;
    depth?: number;
}

const DEPTH_STYLES = [
    {
        border: 'border-l-slate-300 dark:border-l-slate-600',
        openBg: 'bg-slate-50 dark:bg-slate-800/50',
        separator: 'border-b-slate-200 dark:border-b-slate-700',
    },
    {
        border: 'border-l-blue-300 dark:border-l-blue-700',
        openBg: 'bg-blue-50/50 dark:bg-blue-950/25',
        separator: 'border-b-blue-200 dark:border-b-blue-800',
    },
    {
        border: 'border-l-violet-300 dark:border-l-violet-700',
        openBg: 'bg-violet-50/50 dark:bg-violet-950/25',
        separator: 'border-b-violet-200 dark:border-b-violet-800',
    },
    {
        border: 'border-l-emerald-300 dark:border-l-emerald-700',
        openBg: 'bg-emerald-50/50 dark:bg-emerald-950/25',
        separator: 'border-b-emerald-200 dark:border-b-emerald-800',
    },
    {
        border: 'border-l-amber-300 dark:border-l-amber-700',
        openBg: 'bg-amber-50/50 dark:bg-amber-950/25',
        separator: 'border-b-amber-200 dark:border-b-amber-800',
    },
] as const;

const getDepthStyle = (depth: number) => DEPTH_STYLES[depth % DEPTH_STYLES.length]!;

const isExpandable = (schema: SchemaObject): boolean =>
    !!schema.properties ||
    schema.type === 'object' ||
    (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) ||
    (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) ||
    (Array.isArray(schema.allOf) && schema.allOf.length > 0);

const mergeAllOf = (schemas: SchemaObject[]): { properties: Record<string, SchemaObject>; required: string[] } => {
    const properties: Record<string, SchemaObject> = {};
    const required: string[] = [];
    for (const s of schemas) {
        if (s.properties) Object.assign(properties, s.properties);
        if (s.required) required.push(...s.required);
    }
    return { properties, required: required.filter((v, i, a) => a.indexOf(v) === i) };
};

const SchemaProperty: React.FC<SchemaPropertyProps> = ({
    name,
    schema,
    required,
    isRoot = false,
    depth = 0,
}) => {
    const s = flattenSchema(schema);
    const depthStyle = getDepthStyle(depth);

    const isArrayType = s.type === 'array' || (!s.type && !!s.items);
    const isObjectType = !!(s.properties || s.additionalProperties);

    const hasChildren =
        isObjectType ||
        (isArrayType && !!s.items && isExpandable(s.items)) ||
        (Array.isArray(s.oneOf) && s.oneOf.length > 0) ||
        (Array.isArray(s.anyOf) && s.anyOf.length > 0) ||
        (Array.isArray(s.allOf) && s.allOf.length > 0 && s.allOf.some(sub => !!sub.properties));

    const [isOpen, setIsOpen] = React.useState(isRoot && hasChildren);

    const expandCtx = React.useContext(SchemaExpandContext);
    const expandVersion = expandCtx?.version ?? 0;
    const allOpen = expandCtx?.allOpen ?? false;
    React.useEffect(() => {
        if (expandVersion === 0 || !hasChildren) return;
        setIsOpen(allOpen);
    }, [expandVersion, allOpen, hasChildren]);

    // Child count for the closed-state badge
    const childCount = React.useMemo((): { count: number; label: string } | null => {
        if (!hasChildren) return null;
        if (isObjectType) {
            const count = Object.keys(s.properties || {}).length;
            return count > 0 ? { count, label: count === 1 ? 'property' : 'properties' } : null;
        }
        if (isArrayType && s.items?.properties) {
            const count = Object.keys(s.items.properties).length;
            return count > 0 ? { count, label: count === 1 ? 'field' : 'fields' } : null;
        }
        if (Array.isArray(s.oneOf) && s.oneOf.length > 0) return { count: s.oneOf.length, label: 'variants' };
        if (Array.isArray(s.anyOf) && s.anyOf.length > 0) return { count: s.anyOf.length, label: 'variants' };
        if (Array.isArray(s.allOf) && s.allOf.length > 0) {
            const { properties } = mergeAllOf(s.allOf);
            const count = Object.keys(properties).length;
            return count > 0 ? { count, label: count === 1 ? 'property' : 'properties' } : null;
        }
        return null;
    }, [hasChildren, isObjectType, isArrayType, s]);

    const childWrapper = (key: string, child: React.ReactNode) => (
        <div key={key} className={depth > 0 ? cn('border-l-2 pl-4', depthStyle.border) : undefined}>
            {child}
        </div>
    );

    const renderCompositeOption = (option: SchemaObject, index: number, label: string) => {
        const itemSchema = option.type === 'array' && option.items ? option.items : option;
        const canExpand = !!itemSchema.properties && Object.keys(itemSchema.properties).length > 0;
        const nextDepth = depth + 1;
        const nextStyle = getDepthStyle(nextDepth);

        const header = (
            <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">{label} {index + 1}</Badge>
                <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700">
                    {renderSchemaType(option)}
                </Badge>
                {option.description && (
                    <span className="text-xs text-gray-600 dark:text-gray-400">{option.description}</span>
                )}
            </div>
        );

        if (!canExpand) {
            return (
                <div key={index} className="flex flex-col gap-1.5 p-2 rounded text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 shrink-0" />
                        {header}
                    </div>
                    {itemSchema.enum && itemSchema.enum.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pl-6">
                            <span className="text-xs text-muted-foreground">enum:</span>
                            {itemSchema.enum.map((value, i) => (
                                <Badge key={i} variant="outline" className="text-xs font-mono bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300">
                                    {JSON.stringify(value)}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div key={index}>
                <Collapsible>
                    <CollapsibleTrigger className={cn(
                        "group flex items-center gap-2 w-full p-2 cursor-pointer transition-colors",
                        "data-[state=open]:rounded-t data-[state=closed]:rounded",
                        "data-[state=open]:" + nextStyle.openBg,
                        "data-[state=open]:border-b data-[state=open]:" + nextStyle.separator,
                        "hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}>
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 group-data-[state=open]:rotate-90 transition-transform" />
                        {header}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1 pl-4">
                        <div className={cn('border-l-2 pl-4', nextStyle.border)}>
                            {Object.entries(itemSchema.properties ?? {}).map(([propName, propSchema]) => (
                                <SchemaProperty
                                    key={propName}
                                    name={propName}
                                    schema={propSchema}
                                    required={itemSchema.required?.includes(propName)}
                                    depth={nextDepth}
                                />
                            ))}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        );
    };

    const renderCompositeGroup = (key: string, title: string, schemas: SchemaObject[], label: string) => (
        <div key={key} className="pl-4 mt-1">
            <p className="text-xs text-muted-foreground px-2 pb-1">{title}</p>
            {schemas.map((sub, i) => renderCompositeOption(sub, i, label))}
        </div>
    );

    const renderChildren = () => {
        const parts: React.ReactNode[] = [];
        const nextDepth = depth + 1;

        if (isObjectType) {
            parts.push(
                <div key="props" className={depth === 0 ? 'pl-2' : 'pl-4'}>
                    {Object.entries(s.properties || {}).map(([propName, propSchema]) =>
                        childWrapper(propName,
                            <SchemaProperty
                                name={propName}
                                schema={propSchema}
                                required={s.required?.includes(propName)}
                                depth={nextDepth}
                            />
                        )
                    )}
                </div>
            );
        } else if (isArrayType && s.items) {
            const itemSchema = s.items;
            parts.push(
                <div key="items" className={depth === 0 ? 'pl-2' : 'pl-4'}>
                    {itemSchema.properties ? (
                        Object.entries(itemSchema.properties).map(([propName, propSchema]) =>
                            childWrapper(propName,
                                <SchemaProperty
                                    name={propName}
                                    schema={propSchema}
                                    required={itemSchema.required?.includes(propName)}
                                    depth={nextDepth}
                                />
                            )
                        )
                    ) : (
                        <SchemaProperty schema={itemSchema} depth={nextDepth} />
                    )}
                </div>
            );
        }

        if (Array.isArray(s.oneOf) && s.oneOf.length > 0)
            parts.push(renderCompositeGroup('oneOf', 'One of:', s.oneOf, 'Option'));
        if (Array.isArray(s.anyOf) && s.anyOf.length > 0)
            parts.push(renderCompositeGroup('anyOf', 'Any of:', s.anyOf, 'Option'));
        if (Array.isArray(s.allOf) && s.allOf.length > 0) {
            const { properties, required: allOfRequired } = mergeAllOf(s.allOf);
            if (Object.keys(properties).length > 0) {
                parts.push(
                    <div key="allOf" className="pl-4">
                        {Object.entries(properties).map(([propName, propSchema]) =>
                            childWrapper(propName,
                                <SchemaProperty
                                    name={propName}
                                    schema={propSchema}
                                    required={allOfRequired.includes(propName)}
                                    depth={nextDepth}
                                />
                            )
                        )}
                    </div>
                );
            }
        }

        return parts.length > 0 ? <div className="space-y-0.5 py-1">{parts}</div> : null;
    };

    const headerContent = (
        <div className="flex flex-col gap-1 text-left min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
                {name && (
                    <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                        {name}{isArrayType && '[]'}
                        {required && <span className="text-red-500 ml-0.5">*</span>}
                    </span>
                )}
                <SchemaBadges schema={s} />
            </div>
            {s.description && (
                <FormattedMarkdown
                    className="!text-xs !text-gray-600 dark:!text-gray-400"
                    markdown={s.description}
                />
            )}
            {s.enum && s.enum.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                    <span className="text-xs text-muted-foreground">enum:</span>
                    {s.enum.map((value, i) => (
                        <Badge key={i} variant="outline" className="text-xs font-mono bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300">
                            {JSON.stringify(value)}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="py-0.5">
            {hasChildren ? (
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <CollapsibleTrigger className={cn(
                        "group flex items-start gap-2 w-full p-2 cursor-pointer transition-colors",
                        isOpen
                            ? cn("rounded-t", depthStyle.openBg, "border-b", depthStyle.separator)
                            : "rounded hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}>
                        <ChevronRight className="h-4 w-4 mt-1 shrink-0 text-gray-400 group-data-[state=open]:rotate-90 transition-transform" />
                        {headerContent}
                        {!isOpen && childCount && (
                            <span className="shrink-0 self-center text-xs text-muted-foreground">
                                {childCount.count} {childCount.label}
                            </span>
                        )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        {renderChildren()}
                    </CollapsibleContent>
                </Collapsible>
            ) : (
                <div className="flex items-start gap-2 p-2">
                    <div className="w-4 shrink-0" />
                    {headerContent}
                </div>
            )}
        </div>
    );
};

export default SchemaProperty;
