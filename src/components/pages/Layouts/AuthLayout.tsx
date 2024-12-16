import { useAuth } from "@/hooks/useAuth";
import { LoaderCircle } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import React from 'react';
import { Loader2 } from 'lucide-react';

const AppLoadingSpinner = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background bg-opacity-75">
      <div className="bg-card rounded-lg p-8 shadow-lg flex flex-col items-center space-y-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-xl font-medium text-foreground">Loading...</p>
      </div>
    </div>
  );
};


const ProtectedLayout = ({
  children,
  authentication,
}: {
  children: any;
  authentication: boolean;
}) => {
  const {user,loading} = useAuth()

  const navigate = useNavigate();
  const [loader, setLoader] = useState(true);

  useEffect(() => {
    if(loading) return 
    if (authentication && user === null) {
      navigate("/login");
    } else if (!authentication && user !== null) {
      navigate("/");
    }
    setLoader(false);
  }, [user, authentication, navigate,loading]);
  return <>{loader? <AppLoadingSpinner/> : children} </>
};

export default ProtectedLayout;