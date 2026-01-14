"use client";

import { Link } from "react-router-dom";
import { Folder, MoreHorizontal, type LucideIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  // SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible } from "@radix-ui/react-collapsible";

type Project = {
  name: string;
  url: string;
  icon?: LucideIcon;
  items?: Project[];
};

export function NavProjects({ projects }: { projects: Project[] }) {
  const { isMobile } = useSidebar();

  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>Словари</SidebarGroupLabel> */}
      <SidebarMenu>
        {projects.map((item) => {
          const ItemIcon = item.icon ?? Folder;
          return (
            <Collapsible
              key={item.name}
              asChild
              defaultOpen={true}
              className="group/collapsible"
            >
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild>
                  <Link to={item.url}>
                    <ItemIcon />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
                {item.items && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      className="focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      className="w-48 rounded-lg"
                      side={isMobile ? "bottom" : "right"}
                      align={isMobile ? "end" : "start"}
                    >
                      {item.items &&
                        item.items.map((subItem) => {
                          const SubIcon = subItem.icon ?? Folder;
                          return (
                            <DropdownMenuItem key={subItem.name} asChild>
                              <Link to={subItem.url}>
                                <SubIcon />
                                <span>{subItem.name}</span>
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                      {/* <DropdownMenuItem>
                  <Folder className="text-muted-foreground" />
                  <span>View Project</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Forward className="text-muted-foreground" />
                  <span>Share Project</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2 className="text-muted-foreground" />
                  <span>Delete Project</span>
                </DropdownMenuItem> */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
