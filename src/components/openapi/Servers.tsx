import React, {useState} from 'react';
import {OpenAPIV3} from "openapi-types";
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
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
import {Button} from "@/components/ui/button";
import {Check, ChevronsUpDown, ServerIcon} from 'lucide-react';
import {cn} from "@/lib/utils";

interface ServerBlockProps {
    servers: OpenAPIV3.ServerObject[];
}

const Servers: React.FC<ServerBlockProps> = ({servers}) => {

    const [openServerPopover, setOpenServerPopover] = useState(false);
    const [selectedServer, setSelectedServer] = useState(servers[0] || null);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold">
                    <ServerIcon className="mr-2 h-5 w-5 text-primary"/>
                    Servers
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Popover open={openServerPopover} onOpenChange={setOpenServerPopover}>
                    <PopoverTrigger asChild>
                        {selectedServer ? (
                            <Button variant="outline" role="combobox" aria-expanded={openServerPopover}
                                    className="w-full justify-between">
                                {selectedServer.url}
                                <ChevronsUpDown className="opacity-50"/>
                            </Button>
                        ) : (
                            <Button variant="secondary" className="w-full p-2 border rounded-lg cursor-not-allowed">
                                No servers available
                            </Button>
                        )}
                    </PopoverTrigger>

                    {selectedServer && (
                        <PopoverContent
                            className="p-0 w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height]">
                            <Command>
                                <CommandInput placeholder="Search server..."/>
                                <CommandList>
                                    <CommandEmpty>No server found</CommandEmpty>
                                    <CommandGroup>
                                        {servers.map((server) => (
                                            <CommandItem key={server.url} value={server.url} onSelect={() => {
                                                setSelectedServer(server);
                                            }}>
                                                <Check
                                                    className={cn("mr-2 h-4 w-4", selectedServer?.url === server.url ? "opacity-100" : "opacity-0")}/>
                                                <div>
                                                    <p>{server.url}</p>
                                                    {server.description && (
                                                        <p className="text-xs text-muted-foreground">
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
            </CardContent>
        </Card>
    )
        ;
};

export default Servers;