import React, {useState} from 'react';
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
    Key,
    Lock,
    KeyRound,
    UserCheck,
    ShieldCheck,
    ChevronsUpDown,
    Check
} from 'lucide-react';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Command, CommandEmpty, CommandGroup, CommandItem, CommandList} from "@/components/ui/command";
import {cn} from "@/lib/utils";
import {AuthorizeButton} from "@/components/openapi/Auth/AuthButton";
import {SecuritySchemeObject} from "@/types/unified-openapi-types";

type HttpScheme = Extract<SecuritySchemeObject, { type: 'http' | 'basic' }>;
type ApiKeyScheme = Extract<SecuritySchemeObject, { type: 'apiKey' }>;
type OAuth2Scheme = Extract<SecuritySchemeObject, { type: 'oauth2' }>;
type OpenIdScheme = Extract<SecuritySchemeObject, { type: 'openIdConnect' }>;

type AuthComponent = React.FC<{ scheme: SecuritySchemeObject }>;
const UnsupportedAuthMethod: AuthComponent = () => (
    <div>Unsupported authentication method</div>
);

export const BasicAuthMethod: React.FC<{
    scheme: HttpScheme
}> = ({scheme}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div className="space-y-4">
            {scheme.description && (
                <div className="text-sm text-muted-foreground">
                    <FormattedMarkdown markdown={scheme.description}/>
                </div>
            )}
            <div className="space-y-2">
                <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                />
            </div>
            <div className="space-y-2">
                <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                />
            </div>
            <AuthorizeButton onClick={() => console.log('TODO: Authenticate user')}/>
        </div>
    );
};

export const BearerTokenMethod: React.FC<{
    scheme: HttpScheme
}> = ({scheme}) => {
    const [token, setToken] = useState('');

    return (
        <div className="space-y-4">
            {scheme.description && (
                <div className="text-sm text-muted-foreground">
                    <FormattedMarkdown markdown={scheme.description}/>
                </div>
            )}
            {scheme.bearerFormat && (
                <p className="text-xs text-muted-foreground">
                    Expected format: {scheme.bearerFormat}
                </p>
            )}
            <div className="space-y-2">
                <Input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter bearer token"
                />
            </div>
            <AuthorizeButton onClick={() => console.log('TODO: Save Bearer Token')}/>
        </div>
    );
};

export const ApiKeyMethod: React.FC<{
    scheme: ApiKeyScheme
}> = ({scheme}) => {
    const [apiKey, setApiKey] = useState('');

    return (
        <div className="space-y-4">
            {scheme.description && (
                <div className="text-sm text-muted-foreground">
                    <FormattedMarkdown markdown={scheme.description}/>
                </div>
            )}
            <div className="space-y-2">
                <Input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`${scheme.name} - ${scheme.in}`}
                />
            </div>
            <AuthorizeButton onClick={() => console.log('TODO: Save API Token')}/>
        </div>
    );
};

export const OAuth2Method: React.FC<{
    scheme: OAuth2Scheme
}> = ({scheme}) => {
    type FlowType = keyof OAuth2Scheme['flows'];
    const availableFlows = Object.keys(scheme.flows) as Array<FlowType>;

    const [selectedFlow, setSelectedFlow] = useState<FlowType | null>(
        // TODO: Fix incorrect type
        availableFlows.length > 0 ? availableFlows[0] : ''
    );
    const [open, setOpen] = useState(false);

    return (
        <div className="space-y-4">
            {scheme.description && (
                <div className="text-sm text-muted-foreground">
                    <FormattedMarkdown markdown={scheme.description}/>
                </div>
            )}

            <div className="space-y-2">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                        >
                            {selectedFlow
                                ? availableFlows.find((flow) => flow === selectedFlow)
                                : "Choose Authentication Flow"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height]">
                        <Command>
                            <CommandList>
                                <CommandEmpty>No flow found.</CommandEmpty>
                                <CommandGroup>
                                    {availableFlows.map((flow) => (
                                        <CommandItem
                                            key={flow}
                                            value={flow}
                                            onSelect={(currentValue) => {
                                                const flowValue = currentValue as FlowType;
                                                setSelectedFlow(flowValue === selectedFlow ? null : flowValue);
                                                setOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedFlow === flow ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {flow}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {selectedFlow && (
                <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                        {scheme.flows[selectedFlow] && (
                            <>
                                {selectedFlow === 'implicit' && (
                                    <p>Authorization URL: {scheme.flows.implicit?.authorizationUrl}</p>
                                )}
                                {selectedFlow === 'authorizationCode' && (
                                    <>
                                        <p>Authorization URL: {scheme.flows.authorizationCode?.authorizationUrl}</p>
                                        <p>Token URL: {scheme.flows.authorizationCode?.tokenUrl}</p>
                                    </>
                                )}
                                {(selectedFlow === 'password' || selectedFlow === 'clientCredentials') && (
                                    <p>Token URL: {scheme.flows[selectedFlow]?.tokenUrl}</p>
                                )}

                                {Object.keys(scheme.flows[selectedFlow]?.scopes || {}).length > 0 && (
                                    <div>
                                        <p>Available Scopes:</p>
                                        <ul className="list-disc list-inside text-xs">
                                            {Object.entries(scheme.flows[selectedFlow]?.scopes || {}).map(([scope, description]) => (
                                                <li key={scope}>{scope}: {description}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <AuthorizeButton onClick={() => console.log('TODO: Go to OAuth Page')}/>
                </div>
            )}
        </div>
    );
};

export const OpenIDMethod: React.FC<{
    scheme: OpenIdScheme
}> = ({scheme}) => {
    return (
        <div className="space-y-4">
            {scheme.description && (
                <div className="text-sm text-muted-foreground">
                    <FormattedMarkdown markdown={scheme.description}/>
                </div>
            )}
            <div className="space-y-2">
                <span className="text-sm text-muted-foreground">OpenID Connect URL</span>
                <Input
                    value={scheme.openIdConnectUrl}
                    readOnly
                    className="cursor-not-allowed"
                />
            </div>
            <AuthorizeButton onClick={() => console.log('TODO: Go to Open ID URL')}/>
        </div>
    );
};

export const getAuthMethodComponent = (
    scheme: SecuritySchemeObject
): AuthComponent => {
    switch (scheme.type) {
        case 'http':
        case 'basic':
            if (scheme.scheme === 'basic')
                return BasicAuthMethod;
            if (scheme.scheme === 'bearer')
                return BearerTokenMethod;
            return UnsupportedAuthMethod;
        case 'apiKey':
            return ApiKeyMethod;
        case 'oauth2':
            return OAuth2Method;
        case 'openIdConnect':
            return OpenIDMethod;
        default:
            return UnsupportedAuthMethod;
    }
};

export const getSchemeIcon = (type: SecuritySchemeObject['type']) => {
    switch (type) {
        case 'http':
        case 'basic':
            return <UserCheck className="w-5 h-5 mr-2"/>;
        case 'apiKey':
            return <Key className="w-5 h-5 mr-2"/>;
        case 'oauth2':
            return <Lock className="w-5 h-5 mr-2"/>;
        case 'openIdConnect':
            return <ShieldCheck className="w-5 h-5 mr-2"/>;
        default:
            return <KeyRound className="w-5 h-5 mr-2"/>;
    }
};