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
} from "@/components/ui/sidebar";
import {
  Calendar,
  Home,
  Package,
  ShoppingCart,
  Users,
  Settings,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Stores", url: "/stores", icon: Calendar },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Admin", url: "/admin/users", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarContent>
        {/* Logo / Title */}
        <div className="p-4">
          <h2 className="text-xl font-bold">Field Sales</h2>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
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
            <span className="text-xs text-muted-foreground">Manage profile & sign out</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}