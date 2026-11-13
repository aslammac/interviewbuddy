import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "InterviewBuddy — Learn deeply. Interview confidently.",
  description:
    "Understand core concepts, practice interview questions, and organize your next career move.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
