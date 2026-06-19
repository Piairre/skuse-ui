import React, { useState, useMemo, useEffect } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Moon, Sun, Search, X, Database, ExternalLink } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnhancedOperationObject } from "@/types/openapi";
import { getBadgeColor, getOperationId, groupEndpointsByTags } from "@/utils/openapi";
import { useOpenAPIContext } from "@/hooks/OpenAPIContext";
import { Link, useLocation } from "@tanstack/react-router";
import { useTheme } from "@/components/theme-provider";
import { Switch } from "@/components/ui/switch";

const Sidebar: React.FC = () => {
    const { spec } = useOpenAPIContext();
    const { theme, setTheme } = useTheme();
    const location = useLocation();

    const tags = useMemo(() => Object.entries(groupEndpointsByTags(spec.paths)), [spec.paths]);

    const tagMeta = useMemo(() => {
        const map = new Map<string, { description?: string; externalDocs?: { url: string; description?: string } }>();
        spec.tags?.forEach(t => map.set(t.name, { description: t.description, externalDocs: t.externalDocs }));
        return map;
    }, [spec.tags]);

    // Current tag derived from URL: /$tag/$operationId
    const currentTag = decodeURIComponent(location.pathname.split('/')[1] ?? '');

    const [openTags, setOpenTags] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        if (tags.length === 1 && tags[0]) initial.add(tags[0][0]);
        if (currentTag) initial.add(currentTag);
        return initial;
    });

    // Auto-open tag when navigating to a new one
    useEffect(() => {
        if (!currentTag) return;
        setOpenTags(prev => {
            if (prev.has(currentTag)) return prev;
            const next = new Set(prev);
            next.add(currentTag);
            return next;
        });
    }, [currentTag]);

    const [search, setSearch] = useState('');

    const toggleTag = (tag: string) => {
        setOpenTags(prev => {
            const next = new Set(prev);
            if (next.has(tag)) next.delete(tag);
            else next.add(tag);
            return next;
        });
    };

    const filteredTags = useMemo(() => {
        if (!search.trim()) return tags;
        const q = search.toLowerCase();
        return tags
            .map(([tag, endpoints]): [string, EnhancedOperationObject[]] => [
                tag,
                endpoints.filter(op =>
                    op.path.toLowerCase().includes(q) ||
                    op.method.toLowerCase().includes(q) ||
                    (op.summary ?? '').toLowerCase().includes(q) ||
                    (op.description ?? '').toLowerCase().includes(q) ||
                    (op.operationId ?? '').toLowerCase().includes(q) ||
                    tag.toLowerCase().includes(q)
                ),
            ])
            .filter(([, endpoints]) => endpoints.length > 0);
    }, [tags, search]);

    // When searching, expand all matching tags automatically
    const effectiveOpenTags = search.trim()
        ? new Set(filteredTags.map(([tag]) => tag))
        : openTags;

    return (
        <div className="w-full shadow-lg flex flex-col h-full">
            <div className="px-3 py-3 border-b dark:border-zinc-700">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search endpoints..."
                        className="pl-8 pr-7 h-8 text-sm"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-grow py-2 overflow-y-auto">
                {filteredTags.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10 px-4">
                        No endpoints match "{search}"
                    </p>
                ) : (
                    filteredTags.map(([tag, endpoints]) => (
                        <Collapsible
                            key={`collapsible-${tag}`}
                            open={effectiveOpenTags.has(tag)}
                            onOpenChange={() => { if (!search.trim()) toggleTag(tag); }}
                        >
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-between hover:bg-secondary/20 dark:hover:bg-zinc-700/50 mb-1 hover:text-primary border-l-4 border-transparent hover:border-primary transition-all duration-200 h-auto py-1.5"
                                >
                                    <div className="flex flex-col items-start gap-0.5 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{tag}</span>
                                            <span className="text-xs text-muted-foreground font-normal tabular-nums">
                                                {endpoints.length}
                                            </span>
                                            {tagMeta.get(tag)?.externalDocs && (
                                                <a
                                                    href={tagMeta.get(tag)!.externalDocs!.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title={tagMeta.get(tag)!.externalDocs!.description ?? 'External docs'}
                                                    onClick={e => e.stopPropagation()}
                                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <ExternalLink className="h-2.5 w-2.5" />
                                                </a>
                                            )}
                                        </div>
                                        {tagMeta.get(tag)?.description && (
                                            <span className="text-[11px] text-muted-foreground font-normal truncate max-w-[160px]">
                                                {tagMeta.get(tag)!.description}
                                            </span>
                                        )}
                                    </div>
                                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${effectiveOpenTags.has(tag) ? 'rotate-180' : ''}`} />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="space-y-0.5 pl-2 pb-2">
                                    {endpoints.map((operation) => (
                                        <SidebarEndpoint
                                            key={`${tag}-${operation.operationId || operation.path}-${operation.method}`}
                                            operation={operation}
                                            tag={tag}
                                        />
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    ))
                )}
            </div>

            {Object.keys(spec.components?.schemas ?? {}).length > 0 && (
                <div className="border-t dark:border-zinc-700 px-2 py-2">
                    <Link
                        to="/models"
                        className="flex items-center gap-2 px-2 py-1.5 rounded border-l-4 border-transparent hover:border-primary/50 hover:bg-secondary/20 transition-all duration-200 group"
                        activeProps={{ className: '!border-primary bg-primary/5 dark:bg-primary/10' }}
                    >
                        <Database className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                        <span className="text-sm font-semibold">Models</span>
                        <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 h-4 font-normal">
                            {Object.keys(spec.components?.schemas ?? {}).length}
                        </Badge>
                    </Link>
                </div>
            )}

            <div className="mt-auto border-t dark:border-zinc-700 p-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold dark:text-white">Skuse</span>
                    <div className="flex items-center space-x-2">
                        <Sun className="h-4 w-4 dark:text-zinc-400" />
                        <Switch
                            checked={theme === 'dark'}
                            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                        />
                        <Moon className="h-4 w-4 dark:text-zinc-400" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const SidebarEndpoint: React.FC<{ operation: EnhancedOperationObject; tag: string }> = ({ operation, tag }) => {
    const operationIdentifier = getOperationId(operation);

    return (
        <Link
            to="/$tag/$operationIdentifier"
            params={{ operationIdentifier, tag }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-r border-l-4 border-transparent hover:border-primary/50 hover:bg-secondary/20 transition-all duration-200 group"
            activeProps={{ className: '!border-primary bg-primary/5 dark:bg-primary/10' }}
        >
            <Badge
                className={`${getBadgeColor(operation.method.toLowerCase())} text-white uppercase w-14 flex justify-center items-center shrink-0 text-[10px]`}
            >
                {operation.method}
            </Badge>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                    <p
                        title={operation.path}
                        className={`text-sm font-medium truncate ${operation.deprecated ? 'text-muted-foreground line-through' : ''}`}
                    >
                        {operation.path}
                    </p>
                    {operation.deprecated && (
                        <Badge
                            variant="outline"
                            className="shrink-0 text-[10px] px-1 py-0 h-4 border-orange-300 text-orange-500 dark:border-orange-700 dark:text-orange-400"
                        >
                            deprecated
                        </Badge>
                    )}
                </div>
                {(operation.summary || operation.description) && (
                    <p className="text-xs text-muted-foreground truncate">
                        {operation.summary || operation.description}
                    </p>
                )}
            </div>
        </Link>
    );
};

export default Sidebar;
