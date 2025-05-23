import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AuthForm from '../../components/auth/AuthForm';
// import { supabase } from '../../lib/supabaseClient'; // Not directly used here, API calls go to our backend

/**
 * Registration page component.
 * Allows new users to sign up for an account.
 * @returns {JSX.Element} The RegisterPage component.
 */
export default function RegisterPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (formData, formSpecificError = null) => {
    if (formSpecificError) {
      setErrorMessage(formSpecificError);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);

    const { email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || `Registration failed with status: ${response.status}`);
      } else {
        // Handle successful registration
        // Supabase might require email confirmation. If so, data.session might be null.
        // The API route /api/auth/register handles this by returning a message.
        if (data.session) {
          // If session is immediately available (e.g. email confirmation disabled)
          router.push('/'); // Redirect to dashboard or home
        } else if (data.message) {
          // If email confirmation is pending
          setErrorMessage(data.message); // Display message like "Please check your email"
          // Optionally, redirect to a page that says "Check your email"
          // For now, just display the message on the form.
        } else {
           // Should not happen if API is consistent
           setErrorMessage('Registration successful, but unexpected response. Please try logging in.');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
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
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/auth/login">
            <a className="font-medium text-indigo-600 hover:text-indigo-500">
              sign in to your existing account
            </a>
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <AuthForm
            formType="register"
            onSubmit={handleRegister}
            errorMessage={errorMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}