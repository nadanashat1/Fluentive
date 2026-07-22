import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthRefresh } from "@/components/auth-refresh";
import { ThemeProvider } from "@/contexts/theme-context";
import { UserProvider } from "@/contexts/user-context";
import { HeartbeatProvider } from "@/components/heartbeat-provider";
import { CommandPaletteProvider } from "@/components/command/CommandPaletteProvider";
import { AuthProvider } from "@/contexts/AuthContext-production";
import { SilentRefreshWrapper } from "@/components/SilentRefreshWrapper";
import { ReactQueryProvider } from "@/lib/react-query-provider";
import { SentryErrorBoundaryWrapper } from "@/components/SentryErrorBoundaryWrapper";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fluentive CRM - AI-Powered Sales Management",
  description: "Modern CRM platform with AI lead scoring, real-time pipeline, and team collaboration for sales teams.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SentryErrorBoundaryWrapper>
          <ReactQueryProvider>
            <ThemeProvider>
              <AuthProvider>
                <UserProvider>
                  <HeartbeatProvider>
                    <CommandPaletteProvider>
                      {children}
                    </CommandPaletteProvider>
                  </HeartbeatProvider>
                </UserProvider>
              </AuthProvider>
            </ThemeProvider>
          </ReactQueryProvider>
        </SentryErrorBoundaryWrapper>
      </body>
    </html>
  );
}
