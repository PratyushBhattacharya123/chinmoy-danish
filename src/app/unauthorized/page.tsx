"use client";

import Link from "next/link";
import Image from "next/image";
import { Home, ArrowLeft, Mail, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Unauthorized() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleGoBack = () => {
    router.back();
  };

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
            <h1 className="text-xl md:text-2xl font-bold font-playfair text-white">
              Chinmoy Danish Electrical Plumbing Shop
            </h1>
            <p className="text-gray-300 mt-1 md:mt-2 text-sm md:text-base">
              Private Business Portal
            </p>
          </div>

          <div className="bg-gray-700/50 p-4 md:p-6 rounded-lg border border-gray-500 w-full max-w-xs">
            <div className="flex items-center justify-center mb-3">
              <Shield className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="font-semibold mb-2 text-base md:text-lg text-gray-100">
              Access Restricted
            </h3>
            <p className="text-gray-300 text-sm">
              This area requires special permissions. Please contact your
              administrator for access.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-3/5 bg-white p-6 md:p-8 lg:p-10 flex flex-col justify-center items-center">
          {/* Unauthorized Icon and Text */}
          <div className="relative mb-6">
            <div className="text-[120px] md:text-[150px] font-bold text-gray-300 leading-none">
              403
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-700 text-center">
                  Access Denied
                </div>
              </div>
            </div>
          </div>

          <p className="text-gray-600 text-center mb-6 max-w-md">
            You don&apos;t have permission to access this page. This area is
            restricted to authorized personnel only.
          </p>

          {/* Security Message */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 max-w-md">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700 text-sm">
                If you believe you should have access to this page, please
                contact your system administrator or the support team.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-gray-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors shadow-sm"
            >
              <Home size={18} />
              Go Home
            </Link>

            {isClient && (
              <button
                onClick={handleGoBack}
                className="flex items-center justify-center gap-2 bg-white text-gray-800 py-3 px-4 rounded-lg font-medium border border-gray-400 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                <ArrowLeft size={18} />
                Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
