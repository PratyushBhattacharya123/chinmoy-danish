import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface SideHeaderProps {
  title: string;
  headerAction?: React.JSX.Element;
}

export function SiteHeader({ title, headerAction }: SideHeaderProps) {
  return (
    <header className="group-has-data-[collapsible=icon]/lg:sidebar-wrapper:h-12 sidebar-wrapper:h-16 flex lg:h-12 h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 cursor-pointer" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex items-center w-full justify-between gap-[6px]">
          <h1 className="md:text-base text-[14px] font-medium">{title}</h1>
          {headerAction}
        </div>
      </div>
    </header>
  );
}
