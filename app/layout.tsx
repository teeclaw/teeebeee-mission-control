import "./styles.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Teeebeee Mission Control",
  description: "Operational dashboard for autonomous business pipeline"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
