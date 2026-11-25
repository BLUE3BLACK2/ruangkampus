import type { Metadata } from "next";

import LoginForm from "@/features/auth/LoginForm";
import PageContainer from "@/components/layout/PageContainer";

export const metadata: Metadata = {
  title: "Masuk",
};

export default function LoginPage() {
  return (
    <PageContainer>
      <div className="py-8">
        <LoginForm />
      </div>
    </PageContainer>
  );
}