import React from 'react';
import { useOpenAPIContext } from '@/hooks/OpenAPIContext';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import AuthButton from "@/components/openapi/Auth/AuthButton";

const MinimifiedInfo: React.FC = () => {
    const { spec, computedUrl } = useOpenAPIContext();

    if (!spec) return null;

    return (
        <div className={"bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full h-14"}>
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-14">
                    <div className="flex items-center space-x-4">
                        <Link to="/" className="hover:opacity-80">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Home className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h2 className="text-sm font-semibold truncate max-w-[200px]">
                            {spec.info.title}
                        </h2>
                    </div>

                    <div className="flex-1 mx-4">
                        <div className="relative w-full max-w-2xl mx-auto">
                            <input
                                type="text"
                                value={computedUrl}
                                readOnly
                                className="w-full h-8 px-3 text-sm bg-muted rounded-md font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <AuthButton securitySchemes={spec.components?.securitySchemes} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MinimifiedInfo;