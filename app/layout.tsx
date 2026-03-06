import "./styles.css";
import type { ReactNode } from "react";
import Sidebar from "@/app/components/sidebar";

export const metadata = {
  title: "Mission Control — Teeebeee",
  description: "Operational command center for autonomous business pipeline",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Sidebar />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
