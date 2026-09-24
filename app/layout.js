export const metadata = {
  title: 'TrendsBits AI - All AI Tools in One Place',
  description: 'Access ChatGPT, Claude, and Gemini under one subscription',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
