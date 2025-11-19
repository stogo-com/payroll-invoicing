import type React from "react"
import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"
import "./globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
})

export const metadata: Metadata = {
  title: "STOGO Ledger",
  description: "Workforce management and timesheet processing system",
  generator: "v0.app",
  icons: {
    icon: "/stogomark.png",
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={montserrat.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <Suspense fallback={<div>Loading...</div>}>
            <SidebarProvider>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                  <TopBar />
                  <main className="flex-1 overflow-auto p-6">{children}</main>
                </div>
              </div>
            </SidebarProvider>
          </Suspense>
        </ThemeProvider>
        {/* <Analytics /> */}
      </body>
    </html>
  )
}
