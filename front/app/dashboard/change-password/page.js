'use client';

import ChangePasswordForm from '../../components/ChangePasswordForm';
import AuthMiddleware from '../../components/AuthMiddleware';

export default function ChangePasswordPage() {
  return (
    <AuthMiddleware>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Changer le mot de passe</h1>
        <ChangePasswordForm />
      </div>
    </AuthMiddleware>
  );
} 