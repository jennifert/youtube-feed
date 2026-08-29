import "@picocss/pico/css/pico.min.css";
import "./globals.css";

export const metadata = {
  title: "YouTube Feed",
  description: "A local-first YouTube subscription feed.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}