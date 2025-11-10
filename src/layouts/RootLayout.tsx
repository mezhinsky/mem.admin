import { Fragment, useState } from "react";
import { Outlet } from "react-router-dom";

import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/app-sidebar";
import {
  BreadcrumbProvider,
  type Breadcrumb as BreadcrumbType,
} from "@/hooks/use-breadcrumb";

export default function Layout() {
  const [breadcrumbPage, setBreadcrumbPage] = useState<BreadcrumbType[]>([
    { link: "/", label: "Home" },
    { link: "#", label: "Dashboard" },
  ]);

  return (
    <BreadcrumbProvider
      value={{ page: breadcrumbPage, setPage: setBreadcrumbPage }}
    >
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbPage.map((crumb, index) => {
                    const isLast = index === breadcrumbPage.length - 1;
                    return (
                      <Fragment key={crumb.label}>
                        <BreadcrumbItem
                          className={
                            index === 0 && !isLast
                              ? "hidden md:block"
                              : undefined
                          }
                        >
                          {isLast ? (
                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink href={crumb.link}>
                              {crumb.label}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                        {!isLast && (
                          <BreadcrumbSeparator className="hidden md:block" />
                        )}
                      </Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <section className="px-4">
            <Outlet />
          </section>
        </SidebarInset>
      </SidebarProvider>
    </BreadcrumbProvider>
  );
}
