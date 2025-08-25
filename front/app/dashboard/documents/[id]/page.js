"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "../../../utils/toast";
import axios from "../../../config/axios";
import Button from "../../../components/Button";
import FormInput from "../../../components/FormInput";
import FormTextArea from "../../../components/FormTextArea";
import { FaDownload, FaEdit, FaTrash, FaTimes, FaSpinner, FaPlus } from "react-icons/fa";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import Image from "next/image";
import { getDocument, updateDocument, deleteDocument, downloadDocument } from "../../../services/documentService";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function DocumentDetailPage({ params }) {
  const router = useRouter();
  // Use React.use() to unwrap the params promise
  const resolvedParams = use(params);
  const documentId = resolvedParams.id;

  // État pour stocker les informations du document
  const [documentData, setDocumentData] = useState(null);

  // État pour le chargement
  const [isLoading, setIsLoading] = useState(true);

  // État pour le mode édition
  const [isEditing, setIsEditing] = useState(false);

  // État pour les données du formulaire d'édition
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  // Charger les données du document
  useEffect(() => {
    const fetchDocument = async () => {
      setIsLoading(true);

      try {
        const data = await getDocument(documentId);
        setDocumentData(data);
        setFormData({
          title: data.title || "",
          description: data.description || "",
        });
      } catch (error) {
        console.error("Erreur lors du chargement du document:", error);
        toast.error(error.message || "Impossible de charger les informations du document");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  // Gérer le téléchargement
  const handleDownload = async () => {
    if (!documentData) return;

    try {
      toast.info("Téléchargement en cours...");

      const blob = await downloadDocument(documentId);

      // Créer un URL objet et déclencher le téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", documentData.title || "document");
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

  // Gérer la suppression
  const handleDelete = () => {
    if (!documentData) return;

    toast.confirmDelete(
      `Êtes-vous sûr de vouloir supprimer ce document ?`,
      async () => {
        try {
          await deleteDocument(documentId);
          toast.success("Document supprimé avec succès");
          // Rediriger vers la liste des documents
          router.push("/dashboard/documents");
        } catch (error) {
          console.error("Erreur lors de la suppression:", error);
          toast.error(error.message || "Erreur lors de la suppression du document");
        }
      },
      {
        loading: "Suppression du document en cours...",
        success: "Le document a été supprimé",
        error: "Erreur lors de la suppression du document",
      }
    );
  };

  // Gérer les changements dans le formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Gérer la soumission du formulaire d'édition
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      const response = await updateDocument(documentId, formData);

      // Mettre à jour les données du document avec la réponse
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

  // Annuler l'édition
  const handleCancelEdit = () => {
    setFormData({
      title: documentData.title || "",
      description: documentData.description || "",
    });
    setIsEditing(false);
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
    if (mimeType.includes("powerpoint") || mimeType.includes("pptx")) return "PPTX";
    if (mimeType.includes("image/jpeg") || mimeType.includes("image/jpg")) return "JPG";
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

  // Formater le contenu de la description pour l'affichage
  const formatDescription = (desc) => {
    if (!desc) return "Aucune description disponible.";

    // Si la description est courte, la retourner telle quelle
    if (desc.length < 200) return desc;

    // Sinon, la formater avec des sauts de ligne après certains caractères
    return desc.replace(/([.!?])\s+/g, "$1<br><br>").replace(/<br><br>$/, "");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold text-gray-800 mb-4">Document non trouvé</h1>
          <p className="text-gray-600 mb-6">Le document demandé n&apos;existe pas ou a été supprimé.</p>
          <Link href="/dashboard/documents" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Retour à la liste des documents
          </Link>
        </div>
      </div>
    );
  }

  const fileType = getFileType(documentData.file_type);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">{documentData.title}</h1>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Ajouté le {formatDate(documentData.created_at).date} à {formatDate(documentData.created_at).time}
            </div>
          </div>
          <div>
            <Button onClick={() => router.push("/dashboard/documents")} variant="primary">
              Retour au Documents
            </Button>
          </div>
        </div>

        {/* Aperçu du document */}
        <div className="border border-gray-200 rounded-lg mb-6 overflow-hidden">
          <div className="bg-gray-100 p-4 h-72 flex justify-center items-center">
            {fileType === "PDF" ? (
              <div className="text-center">
                <svg className="w-16 h-16 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600">Aperçu du document PDF non disponible</p>
                <p className="text-sm text-gray-500 mt-1">Cliquez sur Télécharger pour ouvrir le fichier</p>
              </div>
            ) : fileType === "JPG" || fileType === "PNG" ? (
              <div className="text-center">
                <Image
                  src={`${axios.defaults.baseURL}/storage/${documentData.file_path}`}
                  alt={documentData.title}
                  width={500}
                  height={300}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath fill='%23ccc' d='M30 50h40v5H30z'/%3E%3Cpath fill='%23ccc' d='M50 30v40h-5V30z'/%3E%3C/svg%3E";
                    toast.error("Impossible de charger l&apos;aperçu de l&apos;image");
                  }}
                />
              </div>
            ) : fileType === "DOCX" ? (
              <div className="text-center">
                <svg className="w-16 h-16 text-blue-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600">Aperçu du document Word non disponible</p>
                <p className="text-sm text-gray-500 mt-1">Cliquez sur Télécharger pour ouvrir le fichier</p>
              </div>
            ) : (
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600">Aperçu non disponible pour ce type de fichier</p>
                <p className="text-sm text-gray-500 mt-1">Cliquez sur Télécharger pour ouvrir le fichier</p>
              </div>
            )}
          </div>
        </div>

        {/* Détails du document */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
            {!isEditing ? (
              <>
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Informations du document</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                      <p className="text-sm text-blue-600 dark:text-blue-400">Auteur</p>
                      <div className="mt-1">
                        <p className="text-gray-900 dark:text-white font-medium">{documentData.user ? getFormattedAuthor(documentData.user) : "Utilisateur inconnu"}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                      <p className="text-sm text-purple-600 dark:text-purple-400">Date d&apos;ajout</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-gray-900 dark:text-white font-medium">{formatDate(documentData.created_at).date}</span>
                        <span className="text-purple-600 dark:text-purple-400">•</span>
                        <span className="text-purple-600 dark:text-purple-400 font-medium">{formatDate(documentData.created_at).time}</span>
                      </div>
                    </div>

                    {documentData.updated_at && documentData.updated_at !== documentData.created_at && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                        <p className="text-sm text-green-600 dark:text-green-400">Dernière modification</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-gray-900 dark:text-white font-medium">{formatDate(documentData.updated_at).date}</span>
                          <span className="text-green-600 dark:text-green-400">•</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">{formatDate(documentData.updated_at).time}</span>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                      <p className="text-sm text-amber-600 dark:text-amber-400">Format</p>
                      <div className="mt-1">
                        <p className="text-gray-900 dark:text-white font-medium">{fileType}</p>
                      </div>
                    </div>
                  </div>

                  {documentData.description && (
                    <div className="mt-6">
                      <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-2">Description</p>
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{documentData.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="w-full">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Modifier le document</h2>
                </div>
                <FormInput label="Titre du document" id="title" name="title" value={formData.title} onChange={handleInputChange} required />
                <FormTextArea label="Description" id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} required />
                <div className="flex justify-end space-x-3 mt-4">
                  <Button type="button" onClick={handleCancelEdit} variant="secondary">
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary">
                    Enregistrer
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Actions Section */}
          <div className="lg:col-span-1 bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 h-fit">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Actions</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Actions disponibles</p>
            </div>
            <div className="flex flex-col space-y-3">
              <Button
                onClick={handleDownload}
                variant="primary"
                className="w-full justify-center"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                }
              >
                Télécharger
              </Button>

              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="secondary"
                  className="w-full justify-center"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  }
                >
                  Modifier
                </Button>
              )}

              <Button
                onClick={handleDelete}
                variant="danger"
                className="w-full justify-center"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                }
              >
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
