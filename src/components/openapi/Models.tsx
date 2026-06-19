import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, Database } from 'lucide-react';
import { useOpenAPIContext } from '@/hooks/OpenAPIContext';
import SchemaProperty from '@/components/openapi/Endpoint/SchemaProperty';
import FormattedMarkdown from '@/components/openapi/FormattedMarkdown';
import { renderSchemaType } from '@/utils/openapi';
import { SchemaExpandContext } from '@/components/openapi/Endpoint/SchemaExpandContext';
import { SchemaObject } from '@/types/unified-openapi-types';

const SchemaCard: React.FC<{ name: string; schema: SchemaObject }> = ({ name, schema }) => {
    const [open, setOpen] = useState(false);
    const [expandState, setExpandState] = useState({ version: 0, allOpen: false });

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <div className="rounded-xl bg-muted/50 overflow-hidden">
                <CollapsibleTrigger className="group w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/80 transition-colors">
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-data-[state=open]:rotate-90 transition-transform" />
                    <span className="font-mono font-semibold text-sm">{name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal font-mono">
                        {renderSchemaType(schema)}
                    </Badge>
                    {schema.description && (
                        <span className="text-xs text-muted-foreground truncate flex-1 hidden sm:block">
                            {schema.description}
                        </span>
                    )}
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <div className="px-4 pb-4 border-t border-border/40 pt-3">
                        {schema.description && (
                            <FormattedMarkdown
                                className="!text-sm text-muted-foreground mb-3"
                                markdown={schema.description}
                            />
                        )}
                        <SchemaExpandContext.Provider value={{
                            ...expandState,
                            dispatch: (allOpen) => setExpandState(s => ({ version: s.version + 1, allOpen })),
                        }}>
                            <SchemaProperty schema={schema} isRoot />
                        </SchemaExpandContext.Provider>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
};

const Models: React.FC = () => {
    const { spec } = useOpenAPIContext();
    const schemas = spec.components?.schemas ?? {};
    const entries = Object.entries(schemas);

    return (
        <Card className="w-full rounded-none border-x-0 border-t-0 md:rounded-lg md:border">
            <div className="sticky top-0 md:top-16 z-40 bg-card flex items-center gap-3 px-6 py-4 border-b rounded-t-lg">
                <Database className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-base font-semibold">Models</h2>
                <Badge variant="outline" className="font-mono">{entries.length}</Badge>
            </div>

            <div className="p-4 space-y-2">
                {entries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">
                        No schemas defined in this spec.
                    </p>
                ) : (
                    entries.map(([name, schema]) => (
                        <SchemaCard key={name} name={name} schema={schema as SchemaObject} />
                    ))
                )}
            </div>
        </Card>
    );
};

export default Models;
