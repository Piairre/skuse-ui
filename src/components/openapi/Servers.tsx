import React, {useEffect, useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Button} from "@/components/ui/button";
import {Check, ChevronsUpDown, ServerIcon} from 'lucide-react';
import {cn} from "@/lib/utils";
import {ServerObject} from '@/types/unified-openapi-types';
import {useOpenAPIContext} from '@/hooks/OpenAPIContext';

interface ServerVariable {
    enum?: string[];
    default?: string;
    description?: string;
}

interface ServerBlockProps {
    servers: ServerObject[];
}

const getDefaultServer = () => ({
    url: `${window.location.protocol}//${window.location.host}`,
    description: 'Current Skuse instance'
});


const Servers: React.FC<ServerBlockProps> = ({ servers }) => {
    const { computedUrl, setComputedUrl, serverVariables, setServerVariables } = useOpenAPIContext();
    const [openServerPopover, setOpenServerPopover] = useState(false);
    const defaultServer = {
        url: '/',
        description: 'Current instance'
    };
    const effectiveServers = servers.length > 0 ? servers : [defaultServer];
    const [selectedServer, setSelectedServer] = useState<ServerObject>(effectiveServers[0] || getDefaultServer());
    const [openVariablePopovers, setOpenVariablePopovers] = useState<Record<string, boolean>>({});

    const getCurrentUrl = () => {
        return `${window.location.protocol}//${window.location.host}`;
    };

    // Initialisation des variables par défaut uniquement si elles n'existent pas déjà
    useEffect(() => {
        if (selectedServer?.variables && Object.keys(serverVariables).length === 0) {
            const defaultVars: Record<string, string> = {};
            Object.entries(selectedServer.variables).forEach(([key, value]) => {
                defaultVars[key] = value.default || '';
            });
            setServerVariables(defaultVars);
        }
    }, [selectedServer, serverVariables, setServerVariables]);

    useEffect(() => {
        if (selectedServer) {
            let url = selectedServer.url;

            if (url === '/' || !servers.length) {
                url = getCurrentUrl();
            }

            Object.entries(serverVariables).forEach(([key, value]) => {
                url = url.replace(`{${key}}`, value);
            });

            setComputedUrl(url);
        }
    }, [selectedServer, serverVariables, setComputedUrl, servers.length]);

    const handleVariableChange = (name: string, value: string) => {
        setServerVariables({
            ...serverVariables,
            [name]: value
        });
        setOpenVariablePopovers(prev => ({
            ...prev,
            [name]: false
        }));
    };

    const handleServerSelect = (server: ServerObject) => {
        setSelectedServer(server);
        setOpenServerPopover(false);
        // Réinitialiser les variables si on change de serveur
        if (server.variables) {
            const defaultVars: Record<string, string> = {};
            Object.entries(server.variables).forEach(([key, value]) => {
                defaultVars[key] = value.default || '';
            });
            setServerVariables(defaultVars);
        } else {
            setServerVariables({});
        }
    };

    const hasVariables = selectedServer?.variables && Object.entries(selectedServer.variables).length > 0;

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

                                <PopoverContent className="p-0 w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height]">
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
                            </Popover>
                            {computedUrl && hasVariables && (
                                <span className="block text-sm mt-2">
                                    {computedUrl}
                                </span>
                            )}
                        </div>
                    </div>

                    {hasVariables && (
                        <div className="px-2 max-h-96 overflow-y-auto">
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
                                                        {serverVariables[name] || `Select ${name}`}
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
                                                                                serverVariables[name] === option ? "opacity-100" : "opacity-0"
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
                                                value={serverVariables[name]}
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