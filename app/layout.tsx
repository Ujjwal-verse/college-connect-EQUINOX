import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'CampusConnect — A better campus, together',description:'Report campus issues, follow progress, and close the loop.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
