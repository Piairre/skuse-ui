import React from 'react';
import { Badge } from "@/components/ui/badge";
import { SchemaObject } from "@/types/unified-openapi-types";
import ExternalDocsLink from "@/components/openapi/Endpoint/ExternalDocsLink";
import { renderSchemaType, flattenSchema } from "@/utils/openapi";

interface SchemaBadgesProps {
    schema: SchemaObject;
}

export const getTypeColorClass = (typeStr: string): string => {
    const t = typeStr.toLowerCase();
    if (t === 'unknown') return 'border-slate-200 dark:border-slate-600 text-muted-foreground';
    if (t === 'null') return 'border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500';
    if (t.startsWith('string')) return 'border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40';
    if (t.startsWith('integer') || t.startsWith('number')) return 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40';
    if (t.startsWith('boolean')) return 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40';
    if (t.startsWith('array') || t.startsWith('[')) return 'border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40';
    if (t.startsWith('oneof') || t.startsWith('anyof') || t.startsWith('allof') || t === 'conditional') return 'border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40';
    // object or named model title
    return 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40';
};

const SchemaBadges: React.FC<SchemaBadgesProps> = ({ schema }) => {
    const s = flattenSchema(schema);
    const typeStr = renderSchemaType(s);

    return (
        <>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 font-medium ${getTypeColorClass(typeStr)}`}>
                {typeStr}
            </Badge>
            {s.format && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
                    {s.format}
                </Badge>
            )}
            {s.deprecated && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800">
                    deprecated
                </Badge>
            )}
            {s.readOnly && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800">
                    readonly
                </Badge>
            )}
            {s.writeOnly && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800">
                    writeOnly
                </Badge>
            )}
            {s.default !== undefined && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800">
                    default: {JSON.stringify(s.default)}
                </Badge>
            )}
            {s.minLength !== undefined && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4font-mono text-muted-foreground">min: {s.minLength}</Badge>
            )}
            {s.maxLength !== undefined && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4font-mono text-muted-foreground">max: {s.maxLength}</Badge>
            )}
            {s.minimum !== undefined && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4font-mono text-muted-foreground">
                    {s.exclusiveMinimum === true ? '>' : '≥'} {s.minimum}
                </Badge>
            )}
            {typeof s.exclusiveMinimum === 'number' && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4font-mono text-muted-foreground">&gt; {s.exclusiveMinimum}</Badge>
            )}
            {s.maximum !== undefined && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4font-mono text-muted-foreground">
                    {s.exclusiveMaximum === true ? '<' : '≤'} {s.maximum}
                </Badge>
            )}
            {typeof s.exclusiveMaximum === 'number' && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4font-mono text-muted-foreground">&lt; {s.exclusiveMaximum}</Badge>
            )}
            {s.multipleOf !== undefined && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4font-mono text-muted-foreground">×{s.multipleOf}</Badge>
            )}
            {s.minItems !== undefined && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4font-mono text-muted-foreground">minItems: {s.minItems}</Badge>
            )}
            {s.maxItems !== undefined && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4font-mono text-muted-foreground">maxItems: {s.maxItems}</Badge>
            )}
            {s.minProperties !== undefined && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4font-mono text-muted-foreground">minProps: {s.minProperties}</Badge>
            )}
            {s.maxProperties !== undefined && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4font-mono text-muted-foreground">maxProps: {s.maxProperties}</Badge>
            )}
            {s.const !== undefined && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4font-mono bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300">
                    const: {JSON.stringify(s.const)}
                </Badge>
            )}
            {s.uniqueItems && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4text-muted-foreground">unique</Badge>
            )}
            {s.pattern && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4font-mono text-muted-foreground max-w-[200px] truncate" title={s.pattern}>
                    /{s.pattern}/
                </Badge>
            )}
            {s.contentMediaType && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4font-mono text-muted-foreground">{s.contentMediaType}</Badge>
            )}
            {s.contentEncoding && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4font-mono text-muted-foreground">encoding: {s.contentEncoding}</Badge>
            )}
            {s.minContains !== undefined && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4font-mono text-muted-foreground">minContains: {s.minContains}</Badge>
            )}
            {s.maxContains !== undefined && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4font-mono text-muted-foreground">maxContains: {s.maxContains}</Badge>
            )}
            {s.additionalProperties === false && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4text-muted-foreground">no additional props</Badge>
            )}
            {s.unevaluatedProperties === false && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4text-muted-foreground">no unevaluated props</Badge>
            )}
            {s.unevaluatedItems === false && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4text-muted-foreground">no unevaluated items</Badge>
            )}
            {s.externalDocs?.url && <ExternalDocsLink url={s.externalDocs.url} />}
        </>
    );
};

export default SchemaBadges;
