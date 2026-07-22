import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Fluentive CRM",
  description: "Sign in to your AI-powered sales CRM",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
