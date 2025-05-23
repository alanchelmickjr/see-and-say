import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, isAuthenticated, logout, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Router redirection is handled within the logout function in AuthContext
  };

  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <a className="text-xl font-bold hover:text-gray-300">eBay Helper</a>
        </Link>
        <div className="space-x-4 flex items-center">
          {loading ? (
            <span>Loading...</span>
          ) : isAuthenticated && user ? (
            <>
              <span className="text-sm">Welcome, {user.email}</span>
              <Link href="/items/new">
                <a className="hover:text-gray-300">New Item</a>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <a className="hover:text-gray-300">Login</a>
              </Link>
              <Link href="/auth/register">
                <a className="hover:text-gray-300">Register</a>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}