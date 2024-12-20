import React, {useState} from 'react';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {ChevronDown, ChevronUp} from 'lucide-react';
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {OpenAPIV3} from "openapi-types";
import {EnhancedOperationObject, TaggedOperationsMap} from "@/types/openapi";

interface SkuseUISidebarProps {
    groupedEndpointsByTag: TaggedOperationsMap
}

const httpMethodColors: Record<OpenAPIV3.HttpMethods, string> = {
    get: 'bg-green-500',
    post: 'bg-blue-500',
    put: 'bg-yellow-500',
    patch: 'bg-teal-500',
    delete: 'bg-red-500',
    options: 'bg-purple-500',
    head: 'bg-gray-500',
    trace: 'bg-pink-500'
};

const Sidebar: React.FC<SkuseUISidebarProps> = ({groupedEndpointsByTag}) => {
    const [openTag, setOpenTag] = useState<string | null>(null);

    // Manage endpoints without tags
    const tags = Object.entries(groupedEndpointsByTag).filter((tag) => tag[0] !== 'null');
    const untaggedEndpoints = groupedEndpointsByTag['null'] || [];

    return (
        <div className="w-80 bg-secondary/10 shadow-lg py-2">
            {tags.map(([tag, endpoints]) => (
                <Collapsible key={tag} open={openTag === tag} onOpenChange={(isOpen) => setOpenTag(isOpen ? tag : null)}>
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            className="w-full justify-between hover:bg-secondary/20 mb-2 hover:text-primary hover:border-l-4 hover:border-primary transition-all duration-200"
                        >
                            <div className="flex items-center space-x-2">
                                <span className="font-semibold">{tag}</span>
                            </div>
                            {openTag === tag ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="space-y-2 pl-4">
                            {endpoints.map((operation) => (
                                <SidebarEndpoint key={`${tag}-${operation.path}-${operation.method}`} operation={operation}/>
                            ))}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            ))}

            {untaggedEndpoints.length > 0 && (
                <div className="space-y-2">
                    {untaggedEndpoints.map((operation) => (
                        <SidebarEndpoint key={`${operation.method}-${operation.path}`} operation={operation}/>
                    ))}
                </div>
            )}
        </div>
    );
};

const SidebarEndpoint: React.FC<{ operation: EnhancedOperationObject, key: string }> = ({operation}) => {
    return (
        <div
            className={`flex items-center space-x-2 p-2 hover:bg-secondary/20 cursor-pointer hover:border-l-4 transition-all duration-200`}
        >
            <Badge
                className={`${httpMethodColors[operation.method.toLowerCase()]} text-white uppercase w-14 flex justify-center items-center`}>
                {operation.method}
            </Badge>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${operation.deprecated ? 'text-zinc-400 line-through' : ''}`}>
                    {operation.path}
                </p>
                <div className="text-xs text-muted-foreground truncate">
                    {operation.deprecated ? (
                        <span className="text-orange-500 font-bold">Deprecated</span>
                    ) : null}
                    <span>{operation.summary || operation.description}</span>
                </div>
            </div>
        </div>
    )
}

export default Sidebar;