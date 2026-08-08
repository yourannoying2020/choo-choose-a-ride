import './globals.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'Choo Chose A Ride',description:'Find UK train journeys by location, time, price and changes.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
