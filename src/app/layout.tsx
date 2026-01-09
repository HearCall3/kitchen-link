import "./globals.css";
import "./style.css";
import { metadata } from "./metadata";
import { SessionProviderWrapper } from "../components/SessionProviderWrapper";

export { metadata };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <SessionProviderWrapper>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
