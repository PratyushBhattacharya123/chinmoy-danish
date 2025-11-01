"use client";

import React from "react";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";

interface OperatorProtectedProps {
  children: React.ReactNode;
}

export function OperatorProtected({ children }: OperatorProtectedProps) {
  const { data: sessionData, status } = useSession();

  if (status !== "loading" && sessionData) {
    const isOperator = sessionData.user.userType === "OPERATOR";
    const isAdmin = sessionData.user.userType === "ADMIN";
    return isOperator || isAdmin ? children : redirect("/unauthorized");
  }
}
