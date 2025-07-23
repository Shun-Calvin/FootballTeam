"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Users,
  Calendar,
  User,
  LogOut,
  Menu,
  Languages,
  CalendarCheck,
} from "lucide-react";
import { AuthContext } from "@/contexts/auth-context";
import { LanguageContext, useTranslation } from "@/contexts/language-context";

function SidebarLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
        { "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50": isActive }
      )}
    >
      {children}
    </Link>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useContext(AuthContext);
  const { setLanguage } = useContext(LanguageContext);
  const t = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const sidebarLinks = (
    <>
      <SidebarLink href="/dashboard">
        <LayoutDashboard className="h-5 w-5" />
        {t.dashboard}
      </SidebarLink>
      <SidebarLink href="/players">
        <Users className="h-5 w-5" />
        {t.players}
      </SidebarLink>
      <SidebarLink href="/matches">
        <Calendar className="h-5 w-5" />
        {t.matches}
      </SidebarLink>
      <SidebarLink href="/availability">
        <Calendar className="h-5 w-5" />
        {t.availability}
      </SidebarLink>
      <SidebarLink href="/booking">
        <CalendarCheck className="h-5 w-5" />
        {t.booking}
      </SidebarLink>
    </>
  );

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            <Link className="flex items-center gap-2 font-semibold" href="/">
              <span className="">Team Manager</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              {sidebarLinks}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 lg:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  Team Manager
                </Link>
                {sidebarLinks}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            {/* Can add a search bar here if needed */}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Languages className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage("en")}>
                {t.english}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("tc")}>
                {t.traditionalChinese}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href="/profile">
                <DropdownMenuItem>{t.profile}</DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={logout}>{t.logout}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
