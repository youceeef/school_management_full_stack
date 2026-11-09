"use client";

import React, { useState, useEffect } from "react";
import toast from "../../utils/toast";
import { Card, DataTable, StatsCard, PageHeader } from "../../components/ui";
import Button from "../../components/Button";
import FormInput from "../../components/FormInput";
import FormTextArea from "../../components/FormTextArea";
import {
  ComputerDesktopIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  getEquipements,
  createEquipement,
  updateEquipement,
  deleteEquipement,
} from "../../services/equipementService";
import PermissionGate from "../../components/PermissionGate";
import { PERMISSIONS } from "../../constants/permissions";
import ProtectedRoute from "../../components/ProtectedRoute";
import LoadingSpinner from "../../components/LoadingSpinner";

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

  const totalUnits = (equipements.data || []).reduce(
    (total, equipement) => total + (Number(equipement.quantity_available) || 0),
    0
  );

  const statsCards = [
    {
      title: "Catégories d’équipements",
      value: `${(equipements.meta?.total ?? equipements.data?.length ?? 0).toLocaleString("fr-FR")}`,
      icon: ComputerDesktopIcon,
    },
    {
      title: "Unités en stock",
      value: `${totalUnits.toLocaleString("fr-FR")} unités`,
      icon: WrenchScrewdriverIcon,
    },
    {
      title: "Fiches documentées",
      value: (equipements.data || []).filter((eq) => eq.description).length.toLocaleString("fr-FR"),
      icon: CheckCircleIcon,
    },
  ];

  const columns = [
    {
      header: "Équipement",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <ComputerDesktopIcon className="w-4 h-4" />
          </div>
          <span className="font-medium text-slate-900 dark:text-slate-100">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Disponibilité",
      accessor: "quantity_available",
      render: (row) => (
        <span className="font-mono text-sm font-medium tabular-nums text-slate-900 dark:text-slate-100">
          {row.quantity_available}{" "}
          <span className="font-sans font-normal text-slate-500 dark:text-slate-400">
            unité{row.quantity_available > 1 ? "s" : ""}
          </span>
        </span>
      ),
    },
    {
      header: "Spécifications",
      accessor: "description",
      render: (row) => (
        <div className="max-w-md">
          <p className="text-sm text-slate-600 dark:text-slate-400 truncate" title={row.description}>
            {row.description || "—"}
          </p>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <PermissionGate permission={PERMISSIONS.MODIFIER_EQUIPEMENT}>
            <Button
              variant="table-action"
              size="sm"
              icon={PencilSquareIcon}
              onClick={() => handleEdit(row)}
            >
              Modifier
            </Button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.SUPPRIMER_EQUIPEMENT}>
            <Button
              variant="table-action"
              size="sm"
              onClick={() => handleDelete(row.id)}
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <TrashIcon className="w-4 h-4 mr-1.5 shrink-0" />
              Supprimer
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
      setEquipements(response || { data: [], meta: {} });
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
      [name]: name === "quantity_available" ? (value === "" ? "" : parseInt(value, 10)) : value,
    }));
  };

  const handleAdd = () => {
    setIsSubmitting(false);
    resetForm();
    setEditMode(false);
    setIsModalOpen(true);
  };

  const handleEdit = (equipement) => {
    setFormData(equipement);
    setEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    const equipementToDelete = (equipements.data || []).find((eq) => eq.id === id);
    if (!equipementToDelete) return;

    toast.confirmDelete(
      `Êtes-vous sûr de vouloir supprimer l'équipement "${equipementToDelete.name}" ?`,
      async () => {
        try {
          await deleteEquipement(id);
          fetchEquipements();
          toast.success(`L'équipement ${equipementToDelete.name} a été supprimé`);
        } catch (error) {
          console.error("Error deleting equipement:", error);
          toast.error(error.message || "Erreur lors de la suppression de l'équipement");
        }
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.quantity_available === "" || !formData.description) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const submitData = {
      name: formData.name,
      quantity_available: parseInt(formData.quantity_available, 10),
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
          errors.forEach((err) => toast.error(err));
        });
      } else {
        toast.error(
          error.message ||
            (editMode ? "Erreur lors de la mise à jour" : "Erreur lors de l'ajout")
        );
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

  const filteredEquipements = (equipements.data || []).filter((equipement) =>
    equipement.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventaire des équipements"
        description="Gérez le parc matériel et technique mis à disposition des enseignants."
        actions={[
          {
            children: "Ajouter un équipement",
            icon: PlusIcon,
            variant: "primary",
            onClick: handleAdd,
            loading: isSubmitting,
            permission: PERMISSIONS.AJOUTER_EQUIPEMENT,
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            loading={loading}
          />
        ))}
      </div>

      <Card
        title="Catalogue du matériel"
        subtitle="Disponibilités en temps réel pour les réservations"
      >
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredEquipements}
            searchable
            onSearch={setSearchTerm}
            searchPlaceholder="Rechercher un équipement..."
          />
        )}
      </Card>

      {isModalOpen && (
        <PermissionGate
          permission={editMode ? PERMISSIONS.MODIFIER_EQUIPEMENT : PERMISSIONS.AJOUTER_EQUIPEMENT}
        >
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                  {editMode ? "Modifier l’équipement" : "Ajouter un nouvel équipement"}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <FormInput
                  label="Désignation de l’équipement"
                  id="equipement-name"
                  name="name"
                  placeholder="Ex: Vidéoprojecteur Laser HD"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  label="Quantité en stock"
                  id="equipement-qty"
                  name="quantity_available"
                  type="number"
                  placeholder="Ex: 5"
                  value={formData.quantity_available}
                  onChange={handleChange}
                  required
                />
                <FormTextArea
                  label="Description et caractéristiques"
                  id="equipement-desc"
                  name="description"
                  placeholder="Précisez les connectiques ou accessoires inclus..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="secondary" type="button" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button variant="primary" type="submit" loading={isSubmitting}>
                    {editMode ? "Enregistrer" : "Ajouter au stock"}
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
