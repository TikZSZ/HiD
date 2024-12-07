import { createBrowserRouter } from "react-router-dom";
import Home from "@/components/pages/Home";
import App from "./App";
import { lazy } from "react";
import { DIDCreatePage } from "./components/pages/CreateDID";


const LoginPage = lazy(() => import("@/components/pages/LoginPage"));
const ProtectedLayout = lazy(() => import("@/components/pages/AuthLayout"));
const SignupPage = lazy(() => import("@/components/pages/SignupPage"));
const RouterErrorPage = lazy(() => import("@/components/pages/ErrorPage"));
const DashboardLayout = lazy(() => import("@/components/pages/DashboardLayout"));
const DashboardPage = lazy(() => import("@/components/pages/Dashboard"));

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full transition-all duration-300 ease-in-out transform">
    {children}
  </div>
);


export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <RouterErrorPage />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/login",
        element: (
          <ProtectedLayout authentication={false}>
            <LoginPage />
          </ProtectedLayout>
        ),
      },
      {
        path: "/signup",
        element: (
          <ProtectedLayout authentication={false}>
            <SignupPage />
          </ProtectedLayout>
        ),
      },
      {
        path: "/dashboard",
        element: (
          <ProtectedLayout authentication>
            <DashboardLayout/>
          </ProtectedLayout>
        ),
        children: [
          {
            index:true,
            element: (
              <PageWrapper>
                <DashboardPage/>
              </PageWrapper>
            ),
          },
          {
            path:"/dashboard/create-did",
            element:<PageWrapper> <DIDCreatePage /> </PageWrapper>
          },
          // {
          //   path:"/dashboard/tokens",
          //   children:[
          //     {
          //       index: true,
          //       element: <PageWrapper><TokensPage /></PageWrapper>,
          //     },
          //     {
          //       path: ":tokenId",
          //       element: <PageWrapper><TokenDetailPage /></PageWrapper>,
                
          //     },
          //   ]
          // },
          // {
          //   path:"account",
          //   element: (
          //     <PageWrapper>
          //       <AccountPage/>
          //     </PageWrapper>
          //   ),

          // },
        ],
      },
    ],
  },
]);