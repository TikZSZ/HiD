import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { ThemeProvider } from "@/components/ThemeProvider.tsx";
import { RouterProvider } from "react-router-dom";
import { router } from "./router.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";

import HashConnectProvider from "./contexts/hashconnect.tsx";

// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
// const queryClient = new QueryClient();
ReactDOM.createRoot( document.getElementById( "root" )! ).render(
  <AuthProvider>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <HashConnectProvider>
        <Suspense>
          <RouterProvider router={router} />
        </Suspense>
        {/* <QueryClientProvider client={queryClient}> */}
          {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        {/* </QueryClientProvider> */}
      </HashConnectProvider>
    </ThemeProvider>
  </AuthProvider>
);