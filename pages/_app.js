import { IBM_Plex_Serif, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import '../styles/globals.css';

const plexSerif = IBM_Plex_Serif({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-plex-serif' });
const plexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-sans' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono' });

export default function App({ Component, pageProps }) {
  return (
    <div className={`${plexSerif.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <Component {...pageProps} />
    </div>
  );
}
