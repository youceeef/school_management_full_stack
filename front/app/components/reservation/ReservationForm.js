"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "../../utils/toast";
import { getSallesCalendar } from "../../services/salleService";
import { getReservationsEquipements } from "../../services/equipementService";
import { createReservation } from "../../services/reservationService";
import LoadingSpinner from "../LoadingSpinner";
import fr from "date-fns/locale/fr";

const ReservationForm = ({ onSuccess, onFormChange }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [salles, setSalles] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [formData, setFormData] = useState({
    salle_id: "",
    start_time: "",
    end_time: "",
    purpose: "",
    equipements: [],
  });

  const [timeError, setTimeError] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
  const [filteredSalles, setFilteredSalles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const isStepComplete = {
    1: !!formData.salle_id,
    2: !!formData.start_time && !!formData.end_time && !timeError,
    3: !!formData.purpose,
    4: true,
  };

  const steps = [
    { title: "Salle", icon: BuildingOfficeIcon },
    { title: "Date & Heure", icon: ClockIcon },
    { title: "Objectif", icon: CalendarDaysIcon },
    { title: "Équipements", icon: WrenchScrewdriverIcon },
  ];

  useEffect(() => {
    if (
      formData.salle_id ||
      formData.start_time ||
      formData.end_time ||
      formData.purpose ||
      selectedEquipment.length > 0
    ) {
      onFormChange?.();
    }
  }, [formData, selectedEquipment, onFormChange]);

  useEffect(() => {
    if (salles.length > 0) {
      const filtered = salles.filter(
        (salle) =>
          salle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          salle.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSalles(filtered);
    }
  }, [searchQuery, salles]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sallesResponse, equipementsResponse] = await Promise.all([
          getSallesCalendar(),
          getReservationsEquipements(),
        ]);

        const availableSalles = (sallesResponse.data || []).filter(
          (salle) => salle.type === "laboratoire" || salle.type === "amphitheatre"
        );
        setSalles(availableSalles);
        setFilteredSalles(availableSalles);

        const equipementsArray = Array.isArray(equipementsResponse.data)
          ? equipementsResponse.data
          : equipementsResponse.data?.data || [];

        setEquipements(equipementsArray);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(error.message || "Erreur lors du chargement des données");
        setEquipements([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const validateTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return true;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      setTimeError("L'heure de fin doit être postérieure à l'heure de début.");
      return false;
    }

    const duration = (end - start) / (1000 * 60 * 60);
    if (duration > 4) {
      setTimeError("La durée maximale d'une séance est fixée à 4 heures.");
      return false;
    }

    setTimeError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.salle_id || !formData.start_time || !formData.end_time || !formData.purpose) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!validateTimeRange(formData.start_time, formData.end_time)) {
      return;
    }

    try {
      setSubmitting(true);

      const equipmentData = selectedEquipment
        .filter((eq) => eq.quantity > 0)
        .map((eq) => ({
          id: eq.equipmentId,
          quantity: parseInt(eq.quantity, 10),
        }));

      const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      const reservationData = {
        salle_id: parseInt(formData.salle_id, 10),
        start_time: formatDateTime(formData.start_time),
        end_time: formatDateTime(formData.end_time),
        purpose: formData.purpose,
        equipements: equipmentData,
      };

      const response = await createReservation(reservationData);

      if (response.success) {
        toast.success(response.message);
        onSuccess?.();
      } else {
        if (response.errors) {
          Object.values(response.errors).forEach((errorMessages) => {
            if (Array.isArray(errorMessages)) {
              errorMessages.forEach((message) => toast.error(message));
            }
          });
        } else {
          toast.error(response.message);
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEquipmentSelect = (equipment) => {
    if (!selectedEquipment.find((item) => item.equipmentId === equipment.id)) {
      const availableQuantity = equipment.quantity_available || equipment.quantity || 0;
      setSelectedEquipment([
        ...selectedEquipment,
        {
          equipmentId: equipment.id,
          name: equipment.name,
          quantity: "1",
          maxQuantity: availableQuantity,
        },
      ]);
    }
    setShowEquipmentDropdown(false);
  };

  const handleEquipmentQuantityChange = (equipmentId, quantity) => {
    const equipment = equipements.find((e) => e.id === equipmentId);
    const parsedQuantity = parseInt(quantity, 10) || "";
    const availableQuantity = equipment?.quantity_available || equipment?.quantity || 0;

    if (parsedQuantity > availableQuantity) {
      toast.error(`Quantité maximum disponible : ${availableQuantity}`);
      return;
    }

    setSelectedEquipment((prev) =>
      prev.map((item) => (item.equipmentId === equipmentId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveEquipment = (equipmentId) => {
    setSelectedEquipment((prev) => prev.filter((item) => item.equipmentId !== equipmentId));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                  1. Choisissez un espace disponible
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Laboratoires et amphithéâtres ouverts à la réservation.
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrer les salles..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {filteredSalles.map((salle) => {
                const selected = formData.salle_id === salle.id.toString();
                return (
                  <button
                    key={salle.id}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, salle_id: salle.id.toString() }));
                      setCurrentStep(2);
                    }}
                    className={`p-4 rounded-xl border text-left transition-colors flex items-start justify-between gap-3 ${
                      selected
                        ? "border-primary-600 bg-primary-50/50 dark:bg-primary-950/40"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {salle.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">
                        {salle.type} ·{" "}
                        <span className="font-mono tabular-nums">{salle.capacity}</span> places
                      </p>
                    </div>
                    {selected && (
                      <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center shrink-0">
                        <CheckIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                2. Définissez le créneau horaire
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                La durée d&apos;une réservation est comprise entre 30 minutes et 4 heures.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Date et heure de début <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DatePicker
                    selected={formData.start_time ? new Date(formData.start_time) : null}
                    onChange={(date) => {
                      setFormData((prev) => ({ ...prev, start_time: date?.toISOString() }));
                      validateTimeRange(date, formData.end_time ? new Date(formData.end_time) : null);
                    }}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={30}
                    timeCaption="Heure"
                    dateFormat="dd/MM/yyyy HH:mm"
                    minDate={new Date()}
                    locale={fr}
                    placeholderText="Sélectionner le début"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    calendarClassName="reservation-calendar"
                    portalId="root"
                    popperClassName="reservation-popper"
                    popperPlacement="bottom-start"
                    fixedHeight
                    showPopperArrow={false}
                    monthsShown={1}
                  />
                  <ClockIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Date et heure de fin <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DatePicker
                    selected={formData.end_time ? new Date(formData.end_time) : null}
                    onChange={(date) => {
                      setFormData((prev) => ({ ...prev, end_time: date?.toISOString() }));
                      validateTimeRange(
                        formData.start_time ? new Date(formData.start_time) : null,
                        date
                      );
                    }}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={30}
                    timeCaption="Heure"
                    dateFormat="dd/MM/yyyy HH:mm"
                    minDate={formData.start_time ? new Date(formData.start_time) : new Date()}
                    locale={fr}
                    placeholderText="Sélectionner la fin"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    calendarClassName="reservation-calendar"
                    portalId="root"
                    popperClassName="reservation-popper"
                    popperPlacement="bottom-start"
                    fixedHeight
                    showPopperArrow={false}
                    monthsShown={1}
                  />
                  <ClockIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {timeError && (
              <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
                <XMarkIcon className="w-4 h-4 shrink-0" />
                <span>{timeError}</span>
              </div>
            )}

            {formData.start_time && formData.end_time && !timeError && (
              <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckIcon className="w-4 h-4 shrink-0" />
                <span>Créneau horaire valide.</span>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                3. Précisez l&apos;objectif pédagogique
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Indiquez l&apos;intitulé du cours, du TP ou de la soutenance.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Motif de la demande <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 resize-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                rows={5}
                value={formData.purpose}
                onChange={(e) => setFormData((prev) => ({ ...prev, purpose: e.target.value }))}
                placeholder="Ex: Travaux pratiques de réseaux informatiques — Groupe 2..."
                maxLength={500}
              />
              <div className="flex justify-end">
                <span
                  className={`text-xs font-mono tabular-nums ${
                    formData.purpose.length >= 450
                      ? "text-red-500 dark:text-red-400"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {formData.purpose.length}/500
                </span>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                  4. Équipements complémentaires (optionnel)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sélectionnez le matériel nécessaire à votre séance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEquipmentDropdown(!showEquipmentDropdown)}
                className="px-3.5 py-2 text-xs font-medium text-primary-600 dark:text-primary-400 border border-primary-300 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors inline-flex items-center gap-1.5 shrink-0"
              >
                <span>Choisir un équipement</span>
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform ${
                    showEquipmentDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {showEquipmentDropdown && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto">
                  {Array.isArray(equipements) && equipements.length > 0 ? (
                    equipements
                      .filter((eq) => !selectedEquipment.some((sel) => sel.equipmentId === eq.id))
                      .map((equipment) => (
                        <button
                          key={equipment.id}
                          type="button"
                          onClick={() => handleEquipmentSelect(equipment)}
                          className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-600 transition-colors text-left"
                        >
                          <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {equipment.name}
                          </div>
                          <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
                            Stock : {equipment.quantity_available || equipment.quantity || 0}
                          </div>
                        </button>
                      ))
                  ) : (
                    <div className="col-span-3 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                      Aucun équipement disponible
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {selectedEquipment.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400">
                  Aucun équipement supplémentaire sélectionné. Vous pouvez confirmer directement la
                  réservation.
                </div>
              ) : (
                selectedEquipment.map((item) => (
                  <div
                    key={item.equipmentId}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {item.name}
                      </span>
                      <span className="block text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        Max disponible : {item.maxQuantity}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleEquipmentQuantityChange(
                              item.equipmentId,
                              Math.max(1, parseInt(item.quantity, 10) - 1)
                            )
                          }
                          className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.maxQuantity}
                          value={item.quantity}
                          onChange={(e) =>
                            handleEquipmentQuantityChange(item.equipmentId, e.target.value)
                          }
                          className="w-14 px-2 py-1 text-center font-mono text-sm tabular-nums border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleEquipmentQuantityChange(
                              item.equipmentId,
                              Math.min(item.maxQuantity, parseInt(item.quantity, 10) + 1)
                            )
                          }
                          className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEquipment(item.equipmentId)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-14">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-2 pb-5 border-b border-slate-200 dark:border-slate-800">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const Icon = step.icon;
          const isActive = currentStep === stepNumber;
          const isCompleted = currentStep > stepNumber;
          const isClickable = stepNumber < currentStep || isStepComplete[stepNumber - 1];

          return (
            <button
              key={stepNumber}
              type="button"
              disabled={!isClickable}
              onClick={() => {
                if (isClickable) setCurrentStep(stepNumber);
              }}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-colors ${
                isActive
                  ? "border-primary-600 bg-primary-50/60 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300"
                  : isCompleted
                  ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 cursor-pointer"
                  : "border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs font-mono font-bold ${
                  isActive
                    ? "bg-primary-600 text-white"
                    : isCompleted
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}
              >
                {isCompleted ? <CheckIcon className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="min-w-0 hidden sm:block">
                <p className="text-[11px] font-mono uppercase tracking-wider opacity-75">
                  Étape 0{stepNumber}
                </p>
                <p className="text-xs font-semibold truncate">{step.title}</p>
              </div>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>{renderStepContent()}</div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Précédent
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 && (
            <button
              type="button"
              onClick={() => {
                if (isStepComplete[currentStep]) {
                  setCurrentStep(currentStep + 1);
                } else {
                  toast.error("Veuillez compléter cette étape avant de continuer");
                }
              }}
              className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
                isStepComplete[currentStep]
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
              }`}
            >
              Suivant
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          )}

          {currentStep === 4 && (
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <span>Enregistrement en cours...</span>
              ) : (
                <>
                  <span>Confirmer la réservation</span>
                  <CheckIcon className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReservationForm;
