import { OperatorProtected } from "@/hooks/protected/OperatorProtectedRoute";

export default function OperatorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <OperatorProtected>{children}</OperatorProtected>;
}
