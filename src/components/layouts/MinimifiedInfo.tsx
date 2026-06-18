import React, { useState } from 'react';
import { useOpenAPIContext } from '@/hooks/OpenAPIContext';
import { Button } from '@/components/ui/button';
import { Home, Check, ChevronsUpDown, SlidersHorizontal } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import AuthButton from "@/components/openapi/Auth/AuthButton";
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ServerObject } from '@/types/unified-openapi-types';

const MinimifiedInfo: React.FC = () => {
    const { spec, computedUrl, setComputedUrl, serverVariables, setServerVariables } = useOpenAPIContext();
    const servers = spec.servers ?? [];
    const hasMultipleServers = servers.length > 1;

    const [selectedServer, setSelectedServer] = useState<ServerObject | null>(servers[0] ?? null);
    const [openServers, setOpenServers] = useState(false);
    const [openVars, setOpenVars] = useState(false);

    const hasVariables = !!selectedServer?.variables && Object.keys(selectedServer.variables).length > 0;

    const handleServerSelect = (server: ServerObject) => {
        setSelectedServer(server);
        setOpenServers(false);

        let newUrl = server.url === '/'
            ? `${window.location.protocol}//${window.location.host}`
            : server.url;

        if (server.variables) {
            const defaultVars: Record<string, string> = {};
            Object.entries(server.variables).forEach(([key, variable]) => {
                defaultVars[key] = variable.default;
                newUrl = newUrl.replace(`{${key}}`, variable.default);
            });
            setServerVariables(defaultVars);
        } else {
            setServerVariables({});
        }

        setComputedUrl(newUrl);
    };

    const handleVariableChange = (name: string, value: string) => {
        const newVariables = { ...serverVariables, [name]: value };
        setServerVariables(newVariables);

        if (!selectedServer) return;
        let newUrl = selectedServer.url;
        Object.entries(newVariables).forEach(([key, val]) => {
            newUrl = newUrl.replace(`{${key}}`, val);
        });
        setComputedUrl(newUrl);
    };

    return (
        <div className="bg-muted/60 backdrop-blur-md sticky top-0 z-50 w-full shadow-sm">
            <div className="flex items-center gap-3 h-16 px-4">
                <Link to="/" className="hover:opacity-80 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Home className="h-4 w-4" />
                    </Button>
                </Link>

                <span className="text-sm font-semibold shrink-0 truncate max-w-[180px]">
                    {spec.info.title}
                </span>

                <div className="h-4 w-px bg-border shrink-0" />

                <div className="flex-1 min-w-0">
                    {hasMultipleServers ? (
                        <Popover open={openServers} onOpenChange={setOpenServers}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openServers}
                                    className="w-full font-mono text-sm justify-between px-3"
                                >
                                    <span className="truncate">{computedUrl}</span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                                <Command>
                                    <CommandList>
                                        <CommandGroup>
                                            {servers.map((server) => (
                                                <CommandItem
                                                    key={server.url}
                                                    value={server.url}
                                                    onSelect={() => handleServerSelect(server)}
                                                >
                                                    <Check className={cn(
                                                        "mr-2 h-4 w-4 shrink-0",
                                                        selectedServer?.url === server.url ? "opacity-100" : "opacity-0"
                                                    )} />
                                                    <div className="min-w-0">
                                                        <p className="font-mono text-sm truncate">{server.url}</p>
                                                        {server.description && (
                                                            <p className="text-xs text-muted-foreground truncate">{server.description}</p>
                                                        )}
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <Input
                            value={computedUrl}
                            readOnly
                            className="font-mono text-sm bg-muted/50"
                        />
                    )}
                </div>

                {hasVariables && selectedServer?.variables && (
                    <Popover open={openVars} onOpenChange={setOpenVars}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0">
                                <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72" align="end">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Variables</p>
                                    <p className="font-mono text-xs break-all text-foreground/70">{computedUrl}</p>
                                </div>
                                <div className="space-y-3">
                                    {Object.entries(selectedServer.variables).map(([name, variable]) => (
                                        <div key={name} className="space-y-1">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <span className="font-mono">{`{${name}}`}</span>
                                                {variable.description && (
                                                    <span className="text-xs text-muted-foreground font-sans">{variable.description}</span>
                                                )}
                                            </label>
                                            {variable.enum ? (
                                                <Select
                                                    value={serverVariables[name] ?? variable.default}
                                                    onValueChange={(val) => handleVariableChange(name, val)}
                                                >
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {variable.enum.map((opt) => (
                                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Input
                                                    value={serverVariables[name] ?? variable.default}
                                                    onChange={(e) => handleVariableChange(name, e.target.value)}
                                                    className="h-8 text-sm font-mono"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                )}

                <div className="shrink-0">
                    <AuthButton securitySchemes={spec.components?.securitySchemes} />
                </div>
            </div>
        </div>
    );
};

export default MinimifiedInfo;
