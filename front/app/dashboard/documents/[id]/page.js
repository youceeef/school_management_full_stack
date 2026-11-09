"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import toast from "../../../utils/toast";
import Button from "../../../components/Button";
import FormInput from "../../../components/FormInput";
import FormTextArea from "../../../components/FormTextArea";
import { Card, PageHeader } from "../../../components/ui";
import LoadingSpinner from "../../../components/LoadingSpinner";
import {
  getDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
} from "../../../services/documentService";

export default function DocumentDetailPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const documentId = resolvedParams.id;

  const [documentData, setDocumentData] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  useEffect(() => {
    let objectUrl;
    let cancelled = false;

    const fetchDocument = async () => {
      setIsLoading(true);

      try {
        const data = await getDocument(documentId);
        if (cancelled) return;
        setDocumentData(data);
        setFormData({
          title: data.title || "",
          description: data.description || "",
        });

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

  const handleDelete = () => {
    if (!documentData) return;

    toast.confirmDelete(
      "Êtes-vous sûr de vouloir supprimer ce document ?",
      async () => {
        await deleteDocument(documentId);
        router.push("/dashboard/documents");
      },
      {
        loading: "Suppression du document en cours...",
        success: "Le document a été supprimé",
        error: "Erreur lors de la suppression du document",
      }
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      const response = await updateDocument(documentId, formData);

      setDocumentData({
        ...documentData,
        ...response.document,
        updated_at: response.updated_at,
      });

      toast.success("Document mis à jour avec succès");
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du document:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du document");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      title: documentData.title || "",
      description: documentData.description || "",
    });
    setIsEditing(false);
  };

  const getFormattedAuthor = (user) => {
    if (!user) return "Utilisateur inconnu";
    return `${user.first_name} ${user.last_name}`;
  };

  const getFileType = (mimeType) => {
    if (!mimeType) return "Inconnu";
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
            Le document demandé n&apos;existe pas ou a été supprimé.
          </p>
          <Link href="/dashboard/documents">
            <Button variant="primary">Retour aux documents</Button>
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
            children: "Retour aux documents",
            icon: ArrowLeftIcon,
            variant: "secondary",
            onClick: () => router.push("/dashboard/documents"),
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Aperçu du fichier" subtitle={`Format ${fileType}`}>
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
                    Aperçu direct non pris en charge pour les fichiers {fileType}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Téléchargez le support pour le consulter sur votre poste.
                  </p>
                </>
              )}
            </div>
          </Card>

          <Card title={isEditing ? "Modifier les métadonnées" : "Informations du document"}>
            {!isEditing ? (
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
                      Date d’ajout
                    </p>
                    <p className="text-sm font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                      {formatDate(documentData.created_at).date}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Type de fichier
                    </p>
                    <p className="text-sm font-mono font-semibold text-slate-900 dark:text-white mt-1">
                      {fileType}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {documentData.description || "Aucune description renseignée pour ce document."}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                  label="Titre du document"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
                <FormTextArea
                  label="Description"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  required
                />
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button type="button" onClick={handleCancelEdit} variant="secondary">
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary">
                    Enregistrer
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>

        <div>
          <Card title="Actions sur le fichier" subtitle="Gestion et téléchargement">
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleDownload}
                variant="primary"
                icon={ArrowDownTrayIcon}
                className="w-full"
              >
                Télécharger le fichier
              </Button>

              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="secondary"
                  icon={PencilSquareIcon}
                  className="w-full"
                >
                  Modifier les informations
                </Button>
              )}

              <Button
                onClick={handleDelete}
                variant="danger"
                icon={TrashIcon}
                className="w-full"
              >
                Supprimer le document
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
