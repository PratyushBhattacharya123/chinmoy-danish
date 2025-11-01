import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  FileCheck,
  Users,
  Receipt,
  FileDigit,
} from "lucide-react";
import Link from "next/link";
import React from "react";

type Props = {
  active: number;
  subActive?: number;
};

const SidebarFirstGroup = ({ active, subActive }: Props) => {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* Bills */}
        <SidebarMenu>
          <Collapsible className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip="Bills"
                  className={cn(
                    active === 1 ? "bg-neutral-200/50" : "",
                    "rounded-md cursor-pointer"
                  )}
                >
                  <Receipt className="mr-[6px] size-4" />
                  <span>Bills</span>
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90 size-4" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <Link href={"/operator/bills/invoices"}>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton
                        tooltip="Invoices"
                        className={cn(
                          active === 1 && subActive === 1
                            ? "bg-neutral-200/40"
                            : "",
                          "rounded-md cursor-pointer"
                        )}
                      >
                        <FileCheck className="mr-2 size-4" />
                        <span>Invoices</span>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                  </Link>
                  <Link href={"/operator/bills/proforma-invoices"}>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton
                        tooltip="Proforma Invoices"
                        className={cn(
                          active === 1 && subActive === 2
                            ? "bg-neutral-200/40"
                            : "",
                          "rounded-md cursor-pointer"
                        )}
                      >
                        <FileDigit className="mr-2 size-4" />
                        <span>Proforma Invoices</span>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                  </Link>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>

        {/* Party Details */}
        <SidebarMenu>
          <Link href={"/operator/party-details"}>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Party Details"
                className={cn(
                  active === 2 ? "bg-neutral-200/50" : "",
                  "rounded-md cursor-pointer"
                )}
              >
                <Users className="mr-[6px] size-4" />
                <span>Party Details</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Link>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default SidebarFirstGroup;
