"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import toast from "../utils/toast";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.prenom || !formData.nom || !formData.email || !formData.password || !formData.confirmPassword) {
        toast.error("Veuillez remplir tous les champs");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error("Les mots de passe ne correspondent pas");
        return;
      }

      if (!isStrongPassword(formData.password)) {
        toast.error(PASSWORD_REQUIREMENTS);
        return;
      }

      const userData = {
        first_name: formData.prenom,
        last_name: formData.nom,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
      };

      switch (userType) {
        case "eleve":
          await registerStudent(userData);
          break;
        case "professeur":
          await registerTeacher(userData);
          break;
        case "responsable":
          await registerLabManager(userData);
          break;
        default:
          toast.error("Type d'utilisateur non valide");
          return;
      }

      toast.success("Compte créé avec succès !");
      setTimeout(() => {
        router.push(returnPath);
      }, 900);
    } catch (error) {
      if (error.errors) {
        Object.values(error.errors).forEach((errorMessages) => {
          errorMessages.forEach((message) => toast.error(message));
        });
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Une erreur est survenue lors de l'inscription");
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitleByUserType = () => {
    switch (userType) {
      case "professeur":
        return "Inscription Enseignant";
      case "responsable":
        return "Inscription Responsable Laboratoire";
      case "eleve":
        return "Inscription Élève / Étudiant";
      default:
        return "Créer un compte";
    }
  };

  const getSubtitleByUserType = () => {
    switch (userType) {
      case "professeur":
        return "Créez votre profil formateur pour réserver des salles et partager vos supports.";
      case "responsable":
        return "Supervisez les réservations des laboratoires et la disponibilité du matériel.";
      case "eleve":
        return "Accédez aux supports de cours et aux ressources partagées par vos enseignants.";
      default:
        return "Inscrivez-vous pour accéder à la plateforme EduSpace.";
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-12 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Changer de profil
        </Link>
        <ThemeToggle />
      </div>

      <div className="max-w-lg w-full mx-auto my-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="mb-6">
            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">
              EduSpace · Portail Académique
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
                  Prénom <span className="text-red-500">*</span>
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
                  Nom <span className="text-red-500">*</span>
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
                Email académique <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                placeholder="nom.prenom@etablissement.tn"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-3.5 pr-10 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                  placeholder="••••••••••••"
                  minLength={12}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{PASSWORD_REQUIREMENTS}</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Confirmer le mot de passe <span className="text-red-500">*</span>
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
                {loading ? "Création du compte..." : "Créer mon compte"}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Vous avez déjà un compte ?{" "}
              <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
                Se connecter
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
