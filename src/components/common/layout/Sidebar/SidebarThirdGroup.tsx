import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";
import Link from "next/link";

type Props = {
  active: number;
};

const SidebarThirdGroup = ({ active }: Props) => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Stock Management</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* Stocks */}
        <SidebarMenu>
          <Link href="/operator/stocks">
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Manage product inventory and stock levels"
                className={cn(
                  active === 5
                    ? "bg-neutral-200/50"
                    : "hover:bg-neutral-100/50",
                  "rounded-md cursor-pointer transition-colors duration-200"
                )}
              >
                <Package className="mr-3 size-4" />
                <span>Inventory</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Link>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default SidebarThirdGroup;
