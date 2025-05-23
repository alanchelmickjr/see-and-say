import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import '../styles/globals.css'; // Assuming you have or will create this for global styles

function MyApp({ Component, pageProps }) {
  // Pages like login/register might not need the full layout,
  // or might have a different layout. This can be handled by
  // adding a property to the page component, e.g., Component.getLayout
  // For now, we apply the main layout to all pages.
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);

  return (
    <AuthProvider>
      {getLayout(<Component {...pageProps} />)}
    </AuthProvider>
  );
}

export default MyApp;