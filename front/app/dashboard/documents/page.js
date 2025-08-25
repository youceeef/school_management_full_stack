"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import toast from "../../utils/toast";
import { Card, DataTable, StatsCard, PageHeader } from "../../components/ui";
import Button from "../../components/Button";
import FormInput from "../../components/FormInput";
import FormTextArea from "../../components/FormTextArea";
import { DocumentIcon, ClockIcon } from "@heroicons/react/24/outline";
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
  // État pour stocker les documents
  const [documents, setDocuments] = useState([]);

  // État pour la recherche
  const [searchTerm, setSearchTerm] = useState("");

  // État pour afficher/masquer le modal d'ajout
  const [showModal, setShowModal] = useState(false);

  // État pour le formulaire d'ajout
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file: null,
  });

  // État pour le chargement
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Référence pour l'input de fichier
  const fileInputRef = useRef(null);

  // Charger les documents au chargement de la page
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Stats cards data
  const statsCards = [
    {
      title: "Total des documents",
      value: documents.length.toString(),
      icon: DocumentIcon,
    },
    {
      title: "Documents récents",
      value: documents
        .filter((doc) => {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          return new Date(doc.created_at) >= oneMonthAgo;
        })
        .length.toString(),
      icon: ClockIcon,
    },
  ];

  // Table columns configuration
  const columns = [
    {
      header: "Document",
      accessor: "title",
      render: (row) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 dark:bg-dark-border rounded">
            {getFileType(row.file_type) === "PDF" && (
              <span className="text-red-500 dark:text-red-400">PDF</span>
            )}
            {getFileType(row.file_type) === "DOCX" && (
              <span className="text-blue-500 dark:text-blue-400">DOC</span>
            )}
            {getFileType(row.file_type) === "XLSX" && (
              <span className="text-green-500 dark:text-green-400">XLS</span>
            )}
            {getFileType(row.file_type) === "PPTX" && (
              <span className="text-orange-500 dark:text-orange-400">PPT</span>
            )}
            {getFileType(row.file_type) === "JPG" && (
              <span className="text-purple-500 dark:text-purple-400">JPG</span>
            )}
            {getFileType(row.file_type) === "PNG" && (
              <span className="text-indigo-500 dark:text-indigo-400">PNG</span>
            )}
            {["PDF", "DOCX", "XLSX", "PPTX", "JPG", "PNG"].indexOf(
              getFileType(row.file_type)
            ) === -1 && (
              <span className="dark:text-white">
                {getFileType(row.file_type)}
              </span>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {row.title}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Auteur",
      accessor: "user",
      render: (row) => getFormattedAuthor(row.user),
    },
    {
      header: "Description",
      accessor: "description",
      render: (row) => (
        <div className="truncate" title={row.description || ""}>
          {truncateDescription(row.description)}
        </div>
      ),
    },
    {
      header: "Date d'ajout",
      accessor: "created_at",
      render: (row) => (
        <div className="flex justify-center gap-2">
          <span className="text-gray-900 dark:text-white">
            {formatDate(row.created_at).date}
          </span>
          <span className="text-gray-500 dark:text-gray-400">•</span>
          <span className="text-gray-500 dark:text-gray-400">
            {formatDate(row.created_at).time}
          </span>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex justify-center space-x-4">
          <PermissionGate permission={PERMISSIONS.VIEW_DOCUMENT}>
            <Link href={`/dashboard/documents/${row.id}`}>
              <Button variant="secondary" size="sm">
                Voir détail
              </Button>
            </Link>
          </PermissionGate>

          <PermissionGate permission={PERMISSIONS.DOWNLOAD_DOCUMENTS}>
            <Button
              variant="success"
              size="sm"
              onClick={() => handleDownload(row.id)}
            >
              Télécharger
            </Button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.DELETE_DOCUMENTS}>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(row.id)}
            >
              Supprimer
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  // Fonction pour récupérer les documents
  const fetchDocuments = async () => {
    setIsDataLoading(true);
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error("Erreur lors du chargement des documents:", error);
      toast.error(error.message || "Impossible de charger les documents");
    } finally {
      setIsDataLoading(false);
    }
  };

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Gérer l'upload de fichier
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        file: file,
      }));

      toast.success(`Fichier ${file.name} sélectionné`);
    }
  };

  // Ajouter un document
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

    // Créer un FormData pour envoyer le fichier
    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("file", formData.file);
    formDataToSend.append("description", formData.description || "");

    setIsLoading(true);
    setIsSubmitting(true);

    try {
      await createDocument(formDataToSend);

      // Réinitialiser le formulaire
      setFormData({
        title: "",
        description: "",
        file: null,
      });

      // Fermer le modal
      setShowModal(false);

      toast.success(`Document "${formData.title}" ajouté avec succès`);

      // Rafraîchir la liste des documents
      fetchDocuments();
    } catch (error) {
      console.error("Erreur lors de l'ajout du document:", error);
      toast.error(error.message || "Erreur lors de l'ajout du document");
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  // Supprimer un document
  const handleDelete = (id) => {
    const docToDelete = documents.find((d) => d.id === id);

    toast.confirmDelete(
      `Êtes-vous sûr de vouloir supprimer ce document ?`,
      async () => {
        try {
          await deleteDocument(id);
          setDocuments(documents.filter((doc) => doc.id !== id));
          toast.success("Document supprimé avec succès");
        } catch (error) {
          console.error("Erreur lors de la suppression:", error);
          toast.error(
            error.message || "Erreur lors de la suppression du document"
          );
        }
      },
      {
        loading: "Suppression du document en cours...",
        success: "Le document a été supprimé",
        error: "Erreur lors de la suppression du document",
      }
    );
  };

  // Télécharger un document
  const handleDownload = async (id) => {
    try {
      toast.info("Téléchargement en cours...");

      // Trouver le document pour avoir le titre
      const doc = documents.find((d) => d.id === id);
      const fileName = doc ? doc.title : "document";

      const blob = await downloadDocument(id);

      // Créer un URL objet et déclencher le téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();

      // Nettoyer
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success("Document téléchargé avec succès");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error(error.message || "Erreur lors du téléchargement du document");
    }
  };

  // Obtenir le nom d'utilisateur formaté
  const getFormattedAuthor = (user) => {
    if (!user) return "Utilisateur inconnu";
    return `${user.first_name} ${user.last_name}`;
  };

  // Extraire le type de fichier à partir du type MIME
  const getFileType = (mimeType) => {
    if (!mimeType) return "Inconnu";

    if (mimeType.includes("pdf")) return "PDF";
    if (mimeType.includes("word") || mimeType.includes("docx")) return "DOCX";
    if (mimeType.includes("excel") || mimeType.includes("xlsx")) return "XLSX";
    if (mimeType.includes("powerpoint") || mimeType.includes("pptx"))
      return "PPTX";
    if (mimeType.includes("image/jpeg") || mimeType.includes("image/jpg"))
      return "JPG";
    if (mimeType.includes("image/png")) return "PNG";

    return mimeType.split("/")[1].toUpperCase();
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "";
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

  // Filtrer les documents
  const filteredDocuments = documents.filter(
    (doc) =>
      // Filtre par recherche
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description &&
        doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.user &&
        getFormattedAuthor(doc.user)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()))
  );

  // Fonction pour tronquer la description
  const truncateDescription = (description, maxLength = 50) => {
    if (!description) return "-";
    return description.length > maxLength
      ? description.substring(0, maxLength) + "..."
      : description;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Gérez vos documents"
        actions={[
          {
            children: (
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Ajouter un document
              </span>
            ),
            variant: "primary",
            onClick: () => setShowModal(true),
            loading: isSubmitting,
            permission: PERMISSIONS.UPLOAD_DOCUMENTS,
          },
        ]}
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statsCards.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            loading={isDataLoading}
          />
        ))}
      </div>

      {/* Documents Table */}
      <Card title="Liste des documents">
        {isDataLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredDocuments}
            searchable={true}
            onSearch={setSearchTerm}
            searchPlaceholder="Rechercher un document..."
          />
        )}
      </Card>

      {/* Modal d'ajout de document */}
      {showModal && (
        <PermissionGate permission={PERMISSIONS.UPLOAD_DOCUMENTS}>
          <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-3xl mx-3 md:mx-auto">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-dark-border px-6 py-4">
                <h2 className="text-lg font-medium text-gray-800 dark:text-white">
                  Ajouter un nouveau document
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="px-6 py-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <FormInput
                      label="Titre du document"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Titre du document"
                      required
                    />

                    <FormTextArea
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Description détaillée du document..."
                      rows={3}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fichier*
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md dark:bg-dark-card dark:text-dark-text"
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                      />
                      {formData.file && (
                        <div className="mt-2 p-3 bg-gray-100 dark:bg-dark-border/20 rounded-md">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Fichier sélectionné: {formData.file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Type: {formData.file.type} • Taille:{" "}
                            {(formData.file.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                    <Button
                      type="button"
                      onClick={() => setShowModal(false)}
                      variant="secondary"
                    >
                      Annuler
                    </Button>
                    <Button type="submit" variant="primary" loading={isLoading}>
                      {isLoading ? "Téléchargement..." : "Ajouter le document"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </PermissionGate>
      )}
    </div>
  );
}
