"use client";

import React from "react";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";

interface AdminProtectedProps {
  children: React.ReactNode;
}

export function AdminProtected({ children }: AdminProtectedProps) {
  const { data: sessionData, status } = useSession();

  if (status !== "loading" && sessionData) {
    const isAdmin = sessionData.user.userType === "ADMIN";
    return isAdmin ? children : redirect("/unauthorized");
  }
}
