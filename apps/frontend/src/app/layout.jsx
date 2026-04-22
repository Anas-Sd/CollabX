import "./globals.css";
import ToastContainer from '../components/ui/ToastContainer';

export const metadata = {
  title: "CodeCollab",
  description: "Real-time collaborative coding platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased text-white min-h-screen flex flex-col">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
