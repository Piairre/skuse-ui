import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedOperationObject } from "@/types/openapi";

interface EndpointDetailsProps {
    operation: EnhancedOperationObject | null;
}

const EndpointDetails: React.FC<EndpointDetailsProps> = ({ operation }) => {
    if (!operation) {
        return (
            <div>Not found</div>
        );
    }

    return (
        <Card className="w-full mx-auto">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-lg">
                        {operation.method.toUpperCase()}
                    </Badge>
                    <CardTitle className="text-xl">
                        {operation.path}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {operation.summary && (
                        <div>
                            <h3 className="text-lg font-semibold">Summary</h3>
                            <p>{operation.summary}</p>
                        </div>
                    )}

                    {operation.description && (
                        <div>
                            <h3 className="text-lg font-semibold">Description</h3>
                            <p>{operation.description}</p>
                        </div>
                    )}

                    {/* Vous pourrez ajouter ici d'autres sections comme :
           * - Parameters
           * - Request Body
           * - Responses
           * - Examples
           */}
                </div>
            </CardContent>
        </Card>
    );
};

export default EndpointDetails;