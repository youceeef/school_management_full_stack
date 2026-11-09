"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "../../utils/toast";
import { getTelechargements, downloadDocument } from "../../services/documentService";
import { Card, PageHeader, DataTable } from "../../components/ui";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function TelechargementsPage() {
  const [documents, setDocuments] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsDataLoading(true);
    try {
      const data = await getTelechargements();
      setDocuments(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des documents:", error);
      toast.error(error.message || "Impossible de charger les documents");
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      toast.info("Téléchargement en cours...");
      const blob = await downloadDocument(doc.id);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.title);
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
        month: "short",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.user && getFormattedAuthor(doc.user).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedDocuments = [...filteredDocuments].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const truncateDescription = (description, maxLength = 80) => {
    if (!description) return "Aucune description";
    return description.length > maxLength
      ? `${description.substring(0, maxLength)}...`
      : description;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supports de cours & Téléchargements"
        description="Consultez et téléchargez les ressources pédagogiques partagées par vos enseignants."
      />

      <Card
        title="Catalogue des ressources"
        subtitle={`${sortedDocuments.length} support${
          sortedDocuments.length > 1 ? "s" : ""
        } disponible${sortedDocuments.length > 1 ? "s" : ""}`}
        headerActions={
          <div className="relative w-full sm:w-72">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un cours, un auteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        }
      >
        {isDataLoading ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner />
          </div>
        ) : sortedDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedDocuments.map((doc) => {
              const ext = getFileType(doc.file_type);
              const created = formatDate(doc.created_at);
              return (
                <div
                  key={doc.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-12 shrink-0 flex items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">
                        {ext}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {doc.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          Par {getFormattedAuthor(doc.user)}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {doc.description || "Aucune description complémentaire."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {created.date}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/telechargements/${doc.id}`}>
                        <Button variant="secondary" size="sm" icon={EyeIcon}>
                          Détails
                        </Button>
                      </Link>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={ArrowDownTrayIcon}
                        onClick={() => handleDownload(doc)}
                      >
                        Télécharger
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {searchTerm
                ? "Aucun document ne correspond à votre recherche"
                : "Aucun support de cours disponible pour le moment"}
            </p>
          </div>
        )}
      </Card>

      <Card title="Dernières publications" subtitle="Les 5 supports ajoutés le plus récemment">
        <DataTable
          columns={[
            {
              header: "Document",
              accessor: "title",
              render: (doc) => {
                const ext = getFileType(doc.file_type);
                return (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-10 shrink-0 flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {ext}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {doc.title}
                      </p>
                      <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {formatDate(doc.created_at).date} · {formatDate(doc.created_at).time}
                      </p>
                    </div>
                  </div>
                );
              },
            },
            {
              header: "Description",
              accessor: "description",
              render: (doc) => (
                <div
                  className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate"
                  title={doc.description || ""}
                >
                  {truncateDescription(doc.description)}
                </div>
              ),
            },
            {
              header: "Auteur",
              accessor: "user",
              render: (doc) => (
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {getFormattedAuthor(doc.user)}
                </span>
              ),
            },
            {
              header: "Actions",
              accessor: "actions",
              render: (doc) => (
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/telechargements/${doc.id}`}>
                    <Button variant="secondary" size="sm">
                      Détails
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={ArrowDownTrayIcon}
                    onClick={() => handleDownload(doc)}
                  >
                    Télécharger
                  </Button>
                </div>
              ),
            },
          ]}
          data={documents.slice(0, 5)}
          searchable={false}
        />
      </Card>
    </div>
  );
}
