import { AdminProtected } from "@/hooks/protected/AdminProtectedRoute";

export default function OperatorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminProtected>{children}</AdminProtected>;
}
