import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingComponent = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg font-medium text-muted-foreground">Loading...</p>
    </div>
  );
};

export default LoadingComponent;