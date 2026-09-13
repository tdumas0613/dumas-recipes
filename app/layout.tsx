import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dumas Family Recipes",
  description:
    "Recipes we've made more than once, written down properly so the second time is easier than the first.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <div className="rx">{children}</div>
      </body>
    </html>
  );
}
