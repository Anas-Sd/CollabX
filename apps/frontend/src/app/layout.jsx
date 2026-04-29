import localFont from "next/font/local";
import "./globals.css";
import ToastContainer from '../components/ui/ToastContainer';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "CodeCollab",
  description: "Real-time collaborative coding platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased text-white min-h-screen flex flex-col`}>
        {/* Mobile Blocker Overlay */}
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0A0A0F] p-8 text-center md:hidden">
          <div className="w-20 h-20 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
              <line x1="3" y1="3" x2="21" y2="21"></line>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Desktop Only</h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-sm leading-relaxed">
            CollabX is a professional collaborative IDE designed exclusively for larger screens. 
            Mobile devices are not supported.
          </p>
          <div className="w-16 h-1 bg-border rounded-full mb-8"></div>
          <p className="text-xs text-muted-foreground/50 font-mono tracking-widest uppercase">
            Please switch to a computer
          </p>
        </div>

        <div className="hidden md:flex flex-col min-h-screen">
          {children}
          <ToastContainer />
        </div>
      </body>
    </html>
  );
}
