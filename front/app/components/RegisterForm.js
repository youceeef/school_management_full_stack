"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import toast from "../utils/toast";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import Button from "./Button";
import { isStrongPassword, PASSWORD_REQUIREMENTS } from "../utils/password";

export default function RegisterForm({ userType, returnPath = "/login" }) {
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { registerStudent, registerTeacher, registerLabManager } = useAuth();
  const { t, tr, isRtl } = useLanguage();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.prenom || !formData.nom || !formData.email || !formData.password || !formData.confirmPassword) {
        toast.error(tr("Veuillez remplir tous les champs"));
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error(tr("Les mots de passe ne correspondent pas"));
        return;
      }

      if (!isStrongPassword(formData.password)) {
        toast.error(tr(PASSWORD_REQUIREMENTS));
        return;
      }

      const userData = {
        first_name: formData.prenom,
        last_name: formData.nom,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
      };

      let response;

      switch (userType) {
        case "eleve":
          response = await registerStudent(userData);
          break;
        case "professeur":
          response = await registerTeacher(userData);
          break;
        case "responsable":
          response = await registerLabManager(userData);
          break;
        default:
          toast.error(tr("Type d'utilisateur non valide"));
          return;
      }

      toast.success(
        response?.approval_required
          ? tr(response.message)
          : tr("Compte créé avec succès !")
      );
      setTimeout(() => {
        router.push(returnPath);
      }, 900);
    } catch (error) {
      if (error.errors) {
        Object.values(error.errors).forEach((errorMessages) => {
          errorMessages.forEach((message) => toast.error(tr(message)));
        });
      } else if (error.message) {
        toast.error(tr(error.message));
      } else {
        toast.error(tr("Une erreur est survenue lors de l'inscription"));
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitleByUserType = () => {
    switch (userType) {
      case "professeur":
        return tr("Inscription Enseignant");
      case "responsable":
        return tr("Inscription Responsable Laboratoire");
      case "eleve":
        return tr("Inscription Élève / Étudiant");
      default:
        return t("auth.createAccountLink");
    }
  };

  const getSubtitleByUserType = () => {
    switch (userType) {
      case "professeur":
        return t("auth.teacherRoleDesc");
      case "responsable":
        return t("auth.labManagerRoleDesc");
      case "eleve":
        return t("auth.studentRoleDesc");
      default:
        return t("auth.registerHubSubtitle");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-12 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-xl w-full mx-auto flex items-center justify-between gap-2">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeftIcon className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
          {tr("Changer de profil")}
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-lg w-full mx-auto my-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="mb-6">
            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">
              {t("auth.registerHubEyebrow")}
            </p>
            <h1 className="mt-1 text-2xl font-bold font-display text-slate-900 dark:text-white">
              {getTitleByUserType()}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{getSubtitleByUserType()}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("auth.firstName")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="prenom"
                  name="prenom"
                  type="text"
                  value={formData.prenom}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                  placeholder="Youssef"
                  required
                />
              </div>

              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("auth.lastName")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="nom"
                  name="nom"
                  type="text"
                  value={formData.nom}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                  placeholder="Kaabechi"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t("auth.emailLabel")} <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                placeholder={t("auth.emailPlaceholder")}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t("auth.passwordLabel")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full ${
                    isRtl ? "pr-3.5 pl-10" : "pl-3.5 pr-10"
                  } py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600`}
                  placeholder="••••••••••••"
                  minLength={12}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  className={`absolute inset-y-0 ${
                    isRtl ? "left-0 pl-3" : "right-0 pr-3"
                  } flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300`}
                >
                  {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{tr(PASSWORD_REQUIREMENTS)}</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t("auth.confirmPassword")} <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                placeholder="••••••••••••"
                minLength={12}
                required
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                {loading ? t("auth.creatingAccount") : t("auth.createMyAccount")}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t("auth.alreadyHaveAccount")}{" "}
              <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
                {t("auth.signInBtn")}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} EduSpace · CSFT Tunisie
      </div>
    </div>
  );
}
