// components/app-sidebar.tsx
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Home,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Store,
  PackagePlus,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Stores", url: "/stores", icon: Calendar },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Inventory", url: "/inventory", icon: Package },
  {
    title: "Admin",
    icon: Users,
    subItems: [
      { title: "Users", url: "/admin/users" },
      { title: "Products", url: "/admin/products" },
      { title: "Stores", url: "/admin/stores" },
      // Add more admin sub-items here later (e.g. Reports, Settings)
    ],
  },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [openAdmin, setOpenAdmin] = useState(true); // Default open for admin section

  return (
    <Sidebar>
      <SidebarContent>
        {/* Logo / Title */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Field Sales</h2>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.subItems ? (
                    // Collapsible Admin section with dropdown
                    <>
                      <SidebarMenuButton
                        onClick={() => setOpenAdmin(!openAdmin)}
                        className="justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </div>
                        {openAdmin ? (
                          <ChevronDown className="h-4 w-4 transition-transform" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-transform" />
                        )}
                      </SidebarMenuButton>

                      {openAdmin && (
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <Link
                                  href={subItem.url}
                                  className={cn(
                                    "pl-8",
                                    pathname === subItem.url && "bg-accent"
                                  )}
                                >
                                  {subItem.title}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </>
                  ) : (
                    // Regular link
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)}>
                      <Link href={item.url}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Avatar + Logout at bottom */}
      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                userButtonPopoverCard: "shadow-lg",
                userButtonPopoverActionButton: "hover:bg-accent",
              },
            }}
            afterSignOutUrl="/"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Your Account</span>
            <span className="text-xs text-muted-foreground">
              Manage profile & sign out
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}