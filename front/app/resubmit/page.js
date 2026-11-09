"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  PhotoIcon,
  PaperClipIcon,
  XMarkIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "../utils/toast";
import { resubmitAccountRequest } from "../services/accountRequestService";
import { useLanguage } from "../context/LanguageContext";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";

function ResubmitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tr, isRtl } = useLanguage();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    institution: "",
    department: "",
    staff_id: "",
    professional_phone: "",
    notes: "",
  });

  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setFormData((prev) => ({ ...prev, email: emailParam }));
    }
  }, [searchParams]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedMimes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedMimes.includes(file.type)) {
      toast.error(tr("Format de fichier non supporté. Veuillez joindre un PDF, PNG ou JPEG."));
      e.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      toast.error(tr("Le fichier dépasse la taille maximale autorisée de 5 Mo."));
      e.target.value = "";
      return;
    }

    setProofFile(file);
  };

  const handleRemoveFile = () => {
    setProofFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.email.trim() || !formData.password) {
        toast.error(tr("Veuillez renseigner votre email et mot de passe"));
        return;
      }

      if (!formData.institution.trim() || !formData.department.trim() || !formData.staff_id.trim()) {
        toast.error(tr("Veuillez renseigner tous les champs d'identité institutionnelle"));
        return;
      }

      const payload = new FormData();
      payload.append("email", formData.email.trim());
      payload.append("password", formData.password);
      payload.append("institution", formData.institution.trim());
      payload.append("department", formData.department.trim());
      payload.append("staff_id", formData.staff_id.trim());
      if (formData.professional_phone.trim()) {
        payload.append("professional_phone", formData.professional_phone.trim());
      }
      if (formData.notes.trim()) {
        payload.append("notes", formData.notes.trim());
      }
      if (proofFile) {
        payload.append("proof_document", proofFile);
      }

      const res = await resubmitAccountRequest(payload);
      toast.success(tr(res.message));
      setSuccess(true);
    } catch (err) {
      console.error("Resubmission error:", err);
      toast.error(tr(err.message || "Erreur lors de la nouvelle soumission de votre demande"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-6 sm:p-12">
      {/* Top Bar */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between gap-2 pb-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white"
        >
          <ArrowLeftIcon className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
          {tr("Retour à la connexion")}
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto w-full">
        {success ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircleIcon className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {tr("Demande renvoyée avec succès !")}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {tr(
                "Vos informations institutionnelles et votre justificatif ont été transmis à l'administration. Votre dossier est de nouveau en attente de validation."
              )}
            </p>
            <div className="pt-4">
              <Button onClick={() => router.push("/login")} className="w-full sm:w-auto">
                {tr("Retourner à la page de connexion")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div>
              <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
                {tr("Correction et nouvelle soumission de votre dossier")}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {tr(
                  "Mettez à jour vos informations institutionnelles ou joignez un nouveau justificatif professionnel pour réexamen par l'administration."
                )}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Credentials Section */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {tr("Vérification de vos identifiants")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {tr("Adresse email")}
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {tr("Mot de passe")}
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Institutional fields */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {tr("Informations institutionnelles")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {tr("Établissement / Institution")} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      placeholder="ex: Université de Tunis"
                      className="w-full px-3 py-2 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {tr("Département")} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="ex: Génie Informatique"
                      className="w-full px-3 py-2 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {tr("Matricule professionnel / ID")} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.staff_id}
                      onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                      placeholder="ex: ENS-12345"
                      className="w-full px-3 py-2 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {tr("Téléphone professionnel")}
                    </label>
                    <input
                      type="text"
                      value={formData.professional_phone}
                      onChange={(e) => setFormData({ ...formData, professional_phone: e.target.value })}
                      placeholder="ex: +216 71 000 000"
                      className="w-full px-3 py-2 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Document upload dropzone */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div>
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {tr("Nouveau document justificatif (optionnel si inchangé)")}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {tr("Carte professionnelle, attestation de travail ou arrêté de nomination (PDF, JPEG, PNG <= 5 Mo)")}
                  </p>
                </div>

                {proofFile ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <PaperClipIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {proofFile.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({(proofFile.size / 1024 / 1024).toFixed(2)} Mo)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 rounded text-slate-400 hover:text-red-600 transition-colors"
                      title={tr("Supprimer")}
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-white dark:hover:bg-slate-900 transition-all text-center">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <DocumentTextIcon className="w-6 h-6" />
                      <PhotoIcon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {tr("Cliquer pour sélectionner un nouveau justificatif")}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      PDF, PNG ou JPEG jusqu&apos;à 5 Mo
                    </span>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Notes for administration */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {tr("Explications ou remarques pour l'administration (optionnel)")}
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={tr("Précisez les corrections apportées à votre dossier...")}
                  className="w-full px-3 py-2 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? tr("Envoi en cours...") : tr("Renvoyer ma demande pour validation")}
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-2xl mx-auto w-full text-center text-xs text-slate-500 pt-6">
        © {new Date().getFullYear()} EduSpace · CSFT Tunisie
      </div>
    </div>
  );
}

export default function ResubmitPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <ResubmitContent />
    </React.Suspense>
  );
}
