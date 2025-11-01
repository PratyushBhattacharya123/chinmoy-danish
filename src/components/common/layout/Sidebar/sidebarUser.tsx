"use client";

import { MoreVerticalIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import LogoutModal from "../../modals/logoutModal/LogoutModal";

export function SidebarUser() {
  const { isMobile } = useSidebar();

  const { data: sessionData } = useSession();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <Avatar className="h-8 w-8 rounded-full grayscale">
                <AvatarImage
                  src={sessionData?.user.image || "/Avatar.png"}
                  alt={sessionData?.user.name?.slice(0, 2).toUpperCase() || ""}
                />
                <AvatarFallback className="rounded-full">
                  {sessionData?.user.name?.slice(0, 2).toUpperCase() || ""}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{`${
                  sessionData?.user.name || ""
                }`}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {sessionData?.user?.email}
                </span>
              </div>
              <MoreVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg p-3"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage
                    src={sessionData?.user.image || "/Avatar.png"}
                    alt={
                      sessionData?.user.name?.slice(0, 2).toUpperCase() || ""
                    }
                  />
                  <AvatarFallback className="rounded-full">
                    {sessionData?.user.name?.slice(0, 2).toUpperCase() || ""}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{`${
                    sessionData?.user.name || ""
                  }`}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {sessionData?.user?.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <LogoutModal />
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
