"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentArrowUpIcon,
  DocumentCheckIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import toast from "../utils/toast";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import Button from "./Button";
import { isStrongPassword, PASSWORD_REQUIREMENTS } from "../utils/password";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
];

export default function RegisterForm({ userType, returnPath = "/login" }) {
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    password: "",
    confirmPassword: "",
    institution: "",
    department: "",
    staff_id: "",
    professional_phone: "",
  });
  const [proofFile, setProofFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();
  const { registerStudent, registerTeacher, registerLabManager } = useAuth();
  const { t, tr, isRtl } = useLanguage();

  const isStaff = userType === "professeur" || userType === "responsable";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError(tr("Formats acceptés : PDF, JPEG, PNG uniquement."));
      setProofFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(tr("Le fichier ne doit pas dépasser 5 Mo."));
      setProofFile(null);
      return;
    }

    setFileError("");
    setProofFile(file);
  };

  const handleRemoveFile = () => {
    setProofFile(null);
    setFileError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Ko";
    const k = 1024;
    if (bytes < k * k) {
      return (bytes / k).toFixed(1) + " Ko";
    }
    return (bytes / (k * k)).toFixed(2) + " Mo";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (
        !formData.prenom ||
        !formData.nom ||
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword
      ) {
        toast.error(tr("Veuillez remplir tous les champs"));
        return;
      }

      if (
        isStaff &&
        (!formData.institution.trim() ||
          !formData.department.trim() ||
          !formData.staff_id.trim())
      ) {
        toast.error(
          tr("Veuillez renseigner les informations de votre établissement")
        );
        return;
      }

      if (isStaff && !proofFile) {
        toast.error(
          tr(
            "Veuillez joindre un justificatif d'identité professionnelle (PDF, PNG ou JPEG)"
          )
        );
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

      let payload;

      if (isStaff) {
        const data = new FormData();
        data.append("first_name", formData.prenom.trim());
        data.append("last_name", formData.nom.trim());
        data.append("email", formData.email.trim());
        data.append("password", formData.password);
        data.append("password_confirmation", formData.confirmPassword);
        data.append("institution", formData.institution.trim());
        data.append("department", formData.department.trim());
        data.append("staff_id", formData.staff_id.trim());
        if (formData.professional_phone?.trim()) {
          data.append(
            "professional_phone",
            formData.professional_phone.trim()
          );
        }
        if (proofFile) {
          data.append("proof_document", proofFile);
        }
        payload = data;
      } else {
        payload = {
          first_name: formData.prenom.trim(),
          last_name: formData.nom.trim(),
          email: formData.email.trim(),
          password: formData.password,
          password_confirmation: formData.confirmPassword,
        };
      }

      let response;

      switch (userType) {
        case "eleve":
          response = await registerStudent(payload);
          break;
        case "professeur":
          response = await registerTeacher(payload);
          break;
        case "responsable":
          response = await registerLabManager(payload);
          break;
        default:
          toast.error(tr("Type d'utilisateur non valide"));
          return;
      }

      // Staff cannot log in or be reviewed until they confirm their address:
      // show a persistent screen instead of redirecting to the login form.
      if (response?.approval_required) {
        setVerificationNotice({
          email: formData.email.trim(),
          sent: Boolean(response.verification_email_sent),
        });
        return;
      }

      toast.success(tr("Compte créé avec succès !"));
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

  if (verificationNotice) {
    const NoticeIcon = verificationNotice.sent ? EnvelopeIcon : ExclamationTriangleIcon;

    return (
      <div className="min-h-screen flex flex-col justify-between p-6 sm:p-12 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-xl w-full mx-auto flex items-center justify-between gap-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeftIcon className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
            {t("auth.backToLogin")}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <div className="max-w-lg w-full mx-auto my-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-5 ${
                verificationNotice.sent
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
              }`}
            >
              <NoticeIcon className="w-6 h-6" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {verificationNotice.sent
                ? t("auth.verificationSentTitle")
                : t("auth.verificationFailedTitle")}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              {verificationNotice.sent
                ? t("auth.verificationSentDesc", { email: verificationNotice.email })
                : t("auth.verificationFailedDesc")}
            </p>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() =>
                  router.push(verificationNotice.sent ? "/login" : "/email-verified")
                }
              >
                {verificationNotice.sent
                  ? t("auth.backToLogin")
                  : t("auth.verificationRequestNewLink")}
              </Button>

              <Link
                href={verificationNotice.sent ? "/email-verified" : "/login"}
                className="block text-center text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                {verificationNotice.sent
                  ? t("auth.verificationRequestNewLink")
                  : t("auth.backToLogin")}
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} EduSpace — CSFT Tunisie
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {getTitleByUserType()}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {getSubtitleByUserType()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="prenom"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
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
                <label
                  htmlFor="nom"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
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
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
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

            {isStaff && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  {tr("Informations professionnelles")}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="institution"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      {tr("Établissement / Institution")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="institution"
                      name="institution"
                      type="text"
                      value={formData.institution}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                      placeholder={tr(
                        "ex. Faculté des Sciences de Tunis, CSFT..."
                      )}
                      required={isStaff}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="department"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      {tr("Département / Laboratoire")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="department"
                      name="department"
                      type="text"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                      placeholder={tr(
                        "ex. Département Informatique, Labo Physique..."
                      )}
                      required={isStaff}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="staff_id"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      {tr("Identifiant / Matricule professionnel")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="staff_id"
                      name="staff_id"
                      type="text"
                      value={formData.staff_id}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                      placeholder={tr("ex. ENS-2026-084, LAB-104...")}
                      required={isStaff}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="professional_phone"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      {tr("Téléphone professionnel")}
                    </label>
                    <input
                      id="professional_phone"
                      name="professional_phone"
                      type="tel"
                      value={formData.professional_phone}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                      placeholder="+216 71 000 000"
                    />
                  </div>
                </div>

                {/* Proof Document Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {tr("Justificatif professionnel")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    {tr(
                      "Carte professionnelle, attestation de travail ou arrêté d'affectation (PDF, PNG ou JPEG, max 5 Mo)."
                    )}
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    id="proof_document"
                    name="proof_document"
                    accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {!proofFile ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-400 rounded-xl p-4 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center gap-2 group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <DocumentArrowUpIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {tr("Choisir un document")}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {tr("PDF, PNG ou JPEG jusqu'à 5 Mo")}
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <DocumentCheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                            {proofFile.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {formatFileSize(proofFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title={tr("Supprimer le fichier")}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {fileError && (
                    <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">
                      {fileError}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
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
                  aria-label={
                    showPassword
                      ? t("auth.hidePassword")
                      : t("auth.showPassword")
                  }
                  className={`absolute inset-y-0 ${
                    isRtl ? "left-0 pl-3" : "right-0 pr-3"
                  } flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300`}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {tr(PASSWORD_REQUIREMENTS)}
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {t("auth.confirmPassword")}{" "}
                <span className="text-red-500">*</span>
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
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
              >
                {loading
                  ? t("auth.creatingAccount")
                  : t("auth.createMyAccount")}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t("auth.alreadyHaveAccount")}{" "}
              <Link
                href="/login"
                className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {t("auth.signInBtn")}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} EduSpace — CSFT Tunisie
      </div>
    </div>
  );
}
