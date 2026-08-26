export const metadata = { title: "DemoPilot Demo" };

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: "hidden", width: "100vw", height: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
