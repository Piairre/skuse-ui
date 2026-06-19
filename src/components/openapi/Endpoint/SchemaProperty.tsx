import React from 'react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronsUpDown, ChevronsDownUp } from 'lucide-react';
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

const MAX_DEPTH = 8;

const isExpandable = (schema: SchemaObject): boolean =>
    !!schema.properties ||
    schema.type === 'object' ||
    (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) ||
    (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) ||
    (Array.isArray(schema.allOf) && schema.allOf.length > 0) ||
    !!schema.not ||
    (!!schema.additionalProperties && typeof schema.additionalProperties === 'object') ||
    !!schema.patternProperties ||
    !!schema.propertyNames ||
    (Array.isArray(schema.prefixItems) && schema.prefixItems.length > 0) ||
    !!schema.if ||
    !!schema.contains ||
    (typeof schema.unevaluatedProperties === 'object' && !!schema.unevaluatedProperties) ||
    (typeof schema.unevaluatedItems === 'object' && !!schema.unevaluatedItems);

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
    const isObjectType = !!(s.properties || (s.additionalProperties && typeof s.additionalProperties === 'object') || s.patternProperties);

    if (depth >= MAX_DEPTH) {
        return (
            <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground italic">
                <div className="w-4 shrink-0" />
                Max depth reached
            </div>
        );
    }

    const hasChildren =
        isObjectType ||
        (isArrayType && !!s.items && isExpandable(s.items)) ||
        (Array.isArray(s.oneOf) && s.oneOf.length > 0) ||
        (Array.isArray(s.anyOf) && s.anyOf.length > 0) ||
        (Array.isArray(s.allOf) && s.allOf.length > 0 && s.allOf.some(sub => !!sub.properties)) ||
        !!s.not ||
        (!!s.additionalProperties && typeof s.additionalProperties === 'object') ||
        !!s.patternProperties ||
        !!s.propertyNames ||
        (Array.isArray(s.prefixItems) && s.prefixItems.length > 0) ||
        !!s.if ||
        !!s.contains ||
        (typeof s.unevaluatedProperties === 'object' && !!s.unevaluatedProperties) ||
        (typeof s.unevaluatedItems === 'object' && !!s.unevaluatedItems);

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
            const propCount = Object.keys(s.properties || {}).length;
            const additionalCount = typeof s.additionalProperties === 'object' && s.additionalProperties ? 1 : 0;
            const patternCount = s.patternProperties ? Object.keys(s.patternProperties).length : 0;
            const unevaluatedCount = typeof s.unevaluatedProperties === 'object' && s.unevaluatedProperties ? 1 : 0;
            const count = propCount + additionalCount + patternCount + unevaluatedCount;
            return count > 0 ? { count, label: count === 1 ? 'property' : 'properties' } : null;
        }
        if (isArrayType && s.items?.properties) {
            const count = Object.keys(s.items.properties).length;
            return count > 0 ? { count, label: count === 1 ? 'field' : 'fields' } : null;
        }
        if (Array.isArray(s.oneOf) && s.oneOf.length > 0) return { count: s.oneOf.length, label: 'variants' };
        if (Array.isArray(s.anyOf) && s.anyOf.length > 0) return { count: s.anyOf.length, label: 'variants' };
        if (s.not) return { count: 1, label: 'constraint' };
        if (Array.isArray(s.allOf) && s.allOf.length > 0) {
            const { properties } = mergeAllOf(s.allOf);
            const count = Object.keys(properties).length;
            return count > 0 ? { count, label: count === 1 ? 'property' : 'properties' } : null;
        }
        if (Array.isArray(s.prefixItems) && s.prefixItems.length > 0) return { count: s.prefixItems.length, label: s.prefixItems.length === 1 ? 'item' : 'items' };
        if (s.if) return { count: 1, label: 'conditional' };
        return null;
    }, [hasChildren, isObjectType, isArrayType, s]);

    const childWrapper = (key: string, child: React.ReactNode) => (
        <div key={key} className={depth > 0 ? cn('border-l-2 pl-4', depthStyle.border) : undefined}>
            {child}
        </div>
    );

    const renderCompositeOption = (option: SchemaObject, index: number, label: string) => {
        const rawSchema = option.type === 'array' && option.items ? option.items : option;
        const itemSchema = flattenSchema(rawSchema);
        const canExpand = isExpandable(itemSchema);
        const nextDepth = depth + 1;
        const nextStyle = getDepthStyle(nextDepth);

        const header = (
            <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">{label} {index + 1}</Badge>
                {option.title && (
                    <span className="font-mono text-xs font-medium text-gray-900 dark:text-gray-100">{option.title}</span>
                )}
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

        const sortedEntries = Object.entries(itemSchema.properties ?? {}).sort(([a], [b]) => {
            const aReq = itemSchema.required?.includes(a) ? 0 : 1;
            const bReq = itemSchema.required?.includes(b) ? 0 : 1;
            return aReq - bReq;
        });

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
                            {sortedEntries.map(([propName, propSchema]) => (
                                <SchemaProperty
                                    key={propName}
                                    name={propName}
                                    schema={propSchema}
                                    required={itemSchema.required?.includes(propName)}
                                    depth={nextDepth}
                                />
                            ))}
                            {typeof itemSchema.additionalProperties === 'object' && itemSchema.additionalProperties && (
                                <SchemaProperty
                                    name="[key: string]"
                                    schema={itemSchema.additionalProperties}
                                    depth={nextDepth}
                                />
                            )}
                            {itemSchema.patternProperties && Object.entries(itemSchema.patternProperties).map(([pattern, propSchema]) => (
                                <SchemaProperty
                                    key={`pattern:${pattern}`}
                                    name={`[/${pattern}/]`}
                                    schema={propSchema}
                                    depth={nextDepth}
                                />
                            ))}
                            {!itemSchema.properties &&
                                !itemSchema.additionalProperties &&
                                !itemSchema.patternProperties && (
                                <SchemaProperty schema={itemSchema} depth={nextDepth} />
                            )}
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
            const sortedEntries = Object.entries(s.properties || {}).sort(([a], [b]) => {
                const aReq = s.required?.includes(a) ? 0 : 1;
                const bReq = s.required?.includes(b) ? 0 : 1;
                return aReq - bReq;
            });
            parts.push(
                <div key="props" className={depth === 0 ? 'pl-2' : 'pl-4'}>
                    {sortedEntries.map(([propName, propSchema]) =>
                        childWrapper(propName,
                            <SchemaProperty
                                name={propName}
                                schema={propSchema}
                                required={s.required?.includes(propName)}
                                depth={nextDepth}
                            />
                        )
                    )}
                    {s.additionalProperties && typeof s.additionalProperties === 'object' && (
                        childWrapper('[key: string]',
                            <SchemaProperty
                                name="[key: string]"
                                schema={s.additionalProperties}
                                depth={nextDepth}
                            />
                        )
                    )}
                    {s.patternProperties && Object.entries(s.patternProperties).map(([pattern, propSchema]) =>
                        childWrapper(`pattern:${pattern}`,
                            <SchemaProperty
                                name={`[/${pattern}/]`}
                                schema={propSchema}
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

        if (s.discriminator?.mapping && Object.keys(s.discriminator.mapping).length > 0) {
            parts.push(
                <div key="discriminator-mapping" className="pl-4 pt-1 pb-0.5">
                    <p className="text-xs text-muted-foreground px-2 pb-1">Mapping</p>
                    <div className="flex flex-col gap-0.5 px-2">
                        {Object.entries(s.discriminator.mapping).map(([value, ref]) => (
                            <div key={value} className="flex items-center gap-1.5 text-xs">
                                <Badge variant="outline" className="font-mono text-xs">{value}</Badge>
                                <span className="text-muted-foreground">→</span>
                                <span className="font-mono text-xs text-muted-foreground">{ref.split('/').pop()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (s.propertyNames) {
            parts.push(
                <div key="propertyNames" className="pl-4 mt-1">
                    <p className="text-xs text-muted-foreground px-2 pb-1">Property names:</p>
                    <SchemaProperty schema={s.propertyNames} depth={nextDepth} />
                </div>
            );
        }

        if (s.not) {
            parts.push(
                <div key="not" className="pl-4 mt-1">
                    <p className="text-xs text-muted-foreground px-2 pb-1">Not:</p>
                    <SchemaProperty schema={s.not} depth={nextDepth} />
                </div>
            );
        }

        if (s.contains) {
            parts.push(
                <div key="contains" className="pl-4 mt-1">
                    <p className="text-xs text-muted-foreground px-2 pb-1">Contains:</p>
                    <SchemaProperty schema={s.contains} depth={nextDepth} />
                </div>
            );
        }

        if (typeof s.unevaluatedProperties === 'object' && s.unevaluatedProperties) {
            parts.push(
                <div key="unevaluatedProperties" className="pl-4 mt-1">
                    <p className="text-xs text-muted-foreground px-2 pb-1">Unevaluated properties:</p>
                    <SchemaProperty name="[unevaluated: string]" schema={s.unevaluatedProperties} depth={nextDepth} />
                </div>
            );
        }

        if (typeof s.unevaluatedItems === 'object' && s.unevaluatedItems) {
            parts.push(
                <div key="unevaluatedItems" className="pl-4 mt-1">
                    <p className="text-xs text-muted-foreground px-2 pb-1">Unevaluated items:</p>
                    <SchemaProperty schema={s.unevaluatedItems} depth={nextDepth} />
                </div>
            );
        }

        if (Array.isArray(s.prefixItems) && s.prefixItems.length > 0) {
            parts.push(
                <div key="prefixItems" className="pl-4 mt-1">
                    <p className="text-xs text-muted-foreground px-2 pb-1">Tuple items:</p>
                    {s.prefixItems.map((itemSchema, i) =>
                        childWrapper(`prefixItem-${i}`,
                            <SchemaProperty
                                key={i}
                                name={`[${i}]`}
                                schema={itemSchema}
                                depth={nextDepth}
                            />
                        )
                    )}
                    {s.items && (
                        childWrapper('prefixItems-rest',
                            <SchemaProperty
                                name="[...]"
                                schema={s.items}
                                depth={nextDepth}
                            />
                        )
                    )}
                </div>
            );
        }

        if (s.if) {
            parts.push(
                <div key="if-then-else" className="pl-4 mt-1 space-y-1">
                    <p className="text-xs text-muted-foreground px-2 pb-1">Conditional:</p>
                    <div>
                        <p className="text-xs text-muted-foreground px-2">if</p>
                        <SchemaProperty schema={s.if} depth={nextDepth} />
                    </div>
                    {s.then && (
                        <div>
                            <p className="text-xs text-muted-foreground px-2">then</p>
                            <SchemaProperty schema={s.then} depth={nextDepth} />
                        </div>
                    )}
                    {s.else && (
                        <div>
                            <p className="text-xs text-muted-foreground px-2">else</p>
                            <SchemaProperty schema={s.else} depth={nextDepth} />
                        </div>
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
            {s.title && s.title !== name && !(s.type === 'object' || (!s.type && s.properties)) && (
                <span className="text-xs text-muted-foreground italic">{s.title}</span>
            )}
            {s.description && (
                <div onClick={e => e.stopPropagation()}>
                    <FormattedMarkdown
                        className="!text-xs !text-gray-600 dark:!text-gray-400"
                        markdown={s.description}
                    />
                </div>
            )}
            {s.discriminator && (
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-muted-foreground">discriminator:</span>
                    <Badge variant="outline" className="text-xs font-mono bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300">
                        {s.discriminator.propertyName}
                    </Badge>
                </div>
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
                        {isRoot && (
                            <div className="flex items-center gap-1 ml-auto shrink-0" onClick={e => e.stopPropagation()}>
                                {!isOpen && childCount && (
                                    <span className="text-xs text-muted-foreground mr-1">
                                        {childCount.count} {childCount.label}
                                    </span>
                                )}
                                {expandCtx?.dispatch && (
                                    <>
                                        <button
                                            onClick={() => expandCtx.dispatch!(true)}
                                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <ChevronsUpDown className="h-3 w-3" />
                                            Expand all
                                        </button>
                                        <button
                                            onClick={() => expandCtx.dispatch!(false)}
                                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <ChevronsDownUp className="h-3 w-3" />
                                            Collapse all
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                        {!isRoot && !isOpen && childCount && (
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
