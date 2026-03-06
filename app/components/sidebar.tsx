"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    label: "Overview",
    links: [
      { href: "/", icon: "◆", text: "Dashboard" },
    ],
  },
  {
    label: "Pipeline",
    links: [
      { href: "/pipeline", icon: "◈", text: "Opportunities" },
      { href: "/projects", icon: "▣", text: "Projects" },
    ],
  },
  {
    label: "Operations",
    links: [
      { href: "/agents", icon: "●", text: "Agents" },
      { href: "/cron", icon: "⏱", text: "Schedule" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <h3>Mission Control</h3>
        <p>Teeebeee · v1.0</p>
      </div>
      {sections.map((s) => (
        <div key={s.label} className="sb-section">
          <div className="sb-section-label">{s.label}</div>
          {s.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`sb-link${pathname === link.href ? " sb-active" : ""}`}
            >
              <span className="sb-icon">{link.icon}</span>
              {link.text}
            </Link>
          ))}
        </div>
      ))}
    </aside>
  );
}
