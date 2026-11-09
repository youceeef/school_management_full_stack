"use client";

import ChangePasswordForm from "../../components/ChangePasswordForm";
import AuthMiddleware from "../../components/AuthMiddleware";
import { PageHeader } from "../../components/ui";

export default function ChangePasswordPage() {
  return (
    <AuthMiddleware>
      <div className="space-y-6">
        <PageHeader
          title="Sécurité du compte"
          description="Modifiez votre mot de passe personnel pour sécuriser votre accès à EduSpace."
        />
        <ChangePasswordForm />
      </div>
    </AuthMiddleware>
  );
}