import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, ServerIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { ServerObject } from '@/types/unified-openapi-types';
import { useOpenAPIContext } from '@/hooks/OpenAPIContext';

interface ServerVariable {
    enum?: string[];
    default?: string;
    description?: string;
}

interface ServerBlockProps {
    servers: ServerObject[];
}

interface VariableSelectorProps {
    name: string;
    variable: ServerVariable;
    value: string;
    onChange: (name: string, value: string) => void;
}

const VariableSelector: React.FC<VariableSelectorProps> = ({ name, variable, value, onChange }) => {
    const [open, setOpen] = useState(false);

    if (variable.enum) {
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {value || `Select ${name}`}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50"/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                    <Command>
                        <CommandInput placeholder={`Search ${name}...`}/>
                        <CommandList>
                            <CommandEmpty>No option found</CommandEmpty>
                            <CommandGroup>
                                {variable.enum.map((option) => (
                                    <CommandItem
                                        key={option}
                                        value={option}
                                        onSelect={() => {
                                            onChange(name, option);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option ? "opacity-100" : "opacity-0"
                                        )}/>
                                        {option}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <Input
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            placeholder={`Enter ${name}`}
        />
    );
};

const Servers: React.FC<ServerBlockProps> = ({ servers }) => {
    const { computedUrl, setComputedUrl, serverVariables, setServerVariables } = useOpenAPIContext();
    const [openServerPopover, setOpenServerPopover] = useState(false);

    const defaultServer = { url: '/', description: 'Current instance' };
    const effectiveServers = servers.length > 0 ? servers : [defaultServer];
    const [selectedServer, setSelectedServer] = useState<ServerObject>(effectiveServers[0] as ServerObject);

    const handleServerSelect = (server: ServerObject) => {
        setSelectedServer(server);
        setOpenServerPopover(false);

        let newUrl = server.url === '/' ?
            `${window.location.protocol}//${window.location.host}` :
            server.url;

        if (server.variables) {
            const defaultVars: Record<string, string> = {};
            Object.entries(server.variables).forEach(([key, value]) => {
                defaultVars[key] = value.default || '';
                newUrl = newUrl.replace(`{${key}}`, value.default || '');
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

        let newUrl = selectedServer.url;
        Object.entries(newVariables).forEach(([key, val]) => {
            newUrl = newUrl.replace(`{${key}}`, val);
        });
        setComputedUrl(newUrl);
    };

    const hasVariables = selectedServer?.variables &&
        Object.entries(selectedServer.variables).length > 0;

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-xl font-semibold">
                    <ServerIcon className="mr-2 h-5 w-5"/>
                    {servers.length === 0 ? 'Default Server' : 'Servers'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    <div className="w-full">
                        <div className="relative pt-4">
                            <Popover open={openServerPopover} onOpenChange={setOpenServerPopover}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openServerPopover}
                                        className="w-full justify-between rounded-md"
                                    >
                                        {selectedServer?.url || '/'}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50"/>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                                    <Command>
                                        <CommandList>
                                            <CommandEmpty>No server found</CommandEmpty>
                                            <CommandGroup>
                                                {effectiveServers.map((server) => (
                                                    <CommandItem
                                                        key={server.url}
                                                        value={server.url}
                                                        onSelect={() => handleServerSelect(server)}
                                                    >
                                                        <Check className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedServer?.url === server.url ? "opacity-100" : "opacity-0"
                                                        )}/>
                                                        <div>
                                                            <p>{server.url}</p>
                                                            {server.description && (
                                                                <p className="text-xs">{server.description}</p>
                                                            )}
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {computedUrl && hasVariables && (
                                <span className="block text-xs mt-1">Computed URL: {computedUrl}</span>
                            )}
                        </div>
                    </div>

                    {hasVariables && (
                        <div className="px-2 max-h-96 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-8">
                                {Object.entries(selectedServer.variables ?? {}).map(([name, variable]) => (
                                    <div key={name} className="space-y-2 my-2">
                                        <label className="ms-2 text-sm font-medium block">
                                            {name}
                                            {variable.description && (
                                                <span className="ml-2 text-xs">{variable.description}</span>
                                            )}
                                        </label>
                                        <VariableSelector
                                            name={name}
                                            variable={variable}
                                            value={serverVariables[name] || variable.default || ''}
                                            onChange={handleVariableChange}
                                        />
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