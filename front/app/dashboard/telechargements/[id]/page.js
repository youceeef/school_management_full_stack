"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import toast from "../../../utils/toast";
import Button from "../../../components/Button";
import { Card, PageHeader } from "../../../components/ui";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { getDocument, downloadDocument } from "../../../services/documentService";

export default function TelechargementDetailPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const documentId = resolvedParams.id;

  const [documentData, setDocumentData] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let objectUrl;
    let cancelled = false;

    const fetchDocument = async () => {
      setIsLoading(true);

      try {
        const data = await getDocument(documentId);
        if (cancelled) return;
        setDocumentData(data);

        if (data.file_type?.startsWith("image/")) {
          const blob = await downloadDocument(documentId);
          objectUrl = window.URL.createObjectURL(blob);
          if (!cancelled) setPreviewUrl(objectUrl);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du document:", error);
        toast.error(error.message || "Impossible de charger les informations du document");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();

    return () => {
      cancelled = true;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [documentId]);

  const handleDownload = async () => {
    if (!documentData) return;

    try {
      toast.info("Téléchargement en cours...");
      const blob = await downloadDocument(documentId);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", documentData.title || "document");
      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success("Document téléchargé avec succès");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error(error.message || "Erreur lors du téléchargement du document");
    }
  };

  const getFormattedAuthor = (user) => {
    if (!user) return "Enseignant";
    return `${user.first_name} ${user.last_name}`;
  };

  const getFileType = (mimeType) => {
    if (!mimeType) return "DOC";
    if (mimeType.includes("pdf")) return "PDF";
    if (mimeType.includes("word") || mimeType.includes("docx")) return "DOCX";
    if (mimeType.includes("excel") || mimeType.includes("xlsx")) return "XLSX";
    if (mimeType.includes("powerpoint") || mimeType.includes("pptx")) return "PPTX";
    if (mimeType.includes("image/jpeg") || mimeType.includes("image/jpg")) return "JPG";
    if (mimeType.includes("image/png")) return "PNG";
    return (mimeType.split("/")[1] || "DOC").toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return { date: "—", time: "" };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (!documentData) {
    return (
      <Card>
        <div className="text-center py-12">
          <h1 className="text-lg font-display font-semibold text-slate-900 dark:text-white mb-2">
            Document introuvable
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Le document demandé n&apos;existe pas ou a été retiré.
          </p>
          <Link href="/dashboard/telechargements">
            <Button variant="primary">Retour aux téléchargements</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const fileType = getFileType(documentData.file_type);

  return (
    <div className="space-y-6">
      <PageHeader
        title={documentData.title}
        description={`Publié le ${formatDate(documentData.created_at).date} à ${
          formatDate(documentData.created_at).time
        }`}
        actions={[
          {
            children: "Retour au catalogue",
            icon: ArrowLeftIcon,
            variant: "secondary",
            onClick: () => router.push("/dashboard/telechargements"),
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Aperçu du document" subtitle={`Format ${fileType}`}>
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 min-h-64 flex flex-col justify-center items-center text-center">
              {fileType === "JPG" || fileType === "PNG" ? (
                <Image
                  src={
                    previewUrl ||
                    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                  }
                  alt={documentData.title}
                  width={500}
                  height={300}
                  unoptimized
                  className="max-h-72 max-w-full object-contain rounded-lg"
                />
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-3">
                    <DocumentTextIcon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Aperçu direct non disponible pour ce fichier {fileType}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Cliquez sur « Télécharger le support » pour l&apos;ouvrir sur votre appareil.
                  </p>
                </>
              )}
            </div>
          </Card>

          <Card title="Informations pédagogiques">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Auteur
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                    {getFormattedAuthor(documentData.user)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Date de mise en ligne
                  </p>
                  <p className="text-sm font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                    {formatDate(documentData.created_at).date}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Format
                  </p>
                  <p className="text-sm font-mono font-semibold text-slate-900 dark:text-white mt-1">
                    {fileType}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Description du support
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {documentData.description || "Aucune description disponible."}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card title="Téléchargement" subtitle="Accès direct au fichier">
            <Button
              onClick={handleDownload}
              variant="primary"
              icon={ArrowDownTrayIcon}
              className="w-full"
            >
              Télécharger le support
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
