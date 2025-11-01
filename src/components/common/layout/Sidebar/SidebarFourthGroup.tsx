import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import Link from "next/link";

type Props = {
  active: number;
};

const SidebarFourthGroup = ({ active }: Props) => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Team Management</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* Users */}
        <SidebarMenu>
          <Link href="/admin/users">
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Manage all users"
                className={cn(
                  active === 6
                    ? "bg-neutral-200/50"
                    : "hover:bg-neutral-100/50",
                  "rounded-md cursor-pointer transition-colors duration-200"
                )}
              >
                <Users className="mr-3 size-4" />
                <span>Users</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Link>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default SidebarFourthGroup;
