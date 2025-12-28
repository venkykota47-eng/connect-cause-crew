import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ReactNode } from "react";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export function Layout({ children, showFooter = true }: LayoutProps) {
  // Enable realtime notifications for authenticated users
  useRealtimeNotifications();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
