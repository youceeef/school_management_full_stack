"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import toast from "../../utils/toast";
import { Card, DataTable, StatsCard, PageHeader } from "../../components/ui";
import Button from "../../components/Button";
import FormInput from "../../components/FormInput";
import FormTextArea from "../../components/FormTextArea";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  ArrowDownTrayIcon,
  ClockIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  getDocuments,
  createDocument,
  deleteDocument,
  downloadDocument,
} from "../../services/documentService";
import PermissionGate from "../../components/PermissionGate";
import { PERMISSIONS } from "../../constants/permissions";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function DocumentsPageWrapper() {
  return (
    <ProtectedRoute permission={PERMISSIONS.SHOW_DOCUMENTS}>
      <DocumentsPage />
    </ProtectedRoute>
  );
}

function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const getFileType = (mimeType) => {
    if (!mimeType) return "FICHIER";
    if (mimeType.includes("pdf")) return "PDF";
    if (mimeType.includes("word") || mimeType.includes("docx")) return "DOCX";
    if (mimeType.includes("excel") || mimeType.includes("xlsx")) return "XLSX";
    if (mimeType.includes("powerpoint") || mimeType.includes("pptx")) return "PPTX";
    if (mimeType.includes("image/jpeg") || mimeType.includes("image/jpg")) return "JPG";
    if (mimeType.includes("image/png")) return "PNG";
    return (mimeType.split("/")[1] || "DOC").toUpperCase();
  };

  const getFormattedAuthor = (user) => {
    if (!user) return "Utilisateur inconnu";
    return `${user.first_name} ${user.last_name}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return { date: "—", time: "" };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const truncateDescription = (description, maxLength = 60) => {
    if (!description) return "—";
    return description.length > maxLength
      ? `${description.substring(0, maxLength)}...`
      : description;
  };

  const recentCount = documents.filter((doc) => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return new Date(doc.created_at) >= oneMonthAgo;
  }).length;

  const statsCards = [
    {
      title: "Documents publiés",
      value: documents.length.toLocaleString("fr-FR"),
      icon: DocumentTextIcon,
    },
    {
      title: "Ajoutés ces 30 derniers jours",
      value: recentCount.toLocaleString("fr-FR"),
      icon: ClockIcon,
    },
  ];

  const columns = [
    {
      header: "Document",
      accessor: "title",
      render: (row) => {
        const ext = getFileType(row.file_type);
        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-11 shrink-0 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {ext}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {row.title}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Format {ext}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Auteur",
      accessor: "user",
      render: (row) => (
        <span className="text-sm text-slate-700 dark:text-slate-300">
          {getFormattedAuthor(row.user)}
        </span>
      ),
    },
    {
      header: "Description",
      accessor: "description",
      render: (row) => (
        <div
          className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate"
          title={row.description || ""}
        >
          {truncateDescription(row.description)}
        </div>
      ),
    },
    {
      header: "Publication",
      accessor: "created_at",
      render: (row) => {
        const formatted = formatDate(row.created_at);
        return (
          <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
            {formatted.date} · {formatted.time}
          </span>
        );
      },
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <PermissionGate permission={PERMISSIONS.VIEW_DOCUMENT}>
            <Link href={`/dashboard/documents/${row.id}`}>
              <Button variant="secondary" size="sm">
                Détails
              </Button>
            </Link>
          </PermissionGate>

          <PermissionGate permission={PERMISSIONS.DOWNLOAD_DOCUMENTS}>
            <Button
              variant="table-action"
              size="sm"
              icon={ArrowDownTrayIcon}
              onClick={() => handleDownload(row.id)}
            >
              Télécharger
            </Button>
          </PermissionGate>

          <PermissionGate permission={PERMISSIONS.DELETE_DOCUMENTS}>
            <Button
              variant="table-action"
              size="sm"
              onClick={() => handleDelete(row.id)}
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <TrashIcon className="w-4 h-4 mr-1 shrink-0" />
              Supprimer
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  const fetchDocuments = async () => {
    setIsDataLoading(true);
    try {
      const data = await getDocuments();
      setDocuments(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des documents:", error);
      toast.error(error.message || "Impossible de charger les documents");
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        file,
      }));
      toast.success(`Fichier ${file.name} sélectionné`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error("Veuillez remplir le titre du document");
      return;
    }

    if (!formData.file) {
      toast.error("Veuillez sélectionner un fichier à télécharger");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("file", formData.file);
    formDataToSend.append("description", formData.description || "");

    setIsLoading(true);
    setIsSubmitting(true);

    try {
      await createDocument(formDataToSend);

      setFormData({
        title: "",
        description: "",
        file: null,
      });

      setShowModal(false);
      toast.success(`Document "${formData.title}" ajouté avec succès`);
      fetchDocuments();
    } catch (error) {
      console.error("Erreur lors de l'ajout du document:", error);
      toast.error(error.message || "Erreur lors de l'ajout du document");
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    toast.confirmDelete(
      "Êtes-vous sûr de vouloir supprimer ce document ?",
      async () => {
        await deleteDocument(id);
        setDocuments((current) => current.filter((doc) => doc.id !== id));
      },
      {
        loading: "Suppression du document en cours...",
        success: "Le document a été supprimé",
        error: "Erreur lors de la suppression du document",
      }
    );
  };

  const handleDownload = async (id) => {
    try {
      toast.info("Téléchargement en cours...");
      const doc = documents.find((d) => d.id === id);
      const fileName = doc ? doc.title : "document";

      const blob = await downloadDocument(id);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
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

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.user && getFormattedAuthor(doc.user).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bibliothèque de documents"
        description="Publiez et gérez les supports de cours, énoncés de TP et ressources administratives."
        actions={[
          {
            children: "Publier un document",
            icon: PlusIcon,
            variant: "primary",
            onClick: () => setShowModal(true),
            loading: isSubmitting,
            permission: PERMISSIONS.UPLOAD_DOCUMENTS,
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statsCards.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            loading={isDataLoading}
          />
        ))}
      </div>

      <Card title="Répertoire des documents" subtitle="Supports accessibles aux utilisateurs autorisés">
        {isDataLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredDocuments}
            searchable
            onSearch={setSearchTerm}
            searchPlaceholder="Rechercher par titre, auteur ou description..."
          />
        )}
      </Card>

      {showModal && (
        <PermissionGate permission={PERMISSIONS.UPLOAD_DOCUMENTS}>
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-xl overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                <h2 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                  Publier un nouveau document
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <FormInput
                  label="Titre du support"
                  id="doc-title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Support de cours — Algorithmique avancée"
                  required
                />

                <FormTextArea
                  label="Description pédagogique"
                  id="doc-desc"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Précisez la filière, le module ou les consignes associées..."
                  rows={3}
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Fichier joint <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />
                  {formData.file && (
                    <div className="mt-2.5 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {formData.file.name}
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0 ml-3">
                        {(formData.file.size / 1024).toFixed(0)} Ko
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button type="button" onClick={() => setShowModal(false)} variant="secondary">
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" loading={isLoading}>
                    {isLoading ? "Envoi en cours..." : "Publier le document"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </PermissionGate>
      )}
    </div>
  );
}
