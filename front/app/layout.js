import "./globals.css";
import "./styles/datepicker.css";
import { Toaster } from "react-hot-toast";
import { Plus_Jakarta_Sans, Public_Sans, JetBrains_Mono, Noto_Sans_Arabic } from "next/font/google";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-public-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-arabic",
  display: "swap",
});

export const metadata = {
  title: "EduSpace — Gestion des Ressources Éducatives",
  description:
    "Plateforme institutionnelle centralisée pour la gestion des salles, des équipements de laboratoire, des réservations et des ressources pédagogiques.",
  openGraph: {
    title: "EduSpace — Gestion des Ressources Éducatives",
    description:
      "Plateforme institutionnelle centralisée pour la gestion des salles, des équipements de laboratoire, des réservations et des ressources pédagogiques.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="fr"
      dir="ltr"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${publicSans.variable} ${jetbrainsMono.variable} ${notoArabic.variable}`}
    >
      <body className="font-sans antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-primary-600 selection:text-white" suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <NotificationProvider>
                {children}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3500,
                    className: "text-sm font-medium border border-slate-200 dark:border-slate-800 shadow-lg",
                    style: {
                      background: "#0f172a",
                      color: "#f8fafc",
                      borderRadius: "0.75rem",
                      padding: "12px 16px",
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: "#16a34a",
                        secondary: "#ffffff",
                      },
                    },
                    error: {
                      duration: 4000,
                      iconTheme: {
                        primary: "#dc2626",
                        secondary: "#ffffff",
                      },
                    },
                  }}
                />
                <div id="root" />
              </NotificationProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

