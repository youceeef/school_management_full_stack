"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "../utils/toast";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

export default function RegisterForm({ userType, returnPath = "/login" }) {
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
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
      // Validation de base
      if (!formData.prenom || !formData.nom || !formData.email || !formData.password || !formData.confirmPassword) {
        toast.error("Veuillez remplir tous les champs");
        return;
      }

      // Vérification que les mots de passe correspondent
      if (formData.password !== formData.confirmPassword) {
        toast.error("Les mots de passe ne correspondent pas");
        return;
      }

      // Vérification de la longueur du mot de passe
      if (formData.password.length < 6) {
        toast.error("Le mot de passe doit contenir au moins 6 caractères");
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
          toast.error("Type d'utilisateur non valide");
          return;
      }

      toast.success("Compte créé avec succès!");

      // Redirection vers la page de connexion après inscription
      setTimeout(() => {
        router.push(returnPath);
      }, 1000);
    } catch (error) {
      // Handle validation errors from Laravel
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
        return "Inscription Élève";
      default:
        return "Créer un compte";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{getTitleByUserType()}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Inscrivez-vous pour accéder au dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prénom
            </label>
            <input
              id="prenom"
              name="prenom"
              type="text"
              value={formData.prenom}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Jean"
              required
            />
          </div>

          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom
            </label>
            <input id="nom" name="nom" type="text" value={formData.nom} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Dupont" required />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="votre@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white font-medium rounded-md transition duration-200 disabled:bg-purple-400 dark:disabled:bg-purple-500">
              {loading ? "Création du compte..." : "S'inscrire"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Déjà un compte?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
