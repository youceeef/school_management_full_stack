import "./globals.css";
import "./styles/datepicker.css";
import { Toaster } from "react-hot-toast";
import { Inter } from "next/font/google";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Gestion de Salles",
  description: "Application de gestion de salles et d'équipements",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: "#363636",
                    color: "#fff",
                  },
                  success: {
                    duration: 3000,
                    style: {
                      background: "#22c55e",
                      color: "#fff",
                    },
                  },
                  error: {
                    duration: 4000,
                    style: {
                      background: "#ef4444",
                      color: "#fff",
                    },
                  },
                }}
              />
              <div id="root" />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
