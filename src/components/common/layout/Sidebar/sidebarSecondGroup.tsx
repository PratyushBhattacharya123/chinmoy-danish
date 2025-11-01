import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Package, ListTree } from "lucide-react";
import Link from "next/link";
import React from "react";

type Props = {
  active: number;
};

const SidebarSecondGroup = ({ active }: Props) => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Product Catalogue</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* Products */}
        <SidebarMenu>
          <Link href="/operator/products">
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Products"
                className={cn(
                  active === 3 ? "bg-neutral-200/50" : "",
                  "rounded-md cursor-pointer"
                )}
              >
                <Package className="mr-[6px] size-4" />
                <span>Products</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Link>
        </SidebarMenu>

        {/* Product Categories */}
        <SidebarMenu>
          <Link href="/operator/categories">
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Categories"
                className={cn(
                  active === 4 ? "bg-neutral-200/50" : "",
                  "rounded-md cursor-pointer"
                )}
              >
                <ListTree className="mr-[6px] size-4" />
                <span>Categories</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Link>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default SidebarSecondGroup;
