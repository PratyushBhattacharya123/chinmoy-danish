"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Session } from "@/@types";
import CustomLoader from "@/components/common/CustomLoader";

const Home = () => {
  const { data: session, status, update } = useSession();

  const router = useRouter();

  useEffect(() => {
    // Update session last used timestamp periodically (every hour)
    const interval = setInterval(() => {
      if (status === "authenticated") {
        update();
      }
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, [status, update]);

  useEffect(() => {
    const checkSessionValidity = async () => {
      console.log({ status });
      if (status === "unauthenticated") {
        router.push("/login");
        return;
      }

      if (status === "authenticated") {
        // Check if session has an error (like refresh token error)
        if ((session as Session)?.error === "RefreshAccessTokenError") {
          // Force sign out to get a new refresh token
          await signOut({ redirect: false });
          router.push("/login");
          return;
        }

        // If we have session data, check user type for redirection
        if (session && session.user) {
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
  }, [status, router, session]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return <CustomLoader />;
  }

  return null;
};

export default Home;
