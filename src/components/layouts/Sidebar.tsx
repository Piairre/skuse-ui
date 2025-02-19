import React, {useState} from 'react';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {ChevronDown, ChevronUp, Moon, Sun} from 'lucide-react';
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {EnhancedOperationObject} from "@/types/openapi";
import {getBadgeColor, getOperationId, groupEndpointsByTags} from "@/utils/openapi";
import {useOpenAPIContext} from "@/hooks/OpenAPIContext";
import {Link} from "@tanstack/react-router";
import {useTheme} from "@/components/theme-provider";
import {Switch} from "@/components/ui/switch";

const Sidebar: React.FC = () => {
    const [openTag, setOpenTag] = useState<string | null>(null);

    const {spec} = useOpenAPIContext();
    const groupedEndpointsByTag = groupEndpointsByTags(spec?.paths);
    const { theme, setTheme } = useTheme();

    const tags = Object.entries(groupedEndpointsByTag);

    if (tags?.length === 1 && tags[0]?.[0] && !openTag) {
        setOpenTag(tags[0][0]);
    }

    return (
        <div className="w-80 shadow-lg flex flex-col h-full">
            <div className="flex-grow py-2 overflow-y-auto">
                {tags.map(([tag, endpoints]) => (
                    <Collapsible
                        key={`collapsible-${tag}`}
                        open={openTag === tag}
                        onOpenChange={(isOpen) => setOpenTag(isOpen ? tag : null)}
                    >
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                className="w-full justify-between hover:bg-secondary/20 dark:hover:bg-zinc-700/50 mb-2 hover:text-primary hover:border-l-4 hover:border-primary transition-all duration-200"
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
                                    <SidebarEndpoint
                                        key={`${tag}-${operation.operationId || operation.path}-${operation.method}`}
                                        operation={operation}
                                        tag={tag}
                                    />
                                ))}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                ))}
            </div>

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

const SidebarEndpoint: React.FC<{ operation: EnhancedOperationObject; tag: string }> = ({operation, tag}) => {
    // Build the link to the operation
    let operationIdentifier = getOperationId(operation);

    let linkTo = `/$tag/$operationIdentifier`;
    let params = {
        operationIdentifier: operationIdentifier,
        ...(tag && {tag}) // Add tag to params if it exists
    };

    return (
        <Link
            to={linkTo}
            params={params}
            className={`flex items-center space-x-2 p-2 hover:bg-secondary/20 cursor-pointer hover:border-l-4 transition-all duration-200`}
        >
            <Badge
                className={`${getBadgeColor(operation.method.toLowerCase())} text-white uppercase w-14 flex justify-center items-center`}
            >
                {operation.method}
            </Badge>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${operation.deprecated ? 'text-zinc-400 line-through' : ''}`}>
                    {operation.path}
                </p>
                <div className="text-xs text-muted-foreground truncate">
                    {operation.deprecated ? (
                        <span className="text-orange-500 font-bold">Deprecated </span>
                    ) : null}
                    <span>{operation.description || operation.summary || operation.operationId || ''}</span>
                </div>
            </div>
        </Link>
    );
};

export default Sidebar;