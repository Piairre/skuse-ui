import React, { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { Tag, Database, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { getBadgeColor, getOperationId, groupEndpointsByTags } from '@/utils/openapi';
import { useOpenAPIContext } from '@/hooks/OpenAPIContext';
import { EnhancedOperationObject } from '@/types/openapi';

const MAX_VISIBLE = 5;

interface TagMeta {
    description?: string;
    externalDocs?: { url: string; description?: string };
}

const TagCard: React.FC<{ tag: string; endpoints: EnhancedOperationObject[]; meta?: TagMeta }> = ({ tag, endpoints, meta }) => {
    const visible = endpoints.slice(0, MAX_VISIBLE);
    const extra = endpoints.length - MAX_VISIBLE;

    return (
        <div className="rounded-lg border border-border/60 bg-background p-3 space-y-2 h-full">
            <div className="pb-1.5 border-b border-border/40">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-semibold truncate">{tag}</span>
                        {meta?.externalDocs && (
                            <a
                                href={meta.externalDocs.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={meta.externalDocs.description ?? 'External docs'}
                                onClick={e => e.stopPropagation()}
                                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                        )}
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal shrink-0">
                        {endpoints.length}
                    </Badge>
                </div>
                {meta?.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{meta.description}</p>
                )}
            </div>
            <div className="space-y-0.5">
                {visible.map((op) => (
                    <Link
                        key={`${op.method}-${op.path}`}
                        to="/$tag/$operationIdentifier"
                        params={{ tag, operationIdentifier: getOperationId(op) }}
                        className="flex items-center gap-2 rounded px-1 py-1 hover:bg-muted transition-colors group"
                    >
                        <Badge
                            className={`${getBadgeColor(op.method)} text-white uppercase w-12 flex justify-center items-center shrink-0 text-[9px]`}
                        >
                            {op.method}
                        </Badge>
                        <span className="truncate text-xs text-muted-foreground group-hover:text-foreground font-mono transition-colors">
                            {op.path}
                        </span>
                    </Link>
                ))}
                {extra > 0 && (
                    <p className="text-[10px] text-muted-foreground px-1 pt-1">
                        +{extra} more endpoint{extra > 1 ? 's' : ''}
                    </p>
                )}
            </div>
        </div>
    );
};

const TagsOverview: React.FC = () => {
    const { spec } = useOpenAPIContext();

    const tagGroups = useMemo(
        () => Object.entries(groupEndpointsByTags(spec.paths)),
        [spec.paths]
    );

    const tagMeta = useMemo(() => {
        const map = new Map<string, TagMeta>();
        spec.tags?.forEach(t => map.set(t.name, { description: t.description, externalDocs: t.externalDocs }));
        return map;
    }, [spec.tags]);

    const schemaCount = Object.keys(spec.components?.schemas ?? {}).length;

    if (tagGroups.length === 0 && schemaCount === 0) return null;

    return (
        <div className="rounded-xl bg-muted/50 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Endpoints
            </h3>

            <Carousel
                opts={{ loop: true, align: 'start', dragFree: true, slidesToScroll: 2 }}
                plugins={[WheelGesturesPlugin() as never]}
                className="w-full"
            >
                <CarouselContent className="-ml-3">
                    {tagGroups.map(([tag, endpoints]) => (
                        <CarouselItem key={tag} className="pl-3 basis-[min(calc(50%-6px),300px)]">
                            <TagCard tag={tag} endpoints={endpoints} meta={tagMeta.get(tag)} />
                        </CarouselItem>
                    ))}
                    {schemaCount > 0 && (
                        <CarouselItem key="__models__" className="pl-3 basis-[min(calc(50%-6px),300px)]">
                            <Link
                                to="/models"
                                className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border/60 bg-background p-3 h-full min-h-[120px] hover:bg-muted/50 transition-colors group"
                            >
                                <Database className="h-8 w-8 text-muted-foreground group-hover:text-foreground transition-colors" />
                                <div className="text-center">
                                    <p className="text-sm font-semibold">View Models</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {schemaCount} schema{schemaCount > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </Link>
                        </CarouselItem>
                    )}
                </CarouselContent>
                {tagGroups.length > 1 && (
                    <>
                        <CarouselPrevious className="-left-3" />
                        <CarouselNext className="-right-3" />
                    </>
                )}
            </Carousel>
        </div>
    );
};

export default TagsOverview;
