import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nam Vương Sinh viên 5 Tốt UHL 2026",
  description: "Cổng bình chọn Nam Vương – CLB Sinh viên 5 Tốt UHL",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
