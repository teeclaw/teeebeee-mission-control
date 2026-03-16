import "./styles.css";
import "@rainbow-me/rainbowkit/styles.css";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { AppShell } from "./components/app-shell";

export const metadata = {
  title: "Mission Control — Teeebeee",
  description: "Operational command center for autonomous business pipeline",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
