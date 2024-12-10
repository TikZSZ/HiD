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
import { useKeyContext } from "@/contexts/keyManagerCtx.2"
// navMain: [
//   {
//     title: "Playground",
//     url: "#",
//     icon: SquareTerminal,
//     isActive: true,
//     items: [
//       {
//         title: "History",
//         url: "#",
//       },
//       {
//         title: "Starred",
//         url: "#",
//       },
//       {
//         title: "Settings",
//         url: "#",
//       },
//     ],
//   },
//   {
//     title: "Models",
//     url: "#",
//     icon: Bot,
//     items: [
//       {
//         title: "Genesis",
//         url: "#",
//       },
//       {
//         title: "Explorer",
//         url: "#",
//       },
//       {
//         title: "Quantum",
//         url: "#",
//       },
//     ],
//   },
//   {
//     title: "Documentation",
//     url: "#",
//     icon: BookOpen,
//     items: [
//       {
//         title: "Introduction",
//         url: "#",
//       },
//       {
//         title: "Get Started",
//         url: "#",
//       },
//       {
//         title: "Tutorials",
//         url: "#",
//       },
//       {
//         title: "Changelog",
//         url: "#",
//       },
//     ],
//   },
//   {
//     title: "Settings",
//     url: "#",
//     icon: Settings2,
//     items: [
//       {
//         title: "General",
//         url: "#",
//       },
//       {
//         title: "Team",
//         url: "#",
//       },
//       {
//         title: "Billing",
//         url: "#",
//       },
//       {
//         title: "Limits",
//         url: "#",
//       },
//     ],
//   },
// ],
const dataa = {
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
        // {
        //   title: "DID2",
        //   url: "#",
        // },
        // {
        //   title: "DID3",
        //   url: "#",
        // },
      ],
    },
    {
      title: "Organizations",
      url: "/dashboard/orgs",
      icon: Bot,
      items: [
        {
          title: "Members",
          url: "#",
        },
        {
          title: "Presentations",
          url: "#",
        },
        {
          title: "Security",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
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
  const [ data, setData ] = useState( dataa )
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
