import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import { getCollection } from "./db";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      try {
        // Check if user already exists in our custom collection
        const usersCollection = await getCollection("users");

        const adminExists = await usersCollection.findOne({
          email: process.env.ADMIN_EMAIL,
        });

        if (!adminExists) {
          // Creating admin if it doesn't exist
          await usersCollection.insertOne({
            email: process.env.ADMIN_EMAIL,
            name: process.env.ADMIN_NAME,
            createdAt: new Date(),
            updatedAt: new Date(),
            userType: "ADMIN",
          });
        }

        const existingUser = await usersCollection.findOne({
          email: user.email,
        });

        if (!existingUser) {
          // Create new user in our custom collection
          await usersCollection.insertOne({
            email: user.email,
            name: user.name,
            createdAt: new Date(),
            updatedAt: new Date(),
            userType: "USER",
          });
        } else {
          // Update existing user if needed
          await usersCollection.updateOne(
            { email: user.email },
            {
              $set: {
                updatedAt: new Date(),
              },
            }
          );
        }

        // Check if this sign in is allowed
        const dbUser = await usersCollection.findOne({ email: user.email });
        const isAllowedToSignIn =
          dbUser?.userType === "OPERATOR" || dbUser?.userType === "ADMIN";

        // Return true to allow signin, false to block
        return isAllowedToSignIn;
      } catch (error) {
        console.error("Error handling user sign in:", error);
        return false;
      }
    },
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user && account) {
        try {
          // Get the user from our custom collection
          const usersCollection = await getCollection("users");
          const dbUser = await usersCollection.findOne({
            email: user.email,
          });

          return {
            ...token,
            accessToken: account.access_token || "",
            accessTokenExpires:
              Date.now() + (Number(account.expires_in) || 3600) * 1000,
            refreshToken: account.refresh_token || "",
            error: "",
            lastUsed: Date.now(),
            sub: dbUser?._id.toString() || user.id,
            user: {
              id: dbUser?._id.toString() || user.id,
              email: user.email || "",
              name: user.name || "",
              userType: dbUser?.userType || "USER",
              image: user.image,
            },
          };
        } catch (error) {
          console.error("Error fetching user from database:", error);
          return token;
        }
      }

      // Handle session update
      if (trigger === "update" && session?.user) {
        token.user = { ...token.user, ...session.user };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return {
          ...token,
          lastUsed: Date.now(),
        };
      }

      // Access token has expired, try to update it
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Check for token expiration
      if (token.error === "RefreshAccessTokenError") {
        console.error("Token refresh failed");
      }

      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
      const isExpiredDueToInactivity =
        Date.now() - (token.lastUsed || 0) > threeDaysInMs;

      if (isExpiredDueToInactivity) {
        console.error("Session expired due to inactivity");
        // You might want to handle this differently
      }

      // Properly assign session values
      if (token.user) {
        session.user = {
          ...session.user,
          ...token.user,
          id: token.sub || token.user.id, // Ensure id is properly set
        };
      }

      session.accessToken = token.accessToken as string;
      session.error = token.error as string;
      session.lastUsed = token.lastUsed as number;

      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirects after sign in
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    error: "/unauthorized",
  },
  events: {
    async createUser({ user }) {
      try {
        // This might be redundant with the signIn callback
        const usersCollection = await getCollection("users");
        const existingUser = await usersCollection.findOne({
          email: user.email,
        });

        if (!existingUser) {
          await usersCollection.insertOne({
            email: user.email,
            name: user.name,
            createdAt: new Date(),
            updatedAt: new Date(),
            userType: "USER",
          });
        }
      } catch (error) {
        console.error("Error creating user in custom collection:", error);
      }
    },
  },
};

async function refreshAccessToken(token: JWT) {
  try {
    const url =
      "https://oauth2.googleapis.com/token?" +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      });

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error(refreshedTokens);
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      lastUsed: Date.now(),
    };
  } catch (error) {
    console.error("Error refreshing access token", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}
