import type { ReactNode } from "react";
import { Bell, Search } from "lucide-react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, description, actions, children }: Props) {
  return (
    <SidebarProvider>
      <div className="flex min-h-dvh w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
            <SidebarTrigger className="text-muted-foreground" />
            <Separator orientation="vertical" className="h-6" />
            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search memories, patients, notes…"
                aria-label="Search"
                className="h-10 rounded-xl border-border bg-muted/40 pl-9 text-sm"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifications"
                className="relative rounded-xl"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
              </Button>
            </div>
          </header>
          <main className="flex-1 px-4 py-8 md:px-8 lg:px-10">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
              <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                    {title}
                  </h1>
                  {description ? (
                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  ) : null}
                </div>
                {actions ? (
                  <div className="flex shrink-0 items-center gap-2">{actions}</div>
                ) : null}
              </header>
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
