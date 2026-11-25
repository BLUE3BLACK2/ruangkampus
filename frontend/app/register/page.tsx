import type { Metadata } from "next";

import RegisterForm from "@/features/auth/RegisterForm";
import PageContainer from "@/components/layout/PageContainer";

export const metadata: Metadata = {
  title: "Daftar Akun",
};

export default function RegisterPage() {
  return (
    <PageContainer>
      <div className="py-8">
        <RegisterForm />
      </div>
    </PageContainer>
  );
}