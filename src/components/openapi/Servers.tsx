import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, ServerIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { ServerObject } from '@/types/unified-openapi-types';

interface ServerVariable {
    enum?: string[];
    default?: string;
    description?: string;
}

interface ServerBlockProps {
    servers: ServerObject[];
}

const Servers: React.FC<ServerBlockProps> = ({ servers }) => {
    const [openServerPopover, setOpenServerPopover] = useState(false);
    const [selectedServer, setSelectedServer] = useState(servers[0] || null);
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [computedUrl, setComputedUrl] = useState('');
    const [openVariablePopovers, setOpenVariablePopovers] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (selectedServer?.variables) {
            const defaultVars: Record<string, string> = {};
            Object.entries(selectedServer.variables).forEach(([key, value]) => {
                defaultVars[key] = (value as ServerVariable).default || '';
            });
            setVariables(defaultVars);
        } else {
            setVariables({});
        }
    }, [selectedServer]);

    useEffect(() => {
        if (selectedServer) {
            let url = selectedServer.url;
            Object.entries(variables).forEach(([key, value]) => {
                url = url.replace(`{${key}}`, value);
                setComputedUrl(url);
            });
        }
    }, [selectedServer, variables]);

    const handleVariableChange = (name: string, value: string) => {
        setVariables(prev => ({
            ...prev,
            [name]: value
        }));
        setOpenVariablePopovers(prev => ({
            ...prev,
            [name]: false
        }));
    };

    const hasVariables = selectedServer?.variables && Object.entries(selectedServer.variables).length > 0;

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-xl font-semibold">
                    <ServerIcon className="mr-2 h-5 w-5"/>
                    Servers
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    <div className={cn("w-full")}>
                        <div className="relative pt-4">
                            <Popover open={openServerPopover} onOpenChange={setOpenServerPopover}>
                                <PopoverTrigger asChild>
                                    {selectedServer ? (
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openServerPopover}
                                            className="w-full justify-between"
                                        >
                                            {selectedServer.url}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50"/>
                                        </Button>
                                    ) : (
                                        <Button variant="secondary" className="w-full p-2 cursor-not-allowed">
                                            No servers available
                                        </Button>
                                    )}
                                </PopoverTrigger>

                                {selectedServer && (
                                    <PopoverContent className="p-0 w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height]">
                                        <Command>
                                            <CommandInput placeholder="Search server..."/>
                                            <CommandList>
                                                <CommandEmpty>No server found</CommandEmpty>
                                                <CommandGroup>
                                                    {servers.map((server) => (
                                                        <CommandItem
                                                            key={server.url}
                                                            value={server.url}
                                                            onSelect={() => {
                                                                setSelectedServer(server);
                                                                setOpenServerPopover(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedServer?.url === server.url ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            <div>
                                                                <p>{server.url}</p>
                                                                {server.description && (
                                                                    <p className="text-xs">
                                                                        {server.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                )}
                            </Popover>
                            {computedUrl && (
                                <span className="block text-sm mb-2">
                                    {computedUrl}
                                </span>
                            )}
                        </div>
                    </div>

                    {hasVariables && (
                        <div className="px-2 max-h-96 overflow-y-auto pr-2">
                            <div className="grid grid-cols-2 gap-8">
                                {Object.entries(selectedServer.variables ?? []).map(([name, variable]) => (
                                    <div key={name} className="space-y-2 my-2">
                                        <label className="ms-2 text-sm font-medium block">
                                            {name}
                                            {variable.description && (
                                                <span className="ml-2 text-xs">
                                                    {variable.description}
                                                </span>
                                            )}
                                        </label>
                                        {(variable as ServerVariable).enum ? (
                                            <Popover
                                                open={openVariablePopovers[name]}
                                                onOpenChange={(open) =>
                                                    setOpenVariablePopovers(prev => ({
                                                        ...prev,
                                                        [name]: open
                                                    }))
                                                }
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={openVariablePopovers[name]}
                                                        className="w-full justify-between"
                                                    >
                                                        {variables[name] || `Select ${name}`}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50"/>
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                                                    <Command>
                                                        <CommandInput placeholder={`Search ${name}...`}/>
                                                        <CommandList>
                                                            <CommandEmpty>No option found</CommandEmpty>
                                                            <CommandGroup>
                                                                {(variable as ServerVariable).enum?.map((option) => (
                                                                    <CommandItem
                                                                        key={option}
                                                                        value={option}
                                                                        onSelect={() => handleVariableChange(name, option)}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                variables[name] === option ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {option}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            <Input
                                                value={variables[name]}
                                                onChange={(e) => handleVariableChange(name, e.target.value)}
                                                placeholder={`Enter ${name}`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default Servers;