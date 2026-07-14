import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "CreativeArt Admin Console",
  description: "Staff & Management Console for CreativeArt",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full`}
    >
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}>
        {children}
      </body>
    </html>
  );
}
