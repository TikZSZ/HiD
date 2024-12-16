import { createBrowserRouter } from "react-router-dom";
import Home from "@/components/pages/Home";
import App from "./App";
import { lazy } from "react";


const LoginPage = lazy( () => import( "@/components/pages/LoginPage" ) );
const ProtectedLayout = lazy( () => import( "@/components/pages/Layouts/AuthLayout" ) );
const SignupPage = lazy( () => import( "@/components/pages/SignupPage" ) );
const RouterErrorPage = lazy( () => import( "@/components/pages/ErrorPage" ) );
const DashboardLayout = lazy( () => import( "@/components/pages/Layouts/DashboardLayout" ) );
const DashboardPage = lazy( () => import( "@/components/pages/Dashboard" ) );
const KeysPage = lazy( () => import( "@/components/pages/Wallet/KeysPage" ) );
const DIDsPage = lazy( () => import( "@/components/pages/Wallet/DIDsPage" ) );
const OrganizationsPage = lazy( () => import( "./components/pages/Orgs/OrgsPage" ) )
const ManageOrganizationPage = lazy( () => import( "./components/pages/Orgs/ManageOrganizationPage" ) )
const OrgVCsPage = lazy( () => import( "./components/pages/Orgs/VCsPage" ) )
const VCViewPage = lazy( () => import( "./components/pages/Orgs/VCViewPage" ) )



const PageWrapper = ( { children }: { children: React.ReactNode } ) => (
  <div className="w-full transition-all duration-300 ease-in-out transform">
    {children}
  </div>
);


export const router = createBrowserRouter( [
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
            <DashboardLayout />
          </ProtectedLayout>
        ),
        
        errorElement: <RouterErrorPage />,
        children: [
          {
            index: true,
            element: (
              <PageWrapper>
                <DashboardPage />
              </PageWrapper>
            ),
          },
          {
            path: "wallet/keys",
            index: true,
            element: <PageWrapper>
              <KeysPage />
            </PageWrapper>,
          },
          {
            path: "wallet/dids",
            element: <PageWrapper>
              <DIDsPage />
            </PageWrapper>,
          },
          {
            path: "orgs",
            element: <PageWrapper>
              <OrganizationsPage />
            </PageWrapper>,
          },
          {
            path: "orgs/:orgId?/manage",
            element: <PageWrapper>
              <ManageOrganizationPage />
            </PageWrapper>,
          },
          {
            path: "orgs/:orgId?/vcs",
            element: <PageWrapper>
              <OrgVCsPage />
            </PageWrapper>,
          },
          {
            path: "orgs/:orgId?/vcs/:vcId",
            element: <PageWrapper>
              <VCViewPage />
            </PageWrapper>,
          },
          // {
          //   path: "orgs/manage",
          //   element: <PageWrapper>
          //     <ManageOrganizationPage />
          //   </PageWrapper>,
          // },
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
] );