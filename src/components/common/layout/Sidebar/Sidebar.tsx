"use client";

import React, { useEffect, useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SidebarUser } from "./sidebarUser";
import SidebarFirstGroup from "./sidebarFirstGroup";
import SidebarSecondGroup from "./sidebarSecondGroup";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import SidebarThirdGroup from "./SidebarThirdGroup";
import { useSession } from "next-auth/react";
import SidebarFourthGroup from "./SidebarFourthGroup";

type Props = {
  active: number;
  subActive?: number;
  variant?: "sidebar" | "floating" | "inset";
};

export function SiteSidebar({ active, subActive, variant }: Props) {
  const { data: sessionData, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (status !== "loading" && sessionData) {
      setIsAdmin(sessionData.user.userType === "ADMIN");
    }
  }, [sessionData, status]);

  return (
    <Sidebar collapsible="offcanvas" variant={variant}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-start px-2 py-4 space-x-3">
              {/* Logo Container */}
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-2 rounded-full shadow-lg border border-gray-600">
                  <Image
                    src="/logo/logo.png"
                    alt="Chinmoy Danish Logo"
                    width={48}
                    height={48}
                    className="h-10 w-10 object-cover rounded-full"
                    priority
                  />
                </div>
              </div>

              {/* Text Content */}
              <div className="flex flex-col justify-center">
                <h1 className="font-bold text-gray-900 text-sm leading-tight">
                  Chinmoy Danish
                </h1>
                <p className="text-xs text-gray-600 leading-tight">
                  Business Portal
                </p>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
        <Separator />
      </SidebarHeader>
      <SidebarContent>
        <SidebarFirstGroup active={active} subActive={subActive} />
        <SidebarSecondGroup active={active} />
        <SidebarThirdGroup active={active} />
        {isAdmin && <SidebarFourthGroup active={active} />}
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
