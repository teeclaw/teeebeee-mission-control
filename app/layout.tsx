import "./styles.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Mission Control — Teeebeee",
  description: "Operational command center for autonomous business pipeline"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
