export const metadata = {
  title: "Classic Ford — A Heritage in Motion",
  description: "Explore the Classic Ford collection — iconic cars, racing legends and automotive heritage."
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/carmodel/index.css" />
        <link rel="stylesheet" href="/carmodel/pages.css" />
        <link rel="stylesheet" href="/carmodel/assets/css/local-3d-viewer.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
