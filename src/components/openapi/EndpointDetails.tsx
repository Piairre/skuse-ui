import React from 'react';
import {Card, CardHeader, CardTitle, CardContent, CardDescription} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedOperationObject } from "@/types/openapi";
import {getBadgeColor} from "@/utils/openapi";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";

interface EndpointDetailsProps {
    operation: EnhancedOperationObject | null;
}

const EndpointDetails: React.FC<EndpointDetailsProps> = ({ operation }) => {
    if (!operation) {
        // TODO: This can be improved with a 404 page
        return (
            <div>Not found</div>
        );
    }

    return (
        <Card className="w-full mx-auto">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Badge
                        className={`${getBadgeColor(operation.method.toLowerCase())} text-white text-lg uppercase flex justify-center items-center`}
                    >
                        {operation.method.toUpperCase()}
                    </Badge>
                    <CardTitle className="text-2xl">
                        {operation.path}
                    </CardTitle>
                </div>
                <CardDescription className="text-base">
                    {operation.summary}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {operation.description && (
                    <FormattedMarkdown className={"p-2"} markdown={operation.description} />
                )}
            </CardContent>
        </Card>
    );
};

export default EndpointDetails;