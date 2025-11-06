import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      isRecruiter: boolean;
      companyId?: string;
      status: string;
      onboardingCompleted: boolean;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isRecruiter: boolean;
    companyId?: string;
    status: string;
    onboardingCompleted: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    name: string;
    role: string;
    isRecruiter: boolean;
    companyId?: string;
    status: string;
    onboardingCompleted: boolean;
  }
}
