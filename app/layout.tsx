import type { Metadata } from "next";
import "./service.css";
import { ThemeProvider } from "../components/service/theme";
export const metadata: Metadata = {
  title: "Allowance | Personal finance workspace",
  description:
    "A personal workspace for budgeting, investment scenarios, historical market analysis, tax estimates, payment safety and business cash flow.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{document.documentElement.dataset.theme=localStorage.getItem('allowance-theme')==='dark'?'dark':'light'}catch{}",
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
