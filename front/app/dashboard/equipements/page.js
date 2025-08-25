"use client";

import React, { useState, useEffect } from "react";
import toast from "../../utils/toast";
import { Card, DataTable, StatsCard, PageHeader } from "../../components/ui";
import Button from "../../components/Button";
import FormInput from "../../components/FormInput";
import FormTextArea from "../../components/FormTextArea";
import { ComputerDesktopIcon, WrenchScrewdriverIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { getEquipements, createEquipement, updateEquipement, deleteEquipement } from "../../services/equipementService";
import PermissionGate from "../../components/PermissionGate";
import { PERMISSIONS } from "../../constants/permissions";
import ProtectedRoute from "../../components/ProtectedRoute";
import LoadingSpinner from "../../components/LoadingSpinner"; // Assuming LoadingSpinner is in the components folder

export default function EquipementsPageWrapper() {
  return (
    <ProtectedRoute permission={PERMISSIONS.LIST_EQUIPEMENTS}>
      <EquipementsPage />
    </ProtectedRoute>
  );
}

function EquipementsPage() {
  const [equipements, setEquipements] = useState({ data: [], meta: {} });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    quantity_available: "",
    description: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const statsCards = [
    {
      title: "Total des équipements",
      value: `${equipements.meta?.total || 0} types`,
      icon: ComputerDesktopIcon,
    },
    {
      title: "Quantité totale",
      value: `${equipements.data.reduce((total, equipement) => total + (equipement.quantity_available || 0), 0)} unités`,
      icon: WrenchScrewdriverIcon,
    },
    {
      title: "Équipements décrits",
      value: equipements.data.filter((eq) => eq.description).length.toString(),
      icon: CheckCircleIcon,
    },
  ];

  const columns = [
    {
      header: "Nom",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center mr-3">
            <ComputerDesktopIcon className="w-5 h-5" />
          </div>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Quantité",
      accessor: "quantity_available",
      render: (row) => (
        <div className="flex justify-center">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300 border border-green-100 dark:border-green-800">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            {row.quantity_available} unités
          </span>
        </div>
      ),
    },
    {
      header: "Description",
      accessor: "description",
      render: (row) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate" title={row.description}>
            {row.description}
          </p>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex justify-center space-x-2">
          <PermissionGate permission={PERMISSIONS.MODIFIER_EQUIPEMENT}>
            <Button variant="table-action" size="sm" onClick={() => handleEdit(row)}>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </span>
            </Button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.SUPPRIMER_EQUIPEMENT}>
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

  const fetchEquipements = async () => {
    try {
      setLoading(true);
      const response = await getEquipements();
      setEquipements(response); // The controller now returns the paginated object directly
    } catch (error) {
      console.error("Error fetching equipements:", error);
      toast.error(error.message || "Erreur lors du chargement des équipements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipements();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity_available" ? (value === "" ? "" : parseInt(value)) : value,
    }));
  };

  const handleAdd = () => {
    setIsSubmitting(false);
    resetForm();
    setEditMode(false);
    setIsModalOpen(true);
  };

  // --- THIS IS THE REFINED FUNCTION ---
  const handleEdit = (equipement) => {
    // No API call needed. We use the data from the table row directly.
    setFormData(equipement);
    setEditMode(true);
    setIsModalOpen(true);
    toast.info(`Modification de l'équipement ${equipement.name}`);
  };

  const handleDelete = (id) => {
    const equipementToDelete = equipements.data.find((eq) => eq.id === id);
    if (!equipementToDelete) return;

    toast.confirmDelete(`Êtes-vous sûr de vouloir supprimer l'équipement "${equipementToDelete.name}" ?`, async () => {
      try {
        await deleteEquipement(id);
        fetchEquipements();
        toast.success(`L'équipement ${equipementToDelete.name} a été supprimé`);
      } catch (error) {
        console.error("Error deleting equipement:", error);
        toast.error(error.message || `Erreur lors de la suppression de l'équipement`);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.quantity_available === "" || !formData.description) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const submitData = {
      name: formData.name,
      quantity_available: parseInt(formData.quantity_available),
      description: formData.description,
    };

    setIsSubmitting(true);
    try {
      if (editMode) {
        await updateEquipement(formData.id, submitData);
        toast.success(`L'équipement ${formData.name} a été mis à jour`);
      } else {
        await createEquipement(submitData);
        toast.success(`Nouvel équipement ${formData.name} ajouté`);
      }
      fetchEquipements();
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error submitting equipement:", error);
      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach((errors) => {
          errors.forEach((error) => toast.error(error));
        });
      } else {
        toast.error(error.message || (editMode ? `Erreur lors de la mise à jour` : `Erreur lors de l'ajout`));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ id: null, name: "", quantity_available: "", description: "" });
    setEditMode(false);
    setIsModalOpen(false);
  };

  const filteredEquipements = equipements.data?.filter((equipement) => equipement.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestion des Équipements"
        description="Gérez les équipements de votre établissement"
        actions={[
          {
            children: (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Ajouter un équipement
              </span>
            ),
            variant: "primary",
            onClick: handleAdd,
            loading: isSubmitting,
            permission: PERMISSIONS.AJOUTER_EQUIPEMENT,
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <StatsCard key={index} title={stat.title} value={stat.value} icon={stat.icon} loading={loading} />
        ))}
      </div>

      <Card title="Liste des Équipements">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <DataTable columns={columns} data={filteredEquipements || []} searchable={true} onSearch={setSearchTerm} searchPlaceholder="Rechercher un équipement..." />
        )}
      </Card>

      {isModalOpen && (
        <PermissionGate permission={editMode ? PERMISSIONS.MODIFIER_EQUIPEMENT : PERMISSIONS.AJOUTER_EQUIPEMENT}>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4">{editMode ? "Modifier un équipement" : "Ajouter un nouvel équipement"}</h3>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <FormInput label="Nom de l'équipement" name="name" value={formData.name} onChange={handleChange} required />
                    <FormInput label="Quantité disponible" name="quantity_available" type="number" value={formData.quantity_available} onChange={handleChange} required />
                    <FormTextArea label="Description" name="description" value={formData.description} onChange={handleChange} required />
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
