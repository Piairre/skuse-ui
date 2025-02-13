import React from 'react';
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import {ShieldCheck, Lock} from 'lucide-react';
import {OpenAPIV3} from 'openapi-types';
import AuthDialog from './AuthDialog';
import {Button} from "@/components/ui/button";

interface AuthProps {
    securitySchemes: {
        [key: string]: OpenAPIV3.SecuritySchemeObject
    } | null;
}

const Auth: React.FC<AuthProps> = ({securitySchemes}) => {

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold">
                    <ShieldCheck className="mr-2 h-5 w-5 text-primary"/>
                    Authentication
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {securitySchemes === null ? (
                    <Button
                        variant={"secondary"}
                        className="w-full p-2 border rounded-lg cursor-not-allowed"
                    >
                        No authentication methods available
                    </Button>
                ) : (
                    <AuthDialog securitySchemes={securitySchemes}>
                        <AuthorizeButton />
                    </AuthDialog>
                )}
            </CardContent>
        </Card>
    );
};

export const AuthorizeButton = React.forwardRef<HTMLButtonElement, { onClick?: () => void }>(
    ({ onClick }, ref) => (
        <Button
            ref={ref}
            variant="outline"
            className="w-full p-2 border rounded-lg border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
            onClick={onClick}
        >
            <Lock className="w-5 h-5 mr-2" />
            Authorize
        </Button>
    )
);

export default Auth;