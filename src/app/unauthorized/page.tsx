// "use client";

// import Link from "next/link";
// import Image from "next/image";
// import { Home, ArrowLeft, Shield } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";

// export default function Unauthorized() {
//   const router = useRouter();
//   const [isClient, setIsClient] = useState(false);

//   useEffect(() => {
//     setIsClient(true);
//   }, []);

//   const handleGoBack = () => {
//     router.back();
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
//       <div className="max-w-4xl w-full flex flex-col md:flex-row rounded-xl overflow-hidden shadow-lg border border-gray-300">
//         {/* Left Panel */}
//         <div className="w-full md:w-2/5 bg-gradient-to-br from-gray-800 to-gray-700 p-6 md:p-8 flex flex-col justify-center items-center text-center text-gray-100">
//           <div className="mb-6 md:mb-8 flex flex-col items-center justify-center">
//             {/* Logo container */}
//             <div className="mb-3 md:mb-4">
//               <Image
//                 src="/logo/logo.png"
//                 alt="Chinmoy Danish Logo"
//                 width={500}
//                 height={500}
//                 className="h-20 w-auto object-cover rounded-full"
//                 priority
//               />
//             </div>
//             <h1 className="text-xl md:text-2xl font-bold font-playfair text-white">
//               Chinmoy Danish Electrical Plumbing Shop
//             </h1>
//             <p className="text-gray-300 mt-1 md:mt-2 text-sm md:text-base">
//               Private Business Portal
//             </p>
//           </div>

//           <div className="bg-gray-700/50 p-4 md:p-6 rounded-lg border border-gray-500 w-full max-w-xs">
//             <div className="flex items-center justify-center mb-3">
//               <Shield className="h-8 w-8 text-gray-300" />
//             </div>
//             <h3 className="font-semibold mb-2 text-base md:text-lg text-gray-100">
//               Access Restricted
//             </h3>
//             <p className="text-gray-300 text-sm">
//               This area requires special permissions. Please contact your
//               administrator for access.
//             </p>
//           </div>
//         </div>

//         {/* Right Panel */}
//         <div className="w-full md:w-3/5 bg-white p-6 md:p-8 lg:p-10 flex flex-col justify-center items-center">
//           {/* Unauthorized Icon and Text */}
//           <div className="relative mb-6">
//             <div className="text-[120px] md:text-[150px] font-bold text-gray-300 leading-none">
//               403
//             </div>
//             <div className="absolute inset-0 flex items-center justify-center">
//               <div className="flex flex-col items-center">
//                 <div className="text-2xl md:text-3xl font-bold text-gray-700 text-center">
//                   Access Denied
//                 </div>
//               </div>
//             </div>
//           </div>

//           <p className="text-gray-600 text-center mb-6 max-w-md">
//             You don&apos;t have permission to access this page. This area is
//             restricted to authorized personnel only.
//           </p>

//           {/* Security Message */}
//           <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 max-w-md">
//             <div className="flex items-start gap-3">
//               <Shield className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
//               <p className="text-gray-700 text-sm">
//                 If you believe you should have access to this page, please
//                 contact your system administrator or the support team.
//               </p>
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
//             <Link
//               href="/"
//               className="flex items-center justify-center gap-2 bg-gray-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors shadow-sm"
//             >
//               <Home size={18} />
//               Go Home
//             </Link>

//             {isClient && (
//               <button
//                 onClick={handleGoBack}
//                 className="flex items-center justify-center gap-2 bg-white text-gray-800 py-3 px-4 rounded-lg font-medium border border-gray-400 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
//               >
//                 <ArrowLeft size={18} />
//                 Go Back
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import {
  ServerCrash,
  CreditCard,
  AlertTriangle,
  Clock,
  Cpu,
  ArrowRight,
} from "lucide-react";

export default function ServiceSuspended() {
  return (
    <div className="relative min-h-screen w-full bg-[#f4f5f7] flex items-center justify-center p-3 sm:p-4 overflow-hidden py-6 sm:py-10">
      {/* Subtle background pattern – faint hosting dashboard grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(103,61,230,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(103,61,230,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="relative w-full max-w-3xl mx-auto backdrop-blur-xl bg-white/95 border border-white/40 shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 z-10">
        {/* Subtle Hostinger brand presence */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-[#673de6] flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">H</span>
            </div>
            <span className="text-base sm:text-lg font-semibold text-slate-700">
              Hostinger
            </span>
          </div>
          <span className="text-[10px] sm:text-xs font-medium text-slate-400 bg-slate-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
            Billing System
          </span>
        </div>

        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="mb-5 sm:mb-6 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#673de6]/10 to-[#673de6]/5 border border-[#673de6]/20 shadow-sm">
            <ServerCrash
              className="h-8 w-8 sm:h-10 sm:w-10 text-[#673de6]"
              strokeWidth={1.5}
            />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-800 mb-1 sm:mb-2">
            Account Suspended
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            Your hosting account has been automatically suspended due to an
            outstanding payment. All services are temporarily offline.
          </p>
        </div>

        {/* Prominent Payment Due */}
        <div className="bg-[#673de6]/5 border border-[#673de6]/20 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-red-100 flex items-center justify-center">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Outstanding Balance
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">
                ₹9,417
              </p>
            </div>
          </div>
          <a
            href="https://hostinger.in"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#673de6] hover:bg-[#502bd4] text-white font-semibold rounded-xl transition-colors shadow-lg shadow-[#673de6]/20 text-sm sm:text-base"
          >
            Pay Now
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Suspension Timeline */}
        <div className="w-full mb-8 sm:mb-10">
          <div className="flex items-center justify-between max-w-xs sm:max-w-sm md:max-w-md mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#673de6]/30" />
              <span className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium text-slate-400">
                Active
              </span>
            </div>
            <div className="flex-1 h-px bg-slate-200 mx-1 sm:mx-2 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#673de6] to-red-400 w-full" />
            </div>
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500 ring-2 sm:ring-4 ring-red-100 animate-pulse" />
              <span className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-semibold text-red-600">
                Suspended
              </span>
            </div>
            <div className="flex-1 h-px bg-slate-200 mx-1 sm:mx-2" />
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-300" />
              <span className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium text-slate-400">
                Reactivation
              </span>
            </div>
          </div>
          <p className="text-center text-[10px] sm:text-xs text-slate-400 mt-2 sm:mt-3">
            Suspended on June 22, 2026 at 00:00 UTC
          </p>
        </div>

        {/* System Status Card */}
        <div className="backdrop-blur-md bg-white/60 border border-slate-200/60 shadow-sm rounded-2xl p-4 sm:p-5 md:p-6 mb-6 sm:mb-8">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 sm:mb-4">
            Service Status
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <StatusItem
              icon={<Cpu className="h-4 w-4" />}
              label="Hosting Server"
              status="Offline"
              color="red"
            />
            <StatusItem
              icon={<CreditCard className="h-4 w-4" />}
              label="Payment Status"
              status="Overdue"
              color="red"
            />
            <StatusItem
              icon={<Clock className="h-4 w-4" />}
              label="Suspended Since"
              status="June 22, 2026"
              color="purple"
            />
            <StatusItem
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Reactivation"
              status="Pending Payment"
              color="purple"
            />
          </div>
        </div>

        {/* Information & Next Steps */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex gap-3 items-start p-3 sm:p-4 rounded-xl bg-red-50/80 border border-red-200">
            <ServerCrash className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                All website files, databases, and emails are intact but
                currently inaccessible. No data has been lost. Once payment is
                received, your account will be automatically restored within a
                few minutes.
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start p-3 sm:p-4 rounded-xl bg-[#673de6]/5 border border-[#673de6]/20">
            <AlertTriangle className="h-5 w-5 text-[#673de6] mt-0.5 shrink-0" />
            <div>
              <p className="text-slate-700 text-xs sm:text-sm font-medium">
                Next Steps for Reactivation
              </p>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mt-1">
                Please settle the outstanding balance of ₹9,417 using the
                payment link above. Once confirmed, our system will
                automatically restore full hosting services. If you need
                assistance, visit{" "}
                <span className="font-mono text-[#673de6]">hostinger.in</span>{" "}
                or contact our support team.
              </p>
            </div>
          </div>
        </div>

        {/* Footer hint – looks official */}
        <p className="text-center text-[10px] sm:text-xs text-slate-400 mt-6 sm:mt-8 leading-relaxed">
          This is an automated message from Hostinger Billing System.
          <br />
          For questions, please refer to your account dashboard.
        </p>
      </div>
    </div>
  );
}

/* Reusable status pill component */
function StatusItem({
  icon,
  label,
  status,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  status: string;
  color: "purple" | "red";
}) {
  const statusColors = {
    purple: "bg-[#673de6]/10 text-[#673de6] border-[#673de6]/20",
    red: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-white/70 border border-slate-100">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="text-slate-400 shrink-0">{icon}</div>
        <span className="text-xs sm:text-sm font-medium text-slate-600 truncate">
          {label}
        </span>
      </div>
      <span
        className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border whitespace-nowrap ${statusColors[color]}`}
      >
        {status}
      </span>
    </div>
  );
}
