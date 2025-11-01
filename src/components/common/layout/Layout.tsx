"use client";

import React, { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteSidebar } from "./Sidebar/Sidebar";
import { SiteHeader } from "./Header";

interface LayoutProps {
  children: ReactNode;
  title: string;
  active: number;
  subActive?: number;
  headerAction?: React.JSX.Element;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  active,
  subActive,
  headerAction,
}: LayoutProps) => {
  return (
    <SidebarProvider>
      <SiteSidebar variant="inset" active={active} subActive={subActive} />
      <SidebarInset>
        <SiteHeader
          title={title}
          headerAction={headerAction ? headerAction : <></>}
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 md:gap-6">{children}</div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
