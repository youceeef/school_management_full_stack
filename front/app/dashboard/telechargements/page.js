"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import toast from "../../utils/toast";
import { getTelechargements, downloadDocument } from "../../services/documentService";
import { PageHeader, DataTable } from "../../components/ui";
import Button from "../../components/Button";

export default function TelechargementsPage() {
  // État pour stocker les documents
  const [documents, setDocuments] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // État pour la recherche
  const [searchTerm, setSearchTerm] = useState("");

  // Charger les documents au chargement de la page
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Fonction pour récupérer les documents
  const fetchDocuments = async () => {
    setIsDataLoading(true);
    try {
      const data = await getTelechargements();
      setDocuments(data);
    } catch (error) {
      console.error("Erreur lors du chargement des documents:", error);
      toast.error(error.message || "Impossible de charger les documents");
    } finally {
      setIsDataLoading(false);
    }
  };

  // Gérer le téléchargement d'un document
  const handleDownload = async (doc) => {
    try {
      toast.info("Téléchargement en cours...");

      const blob = await downloadDocument(doc.id);

      // Créer un URL objet et déclencher le téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.title);
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

  // Filtrer les documents
  const filteredDocuments = documents.filter(
    (doc) =>
      // Filtre par recherche
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) || (doc.user && getFormattedAuthor(doc.user).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Trier les documents par date (les plus récents d'abord)
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // Tronquer la description
  const truncateDescription = (description, maxLength = 100) => {
    if (!description) return "Aucune description";
    return description.length > maxLength ? description.substring(0, maxLength) + "..." : description;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Téléchargement de Documents</h1>
        </div>

        {/* Barre de recherche */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Rechercher un document..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Grille de documents */}
        {isDataLoading ? (
          <div className="flex justify-center items-center py-12 sm:py-20">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {sortedDocuments.length > 0 ? (
              sortedDocuments.map((doc) => (
                <div key={doc.id} className="bg-gray-50 rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center bg-gray-100 rounded">
                        {getFileType(doc.file_type) === "PDF" && <span className="text-red-500 text-sm sm:text-lg font-bold">PDF</span>}
                        {getFileType(doc.file_type) === "DOCX" && <span className="text-blue-500 text-sm sm:text-lg font-bold">DOC</span>}
                        {getFileType(doc.file_type) === "XLSX" && <span className="text-green-500 text-sm sm:text-lg font-bold">XLS</span>}
                        {getFileType(doc.file_type) === "PPTX" && <span className="text-orange-500 text-sm sm:text-lg font-bold">PPT</span>}
                        {["PDF", "DOCX", "XLSX", "PPTX"].indexOf(getFileType(doc.file_type)) === -1 && <span className="text-sm sm:text-base">{getFileType(doc.file_type)}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-md font-medium text-white-900 truncate">{doc.title}</h3>
                        <p className="text-xs text-gray-500">{getFileType(doc.file_type)}</p>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{doc.description || "Aucune description"}</p>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-gray-500 mb-3 gap-2 sm:gap-0">
                      <span className="truncate">Par {getFormattedAuthor(doc.user)}</span>
                      <span className="text-xs">
                        {formatDate(doc.created_at).date} • {formatDate(doc.created_at).time}
                      </span>
                    </div>

                    <div className="flex items-center justify-end pt-3 border-t border-gray-200 gap-2">
                      <Link 
                        href={`/dashboard/telechargements/${doc.id}`} 
                        className="px-2 sm:px-3 py-1.5 bg-gray-200 text-blue-700 text-xs sm:text-sm rounded hover:bg-gray-300 flex items-center gap-1"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        <span>Voir détails</span>
                      </Link>
                      <button 
                        onClick={() => handleDownload(doc)} 
                        className="px-2 sm:px-3 py-1.5 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Télécharger</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500 text-sm sm:text-base">
                {searchTerm ? "Aucun document ne correspond à votre recherche" : "Aucun document n'est disponible pour le téléchargement"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <PageHeader
          title="Documents récents"
          description="Les 5 derniers documents ajoutés."
          className="mb-4"
        />
        <DataTable
          columns={[
            {
              header: "Document",
              accessor: "title",
              render: (doc) => (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center bg-gray-100 dark:bg-dark-border rounded">
                    {getFileType(doc.file_type) === "PDF" && <span className="text-red-500 dark:text-red-400 text-xs">PDF</span>}
                    {getFileType(doc.file_type) === "DOCX" && <span className="text-blue-500 dark:text-blue-400 text-xs">DOC</span>}
                    {getFileType(doc.file_type) === "XLSX" && <span className="text-green-500 dark:text-green-400 text-xs">XLS</span>}
                    {getFileType(doc.file_type) === "PPTX" && <span className="text-orange-500 dark:text-orange-400 text-xs">PPT</span>}
                    {["PDF", "DOCX", "XLSX", "PPTX"].indexOf(getFileType(doc.file_type)) === -1 && <span className="text-xs dark:text-white">{getFileType(doc.file_type)}</span>}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{doc.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(doc.created_at).date} • {formatDate(doc.created_at).time}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              header: "Description",
              accessor: "description",
              render: (doc) => (
                <div className="truncate" title={doc.description || ""}>
                  {truncateDescription(doc.description)}
                </div>
              ),
            },
            {
              header: "Auteur",
              accessor: "user",
              render: (doc) => getFormattedAuthor(doc.user),
            },
            {
              header: "Action",
              accessor: "actions",
              render: (doc) => (
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <Link 
                    href={`/dashboard/telechargements/${doc.id}`} 
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                  >
                    <Button variant="primary" size="sm">Voir détails</Button>
                    
                  </Link>
                  <Button variant="success" size="sm" onClick={() => handleDownload(doc)}>
                    Télécharger
                  </Button>
                </div>
              ),
            },
          ]}
          data={documents.slice(0, 5)}
          searchable={false}
        />
      </div>
    </div>
  );
}
