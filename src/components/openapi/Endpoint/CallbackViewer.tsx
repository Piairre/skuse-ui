import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { CallbackObject, OperationObject } from '@/types/unified-openapi-types';
import { getBadgeColor } from '@/utils/openapi';
import RequestBodyViewer from './RequestBodyViewer';
import ResponseViewer from './ResponseViewer';
import FormattedMarkdown from '@/components/openapi/FormattedMarkdown';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'] as const;

const CallbackOperation: React.FC<{ method: string; operation: OperationObject }> = ({ method, operation }) => {
    const [open, setOpen] = useState(false);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-1.5 group">
                <Badge className={`${getBadgeColor(method)} text-white font-mono text-[10px] px-2 py-0.5 shrink-0`}>
                    {method.toUpperCase()}
                </Badge>
                {(operation.summary || operation.description) && (
                    <span className="text-sm text-muted-foreground truncate flex-1">
                        {operation.summary || operation.description}
                    </span>
                )}
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ml-auto ${open ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="pl-4 pt-2 space-y-4 border-l ml-3">
                    {operation.description && operation.summary && (
                        <div className="prose dark:prose-invert max-w-none text-sm">
                            <FormattedMarkdown markdown={operation.description} />
                        </div>
                    )}
                    {operation.requestBody && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payload</p>
                            <RequestBodyViewer requestBody={operation.requestBody} hideExample />
                        </div>
                    )}
                    {operation.responses && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Responses</p>
                            <ResponseViewer responses={operation.responses} />
                        </div>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

const CallbackViewer: React.FC<{ callbacks: Record<string, CallbackObject> }> = ({ callbacks }) => {
    const [openCallbacks, setOpenCallbacks] = useState<Set<string>>(new Set());

    const toggle = (name: string) => setOpenCallbacks(prev => {
        const next = new Set(prev);
        next.has(name) ? next.delete(name) : next.add(name);
        return next;
    });

    return (
        <div className="space-y-2">
            {Object.entries(callbacks).map(([name, callback]) => (
                <Collapsible key={name} open={openCallbacks.has(name)} onOpenChange={() => toggle(name)}>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                        <span className="text-sm font-medium flex-1">{name}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${openCallbacks.has(name) ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="px-3 pt-3 space-y-4">
                            {Object.entries(callback).map(([expression, pathItem]) => (
                                <div key={expression} className="space-y-2">
                                    <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
                                        {expression}
                                    </code>
                                    <div className="space-y-1">
                                        {HTTP_METHODS.filter(m => pathItem[m]).map(method => (
                                            <CallbackOperation
                                                key={method}
                                                method={method}
                                                operation={pathItem[method]!}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            ))}
        </div>
    );
};

export default CallbackViewer;
