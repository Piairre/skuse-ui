import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const HomeSkeleton = () => {
    return (
        <div className="flex-1 overflow-y-auto m-2">
            <Card className="w-full mx-auto">
                <CardHeader>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-32" />
                                <Skeleton className="h-8 w-32" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-32" />
                                <Skeleton className="h-8 w-32" />
                            </div>
                        </div>
                    </div>
                    <Skeleton className="h-8 w-64 mb-4" />
                </CardHeader>
                <CardContent>
                    <div className="grid lg:grid-cols-2 gap-2 mb-2">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center">
                                    <Skeleton className="h-6 w-24" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center">
                                    <Skeleton className="h-6 w-32" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-24 w-full" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-2 mt-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-4 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default HomeSkeleton;