import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';

/**
 * A Higher-Order Component or wrapper to protect routes that require authentication.
 * If the user is not authenticated, they are redirected to the login page.
 *
 * @param {object} props - The component's props.
 * @param {React.ReactNode} props.children - The component/page to render if authenticated.
 * @param {React.ReactNode} [props.fallback] - Optional component to render while loading auth state.
 * @returns {JSX.Element | null} The protected component or null/fallback during redirect/loading.
 */
export default function AuthGuard({ children, fallback = null }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Store the attempted path to redirect back after login
      // Avoid storing if the current path is already an auth page
      if (!router.pathname.startsWith('/auth')) {
        sessionStorage.setItem('redirectAfterLogin', router.asPath);
      }
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return fallback || <div className="flex justify-center items-center min-h-screen">Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    // Should be redirecting, but return null to prevent flash of content
    return null; 
  }

  // If authenticated, render the children components
  return <>{children}</>;
}

/**
 * HOC version to wrap a page component.
 * Example usage: export default withAuthGuard(MyProtectedPage);
 */
export const withAuthGuard = (WrappedComponent) => {
  const Wrapper = (props) => (
    <AuthGuard>
      <WrappedComponent {...props} />
    </AuthGuard>
  );

  // Copy static properties like getInitialProps if they exist
  if (WrappedComponent.getInitialProps) {
    Wrapper.getInitialProps = WrappedComponent.getInitialProps;
  }
  
  // Set a display name for better debugging
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  Wrapper.displayName = `withAuthGuard(${displayName})`;

  return Wrapper;
};