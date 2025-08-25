"use client";

import React, { useState, useEffect } from "react";
import toast from "../../utils/toast";
import { Card, DataTable, StatsCard, PageHeader } from "../../components/ui";
import Button from "../../components/Button";
import FormInput from "../../components/FormInput";
import LoadingSpinner from "../../components/LoadingSpinner";
import FormSelect from "../../components/FormSelect";
import { BuildingOfficeIcon, UserGroupIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { getSalles, createSalle, updateSalle, deleteSalle } from "../../services/salleService"; // Note: getSalle is no longer needed here
import ProtectedRoute from "../../components/ProtectedRoute";
import PermissionGate from "../../components/PermissionGate";
import { PERMISSIONS } from "../../constants/permissions";

export default function SallesPageWrapper() {
  return (
    <ProtectedRoute permission={PERMISSIONS.LIST_SALLES}>
      <SallesPage />
    </ProtectedRoute>
  );
}

function SallesPage() {
  const ROOM_TYPES = {
    CLASSROOM: "salle de classe",
    LABORATORY: "laboratoire",
    AMPHITHEATER: "amphitheatre",
  };

  const roomTypeOptions = [
    { value: ROOM_TYPES.CLASSROOM, label: "Salle de classe" },
    { value: ROOM_TYPES.LABORATORY, label: "Laboratoire" },
    { value: ROOM_TYPES.AMPHITHEATER, label: "Amphithéatre" },
  ];

  const [salles, setSalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    capacity: "",
    type: ROOM_TYPES.CLASSROOM,
  });
  const [editMode, setEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const columns = [
    {
      header: "Nom",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center mr-3">
            <BuildingOfficeIcon className="w-5 h-5" />
          </div>
          <span>{row.name}</span>
        </div>
      ),
    },
    {
      header: "Type",
      accessor: "type",
      render: (row) => <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">{row.type}</span>,
    },
    {
      header: "Capacité",
      accessor: "capacity",
      render: (row) => <span className="font-medium">{row.capacity} places</span>,
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex justify-center space-x-2">
          <PermissionGate permission={PERMISSIONS.MODIFIER_SALLE}>
            <Button variant="table-action" size="sm" onClick={() => handleEdit(row)}>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </span>
            </Button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.SUPPRIMER_SALLE}>
            <Button variant="table-action" size="sm" onClick={() => handleDelete(row.id)}>
              <span className="flex items-center text-red-600 dark:text-red-400">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Supprimer
              </span>
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  const statsCards = [
    { title: "Total des salles", value: salles.length.toString(), icon: BuildingOfficeIcon },
    { title: "Capacité totale", value: `${salles.reduce((total, salle) => total + salle.capacity, 0)} places`, icon: UserGroupIcon },
    { title: "Salles disponibles", value: salles.filter((salle) => salle.etat === "Disponible").length.toString(), icon: CheckCircleIcon },
  ];

  const fetchSalles = async () => {
    try {
      setLoading(true);
      const response = await getSalles();
      setSalles(response.data || []);
    } catch (error) {
      console.error("Error fetching salles:", error);
      toast.error(error.message || "Erreur lors du chargement des salles");
      setSalles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? parseInt(value) || "" : value,
    }));
  };

  const handleAdd = () => {
    setIsSubmitting(false);
    resetForm();
    setEditMode(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.capacity || !formData.type) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    if (formData.capacity <= 0) {
      toast.error("La capacité doit être supérieure à 0");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editMode) {
        await updateSalle(formData.id, formData);
        toast.success(`La salle ${formData.name} a été mise à jour`);
      } else {
        await createSalle(formData);
        toast.success(`Nouvelle salle ${formData.name} ajoutée`);
      }
      fetchSalles();
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error submitting salle:", error);
      toast.error(error.message || (editMode ? `Erreur lors de la mise à jour de la salle ${formData.name}` : `Erreur lors de l'ajout de la salle ${formData.name}`));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- THIS IS THE MODIFIED FUNCTION ---
  const handleEdit = (salle) => {
    // No need for an API call, we already have the salle data from the table row
    setFormData({
      id: salle.id,
      name: salle.name,
      capacity: salle.capacity,
      type: salle.type,
    });
    setEditMode(true);
    setIsModalOpen(true);
    toast.info(`Modification de la salle ${salle.name}`);
  };

  const handleDelete = (id) => {
    const salleToDelete = salles.find((s) => s.id === id);
    toast.confirmDelete(`Êtes-vous sûr de vouloir supprimer la salle "${salleToDelete.name}" ?`, async () => {
      try {
        await deleteSalle(id);
        await fetchSalles();
        toast.success(`La salle ${salleToDelete.name} a été supprimée`);
      } catch (error) {
        console.error("Error deleting salle:", error);
        toast.error(error.message || `Erreur lors de la suppression de la salle ${salleToDelete.name}`);
      }
    });
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: "",
      capacity: "",
      type: ROOM_TYPES.CLASSROOM,
    });
    setEditMode(false);
    setIsModalOpen(false);
  };

  const filteredSalles = salles.filter((salle) => salle.name.toLowerCase().includes(searchTerm.toLowerCase()) || salle.type.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestion des Salles"
        description="Gérez les salles de votre établissement"
        actions={[
          {
            children: (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Ajouter une salle
              </span>
            ),
            variant: "primary",
            onClick: handleAdd,
            loading: isSubmitting,
            permission: PERMISSIONS.AJOUTER_SALLE,
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <StatsCard key={index} title={stat.title} value={stat.value} icon={stat.icon} loading={loading} />
        ))}
      </div>

      <Card title="Liste des Salles">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <DataTable columns={columns} data={filteredSalles} searchable={true} onSearch={setSearchTerm} searchPlaceholder="Rechercher une salle..." />
        )}
      </Card>

      {isModalOpen && (
        <PermissionGate permission={editMode ? PERMISSIONS.MODIFIER_SALLE : PERMISSIONS.AJOUTER_SALLE} fallback={<div>Vous navez pas la permission nécessaire.</div>}>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4">{editMode ? "Modifier une salle" : "Ajouter une nouvelle salle"}</h3>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <FormInput label="Nom de la salle" name="name" value={formData.name} onChange={handleChange} required />
                    <FormInput label="Capacité" name="capacity" type="number" value={formData.capacity} onChange={handleChange} required />
                    <FormSelect label="Type de salle" id="room-type" name="type" value={formData.type} onChange={handleChange} options={roomTypeOptions} required={true} placeholder="Sélectionner un type de salle" />
                    <div className="flex justify-end space-x-3 mt-6">
                      <Button variant="secondary" type="button" onClick={resetForm}>
                        Annuler
                      </Button>
                      <Button variant="primary" type="submit" loading={isSubmitting}>
                        {editMode ? "Mettre à jour" : "Ajouter"}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        </PermissionGate>
      )}
    </div>
  );
}
