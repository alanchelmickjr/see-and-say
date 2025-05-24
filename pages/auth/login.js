import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AuthForm from '../../components/auth/AuthForm';
// import { supabase } from '../../lib/supabaseClient'; // Not directly used here, API calls go to our backend

/**
 * Login page component.
 * Allows existing users to sign in to their accounts.
 * @returns {JSX.Element} The LoginPage component.
 */
export default function LoginPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (formData) => {
    setIsLoading(true);
    setErrorMessage(null);

    const { email, password } = formData;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || `Login failed with status: ${response.status}`);
      } else {
        // Handle successful login
        // The API should return user and session data.
        // We might want to store session/user info in a global state/context here.
        // For now, just redirect.
        router.push('/'); // Redirect to dashboard or home
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-12 w-auto"
          src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg" // Placeholder logo
          alt="Workflow"
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <AuthForm
            formType="login"
            onSubmit={handleLogin}
            errorMessage={errorMessage}
            isLoading={isLoading}
          />
          {/* TODO: Add "Forgot password?" link here if implementing password recovery */}
        </div>
      </div>
    </div>
  );
}