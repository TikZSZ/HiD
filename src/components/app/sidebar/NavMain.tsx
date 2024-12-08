"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

import
{
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import
{
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Link, NavLink, useLocation, matchPath } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

export function NavMain ( {
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      icon?: LucideIcon
    }[]
  }[]
} )
{
  const location = useLocation()
  useEffect( () =>
  {
    // console.log( location )
    // matchPath()
  }, [ location ] )
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map( ( item ) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title}>
                <NavLink to={item.url} >
                  <item.icon />
                  <span>{item.title}</span>
                </NavLink>
                {/* <div>
                  <item.icon />
                  <span>{item.title}</span>
                </div> */}
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map( ( subItem ) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <NavLink to={subItem.url} key={subItem.url} className={location.pathname && matchPath( subItem.url, location.pathname ) ? " bg-secondary " : " "}
                            >
                              {subItem.icon && <subItem.icon />}
                              <span>{subItem.title}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ) )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ) )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
