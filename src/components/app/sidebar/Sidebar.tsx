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
        {children}
      </SidebarInset>
    </SidebarProvider> )
}