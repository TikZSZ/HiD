
// import { KeyManagementProvider } from "@/contexts/keyManager";
import { KeyProviderWrapper } from "@/contexts/keyManagerProvider";
import { useAuth } from "@/hooks/useAuth";
import { SignModalProvider } from "../../app/SignModal";
import { Sidebar } from "@/components/app/sidebar/Sidebar";
import { Outlet } from "react-router-dom";
import
{
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const DashboardLayout = () =>
{
  const { user } = useAuth()
  return (
    <KeyProviderWrapper userId={user!.$id} >
      <SignModalProvider>
        <Sidebar>
          <>
          <SidebarTrigger className="ml-2" />
          <Outlet />
          </>
        </Sidebar>
      </SignModalProvider>
    </KeyProviderWrapper>
  );
};

export default DashboardLayout;
