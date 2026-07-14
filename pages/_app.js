import '@/styles/globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Éviter les flash non-authentifiés
    const handleRouteChange = () => {
      document.body.style.opacity = '1';
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router]);

  return <Component {...pageProps} />;
}

export default MyApp;
