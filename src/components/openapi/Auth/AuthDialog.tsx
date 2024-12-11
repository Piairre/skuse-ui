import React, {useState} from 'react';
import {
    Dialog,
    DialogContent, DialogDescription,
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
import {ShieldCheck} from 'lucide-react';
import {OpenAPIV3} from 'openapi-types';
import {getAuthMethodComponent, getSchemeIcon} from './AuthMethods';
import {resolveReferences} from "@/utils/openapi";
import {useOpenAPIContext} from "@/hooks/OpenAPIContext";

interface AuthDialogProps {
    children: React.ReactNode;
    securitySchemes: {
        [key: string]: OpenAPIV3.SecuritySchemeObject
    }
}

const AuthDialog: React.FC<AuthDialogProps> = ({children, securitySchemes}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogDescription />
                    <DialogTitle className="flex items-center">
                        <ShieldCheck className="mr-2 h-5 w-5 text-primary"/>
                        Authentication Methods
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue={Object.keys(securitySchemes)[0]} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        {Object.entries(securitySchemes).map(([name, scheme]) => {
                            return (
                                <TabsTrigger key={name} value={name}>
                                    {getSchemeIcon(scheme.type)}
                                    {name}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    {Object.entries(securitySchemes).map(([name, scheme]) => {
                        if ('type' in scheme) {
                            const AuthMethodComponent = getAuthMethodComponent(scheme);
                            return (
                                <TabsContent key={name} value={name}>
                                    <AuthMethodComponent name={name} scheme={scheme}/>
                                </TabsContent>
                            );
                        }
                        return null;
                    })}
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default AuthDialog;