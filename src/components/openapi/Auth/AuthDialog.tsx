import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { ShieldCheck } from 'lucide-react';
import { getAuthMethodComponent, getSchemeIcon } from './AuthMethods';
import { SecuritySchemeObject, AuthCredential } from "@/types/unified-openapi-types";
import { useOpenAPIContext } from '@/hooks/OpenAPIContext';

interface AuthDialogProps {
    securitySchemes: Record<string, SecuritySchemeObject>;
    children: React.ReactNode;
}

const AuthDialog: React.FC<AuthDialogProps> = ({ children, securitySchemes }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { credentials } = useOpenAPIContext();
    const initialCredentialsRef = useRef<Record<string, AuthCredential>>({});
    const schemeEntries = Object.entries(securitySchemes);

    const handleOpenChange = (open: boolean) => {
        if (open) {
            // Snapshot credentials at open time so we can detect new ones
            initialCredentialsRef.current = { ...credentials };
        }
        setIsOpen(open);
    };

    // Auto-close when a new credential is set (any flow: popup, password, clientCredentials)
    useEffect(() => {
        if (!isOpen) return;
        const hasNewCredential = schemeEntries.some(
            ([name]) => credentials[name] && credentials[name] !== initialCredentialsRef.current[name]
        );
        if (hasNewCredential) {
            setIsOpen(false);
            toast.success('Authenticated successfully');
        }
    }, [credentials, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent
                className="sm:max-w-[540px] flex flex-col max-h-[85vh] gap-0 p-0"
                onInteractOutside={(e) => {
                    const target = (e as CustomEvent<{ originalEvent: PointerEvent }>)
                        .detail?.originalEvent?.target as HTMLElement | null;
                    if (target?.closest('[data-sonner-toaster]')) {
                        e.preventDefault();
                    }
                }}
            >
                <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                        Available authorizations
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Configure authentication credentials for this API.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue={schemeEntries[0]?.[0]} className="flex flex-col flex-1 min-h-0">
                    {schemeEntries.length > 1 && (
                        <div className="px-6 pt-4 shrink-0">
                            <TabsList className="w-full h-auto flex flex-wrap gap-1 bg-muted p-1 rounded-lg">
                                {schemeEntries.map(([name, scheme]) => {
                                    const isAuth = !!credentials[name];
                                    return (
                                        <TabsTrigger
                                            key={name}
                                            value={name}
                                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 flex-1 min-w-0"
                                        >
                                            {getSchemeIcon(scheme.type)}
                                            <span className="truncate">{name}</span>
                                            {isAuth && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                            )}
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto">
                        {schemeEntries.map(([name, scheme]) => {
                            const AuthMethodComponent = getAuthMethodComponent(scheme);
                            return (
                                <TabsContent key={name} value={name} className="m-0 px-6 py-5">
                                    <AuthMethodComponent scheme={scheme} schemeName={name} />
                                </TabsContent>
                            );
                        })}
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default AuthDialog;
