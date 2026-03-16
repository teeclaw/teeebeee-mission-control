import "./styles.css";
import "@rainbow-me/rainbowkit/styles.css";
import type { ReactNode } from "react";
import Sidebar from "@/app/components/sidebar";
import { Providers } from "./providers";

export const metadata = {
  title: "Mission Control — Teeebeee",
  description: "Operational command center for autonomous business pipeline",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="shell">
            <Sidebar />
            <main className="main">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
