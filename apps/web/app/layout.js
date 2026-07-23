import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import WaveBackground from "@/components/WaveBackground";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import MobileTopBar from "@/components/MobileTopBar";
import FloatingHelpChat from "@/components/FloatingHelpChat";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "neetaspirants",
  description: "An anonymous peer-support community for NEET aspirants.",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem("neetaspirants_theme");
    var theme = stored === "light" || stored === "dark" ? stored : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} h-full antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <WaveBackground />
            <div className="relative flex min-h-full">
              <Sidebar />
              <div className="flex min-w-0 flex-1 flex-col md:pl-64">
                <MobileTopBar />
                <main className="flex-1 pb-20 md:pb-0">{children}</main>
              </div>
              <BottomNav />
              <FloatingHelpChat />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
