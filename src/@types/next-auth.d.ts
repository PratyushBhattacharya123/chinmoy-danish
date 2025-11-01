import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
    lastUsed?: number;
    user: User;
  }

  interface User {
    userType?: "ADMIN" | "OPERATOR" | "USER";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken: string;
    accessTokenExpires: number;
    refreshToken: string;
    error: string;
    lastUsed: number;
    user: {
      id: string;
      email: string;
      name: string;
      userType: "ADMIN" | "OPERATOR" | "USER";
    };
  }
}
