"use client";

import React, { useState, useEffect } from "react";
import toast from "../../utils/toast";
import { Card, DataTable, StatsCard, PageHeader } from "../../components/ui";
import Button from "../../components/Button";
import FormInput from "../../components/FormInput";
import LoadingSpinner from "../../components/LoadingSpinner";
import FormSelect from "../../components/FormSelect";
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  CheckCircleIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { getSalles, createSalle, updateSalle, deleteSalle } from "../../services/salleService";
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
    { value: ROOM_TYPES.AMPHITHEATER, label: "Amphithéâtre" },
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

  const formatRoomType = (type) => {
    const map = {
      "salle de classe": "Salle de classe",
      laboratoire: "Laboratoire spécialisé",
      amphitheatre: "Amphithéâtre",
    };
    return map[(type || "").toLowerCase()] || type;
  };

  const columns = [
    {
      header: "Salle",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <BuildingOfficeIcon className="w-4 h-4" />
          </div>
          <span className="font-medium text-slate-900 dark:text-slate-100">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Catégorie",
      accessor: "type",
      render: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {formatRoomType(row.type)}
        </span>
      ),
    },
    {
      header: "Capacité d’accueil",
      accessor: "capacity",
      render: (row) => (
        <span className="font-mono text-sm font-medium tabular-nums text-slate-900 dark:text-slate-100">
          {row.capacity} <span className="font-sans font-normal text-slate-500 dark:text-slate-400">places</span>
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <PermissionGate permission={PERMISSIONS.MODIFIER_SALLE}>
            <Button
              variant="table-action"
              size="sm"
              icon={PencilSquareIcon}
              onClick={() => handleEdit(row)}
            >
              Modifier
            </Button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.SUPPRIMER_SALLE}>
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

  const totalCapacity = salles.reduce((total, salle) => total + (Number(salle.capacity) || 0), 0);
  const labAndAmphiCount = salles.filter((s) =>
    ["laboratoire", "amphitheatre"].includes((s.type || "").toLowerCase())
  ).length;

  const statsCards = [
    {
      title: "Total des salles",
      value: salles.length.toLocaleString("fr-FR"),
      icon: BuildingOfficeIcon,
    },
    {
      title: "Capacité cumulée",
      value: `${totalCapacity.toLocaleString("fr-FR")} places`,
      icon: UserGroupIcon,
    },
    {
      title: "Laboratoires & Amphis",
      value: labAndAmphiCount.toLocaleString("fr-FR"),
      icon: CheckCircleIcon,
    },
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
      [name]: name === "capacity" ? parseInt(value, 10) || "" : value,
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
      toast.error(
        error.message ||
          (editMode
            ? `Erreur lors de la mise à jour de la salle ${formData.name}`
            : `Erreur lors de l'ajout de la salle ${formData.name}`)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (salle) => {
    setFormData({
      id: salle.id,
      name: salle.name,
      capacity: salle.capacity,
      type: salle.type,
    });
    setEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    const salleToDelete = salles.find((s) => s.id === id);
    if (!salleToDelete) return;
    toast.confirmDelete(
      `Êtes-vous sûr de vouloir supprimer la salle "${salleToDelete.name}" ?`,
      async () => {
        try {
          await deleteSalle(id);
          await fetchSalles();
          toast.success(`La salle ${salleToDelete.name} a été supprimée`);
        } catch (error) {
          console.error("Error deleting salle:", error);
          toast.error(
            error.message || `Erreur lors de la suppression de la salle ${salleToDelete.name}`
          );
        }
      }
    );
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

  const filteredSalles = salles.filter(
    (salle) =>
      salle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salle.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des salles"
        description="Référentiel des salles de cours, laboratoires techniques et amphithéâtres."
        actions={[
          {
            children: "Ajouter une salle",
            icon: PlusIcon,
            variant: "primary",
            onClick: handleAdd,
            loading: isSubmitting,
            permission: PERMISSIONS.AJOUTER_SALLE,
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

      <Card title="Répertoire des salles" subtitle="Consultez et modifiez les espaces pédagogiques">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredSalles}
            searchable
            onSearch={setSearchTerm}
            searchPlaceholder="Rechercher par nom ou type de salle..."
          />
        )}
      </Card>

      {isModalOpen && (
        <PermissionGate
          permission={editMode ? PERMISSIONS.MODIFIER_SALLE : PERMISSIONS.AJOUTER_SALLE}
          fallback={null}
        >
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                  {editMode ? "Modifier la salle" : "Ajouter une nouvelle salle"}
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
                  label="Nom de la salle"
                  id="salle-name"
                  name="name"
                  placeholder="Ex: Laboratoire Réseaux B12"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  label="Capacité d’accueil (places)"
                  id="salle-capacity"
                  name="capacity"
                  type="number"
                  placeholder="Ex: 30"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                />
                <FormSelect
                  label="Catégorie d’espace"
                  id="room-type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  options={roomTypeOptions}
                  required
                  placeholder="Sélectionner un type de salle"
                />
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="secondary" type="button" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button variant="primary" type="submit" loading={isSubmitting}>
                    {editMode ? "Enregistrer" : "Créer la salle"}
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
