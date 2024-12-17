"use client"

import { useEffect, useState } from "react"
import
  {
    Badge,
    BookOpen,
    Bot,
    Coins,
    Command,
    Frame,
    KeyIcon,
    LifeBuoy,
    Map,
    PieChart,
    PlusIcon,
    Send,
    Settings2,
    SquareTerminal,
    User,
    FileBadge2Icon,
    FileText,
    Building2,
    Notebook
  } from "lucide-react"

// import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/app/sidebar/NavProjects"
// import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/app/sidebar/NavUser"

import
  {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
  } from "@/components/ui/sidebar"
import { Link } from "react-router-dom"
import { NavMain } from "@/components/app/sidebar/NavMain"
import { useAuth } from "@/hooks/useAuth"
import { useKeyContext } from "@/contexts/keyManagerCtx"

const data = {
  navMain: [
    {
      title: "Wallet",
      url: "/dashboard/wallet/keys",
      icon: Badge,
      isActive: true,
      items: [
        {
          title: "Keys",
          url: "/dashboard/wallet/keys",
          icon:KeyIcon

        },
        {
          title: "DIDs",
          url: "/dashboard/wallet/dids",
          icon:PlusIcon
        },
        {
          title: "Credentials",
          url: "/dashboard/wallet/vcs",
          icon:FileBadge2Icon 
        },
        {
          title: "Presentations",
          url: "/dashboard/wallet/vps",
          icon:FileText 
        },
      ],
    },
    {
      title: "Organizations",
      url: "/dashboard/orgs",
      icon: Building2,
      isActive: true,
      items: [
        {
          title: "Manage",
          url: "/dashboard/orgs/manage",
          icon:Notebook 
        },
        {
          title: "Credentials",
          url: "/dashboard/orgs/vcs",
          icon:FileBadge2Icon 
          
        },
        {
          title: "Presentations",
          url: "/dashboard/orgs/vps",
          icon:FileText 
          
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Tokens",
      url: "/dashboard/tokens",
      icon: Coins,
    },
    {
      name: "Account",
      url: "/dashboard/account",
      icon: User,
    },
  ],
}
export function AppSidebar ( { ...props }: React.ComponentProps<typeof Sidebar> )
{
  // const [ data, setData ] = useState( dataa )
  const [ userData, setUserData ] = useState( {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  } )
  const { user } = useAuth()

  useEffect( () =>
  {
    ( async () =>
    {
      if ( user )
      {
        setUserData( {
          ...userData, name: user.name, email: user.email
        } )
      }
    } )()
  }, [ user ] )
  return (
    <Sidebar variant="sidebar"  {...props}>
      <SidebarHeader className="bg-background">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">HiD Inc</span>
                  <span className="truncate text-xs">Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-background">
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>

      <SidebarFooter className="bg-background">
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
