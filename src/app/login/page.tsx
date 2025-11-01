"use client";

import { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function GoogleSignInForm() {
  const [isLoading, setIsLoading] = useState(false);

  const { data: session, status } = useSession();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google");
    } catch (error) {
      console.error("Google sign-in error:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkSessionValidity = async () => {
      if (status === "unauthenticated") {
        router.push("/login");
        return;
      }

      if (status === "authenticated") {
        if (session) {
          if (
            session.user.userType === "ADMIN" ||
            session.user.userType === "OPERATOR"
          ) {
            router.push("/operator/bills/invoices");
          } else {
            router.push("/unauthorized");
          }
        }
      }
    };

    checkSessionValidity();
  }, [status, session, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full flex flex-col md:flex-row rounded-xl overflow-hidden shadow-lg border border-gray-300">
        {/* Left Panel */}
        <div className="w-full md:w-2/5 bg-gradient-to-br from-gray-800 to-gray-700 p-6 md:p-8 flex flex-col justify-center items-center text-center text-gray-100">
          <div className="mb-6 md:mb-8 flex flex-col items-center justify-center">
            {/* Logo container */}
            <div className="mb-3 md:mb-4">
              <Image
                src="/logo/logo.png"
                alt="Chinmoy Danish Logo"
                width={500}
                height={500}
                className="h-20 w-auto object-cover rounded-full"
                priority
              />
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-playfair">
              Chinmoy Danish Electrical Plumbing Shop
            </h1>
            <p className="text-gray-300 mt-1 md:mt-2 text-sm md:text-base">
              Private Business Portal
            </p>
          </div>

          <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 font-playfair text-blue-300">
            Secure Business Access
          </h2>
          <p className="text-gray-300 mb-4 md:mb-6 text-sm md:text-base">
            Access your billing system.
          </p>

          <div className="bg-gray-700/50 p-4 md:p-6 rounded-lg border border-gray-500 w-full max-w-xs">
            <h3 className="font-semibold mb-2 text-base md:text-lg text-gray-100">
              Portal Features
            </h3>
            <ul className="text-gray-300 text-xs md:text-sm space-y-1 md:space-y-2">
              <li className="flex items-center">
                <div className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-gray-600 flex items-center justify-center mr-2">
                  <span className="text-gray-100 text-xs">✓</span>
                </div>
                Secure billing system
              </li>
              <li className="flex items-center">
                <div className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-gray-600 flex items-center justify-center mr-2">
                  <span className="text-gray-100 text-xs">✓</span>
                </div>
                Inventory management system
              </li>
              <li className="flex items-center">
                <div className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-gray-600 flex items-center justify-center mr-2">
                  <span className="text-gray-100 text-xs">✓</span>
                </div>
                Team collaboration tools
              </li>
            </ul>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-3/5 bg-white p-6 md:p-8 lg:p-10 flex flex-col justify-center">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 text-center">
            Welcome to Chinmoy Danish Portal
          </h2>
          <p className="text-gray-600 mb-6 md:mb-8 text-center text-sm md:text-base">
            Sign in with your company Google account
          </p>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 py-3 px-4 rounded-lg font-medium border border-gray-300 hover:border-blue-600 hover:bg-gray-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm cursor-pointer"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            ) : (
              <FcGoogle className="h-5 w-5" />
            )}
            {isLoading ? "Signing in..." : "Sign in with Google"}
          </button>

          {/* Additional Info */}
          <div className="mt-6 md:mt-8 p-3 md:p-4 bg-gray-100 rounded-lg border border-gray-200">
            <h3 className="text-gray-800 font-semibold mb-2 text-sm md:text-base">
              Important Note
            </h3>
            <p className="text-gray-600 text-xs md:text-sm">
              This portal is exclusively for Chinmoy Danish Electrical Plumbing
              Shop employees and authorized partners. Use your company Google
              account to access business resources.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
