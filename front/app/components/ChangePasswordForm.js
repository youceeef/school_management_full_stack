"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changePassword } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import FormInput from "./FormInput";
import Button from "./Button";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ChangePasswordForm() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    email: user?.email || "",
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await changePassword({ ...formData, email: user?.email });
      setSuccess("Mot de passe modifié avec succès !");

      // Wait a moment to show the success message before logging out
      setTimeout(async () => {
        await logout();
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Une erreur est survenue lors du changement de mot de passe");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
      {/* <h2 className="text-2xl font-bold mb-6 text-center">Change Password</h2> */}

      {error && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded dark:bg-red-900/50 dark:text-red-400">{error}</div>}

      {success && <div className="mb-6 p-4 bg-green-100 text-green-700 rounded dark:bg-green-900/50 dark:text-green-400">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={user?.email || ""}
            disabled
            className="mt-1 block w-full px-4 py-2.5 rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mot de passe actuel <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              id="current_password"
              name="current_password"
              value={formData.current_password}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              {showCurrentPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nouveau mot de passe <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              {showNewPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirmer le nouveau mot de passe <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="password_confirmation"
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              {showConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            loading={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            variant="primary"
          >
            {loading ? "Changement en cours..." : "Changer le mot de passe"}
          </Button>
        </div>
      </form>
    </div>
  );
}
