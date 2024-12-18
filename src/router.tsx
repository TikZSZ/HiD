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
const DocsPage = lazy( () => import( "@/components/pages/DocsPage" ) );

const KeysPage = lazy( () => import( "@/components/pages/Wallet/KeysPage" ) );
const DIDsPage = lazy( () => import( "@/components/pages/Wallet/DIDsPage" ) );
const UserVCsPage = lazy( () => import( "@/components/pages/Wallet/UserVCsPage" ) );
const UserVPsPage = lazy( () => import( "@/components/pages/Wallet/VPsPage" ) );
const ViewVCPage = lazy( () => import( "./components/pages/Wallet/VCView" ) )
const ViewVPPage = lazy( () => import( "./components/pages/VPView" ) )

const OrganizationsPage = lazy( () => import( "./components/pages/Orgs/OrgsPage" ) )
const ManageOrganizationPage = lazy( () => import( "./components/pages/Orgs/ManageOrganizationPage" ) )
const OrgVCsPage = lazy( () => import( "./components/pages/Orgs/OrgVCsPage" ) )
const OrgVCViewPage = lazy( () => import( "./components/pages/Orgs/OrgVCViewPage" ) )
const OrgVPsPage = lazy( () => import( "@/components/pages/Orgs/OrgVPsPage" ) );



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
        path: "/docs",
        element: (
            <DocsPage />
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
            path: "wallet/vcs",
            element: <PageWrapper>
              <UserVCsPage />
            </PageWrapper>,
          },
          {
            path: "wallet/vcs/:vcId",
            element: <PageWrapper>
              <ViewVCPage />
            </PageWrapper>,
          },
          {
            path: "wallet/vps",
            element: <PageWrapper>
              <UserVPsPage />
            </PageWrapper>,
          },
          {
            path: "wallet/vps/:vpId",
            element: <PageWrapper>
              <ViewVPPage />
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
              <OrgVCViewPage />
            </PageWrapper>,
          },
          {
            path: "orgs/:orgId?/vps",
            element: <PageWrapper>
              <OrgVPsPage />
            </PageWrapper>,
          },
          {
            path: "orgs/:orgId/vps/:vpId",
            element: <PageWrapper>
              <ViewVPPage />
            </PageWrapper>,
          },
        ],
      },
    ],
  },
] );