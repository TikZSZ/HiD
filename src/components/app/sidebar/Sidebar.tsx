import
{
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSideBar";
import { ReactElement } from "react";

export const Sidebar = ( { children }: { children: ReactElement } ) =>
{
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
      {/* <SidebarTrigger className="ml-2 mt-2" /> */}
        {children}
      </SidebarInset>
    </SidebarProvider> )
}