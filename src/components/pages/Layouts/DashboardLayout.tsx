
// import { KeyManagementProvider } from "@/contexts/keyManager";
import { KeyProvider, KeyProviderWrapper } from "@/contexts/keyManagerCtx";
import { useAuth } from "@/hooks/useAuth";
import { SignModalProvider } from "../../app/SignModal";
import { Sidebar } from "@/components/app/sidebar/Sidebar";
import { Outlet } from "react-router-dom";


const DashboardLayout = () =>
{
  const { user } = useAuth()
  return (
    <KeyProviderWrapper userId={user!.$id} >
      <SignModalProvider>
        <Sidebar>
          <Outlet />
        </Sidebar>
      </SignModalProvider>
    </KeyProviderWrapper>
  );
};

export default DashboardLayout;