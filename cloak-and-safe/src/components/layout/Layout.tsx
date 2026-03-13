import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <div className={cn(
        "flex flex-1 flex-col transition-all duration-300",
        collapsed ? "ml-[72px]" : "ml-64"
      )}>
        <Header />
        <main className="flex-1 overflow-auto gradient-mesh">
          <div className="container py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
