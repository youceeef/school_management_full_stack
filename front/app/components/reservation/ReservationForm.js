"use client";

import { useState, useRef, useEffect } from "react";
import { FaCalendar, FaClock, FaChalkboardTeacher, FaTools, FaChevronDown, FaSpinner, FaArrowLeft, FaArrowRight, FaCheck, FaSearch, FaTimes } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { getSallesCalendar } from "../../services/salleService";
import { getReservationsEquipements } from "../../services/equipementService";
import { createReservation } from "../../services/reservationService";
import fr from "date-fns/locale/fr"; // French locale

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

  // Calculate step completion
  const isStepComplete = {
    1: !!formData.salle_id,
    2: !!formData.start_time && !!formData.end_time && !timeError,
    3: !!formData.purpose,
    4: true, // Equipment is optional
  };

  // Step titles and icons
  const steps = [
    { title: "Salle", icon: FaChalkboardTeacher },
    { title: "Date/Heure", icon: FaClock },
    { title: "Objectif", icon: FaCalendar },
    { title: "Équipements", icon: FaTools },
  ];

  // Notify parent component of form changes
  useEffect(() => {
    if (formData.salle_id || formData.start_time || formData.end_time || formData.purpose || selectedEquipment.length > 0) {
      onFormChange?.();
    }
  }, [formData, selectedEquipment, onFormChange]);

  // Filter salles based on search query
  useEffect(() => {
    if (salles.length > 0) {
      const filtered = salles.filter((salle) => salle.name.toLowerCase().includes(searchQuery.toLowerCase()) || salle.type.toLowerCase().includes(searchQuery.toLowerCase()));
      setFilteredSalles(filtered);
    }
  }, [searchQuery, salles]);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sallesResponse, equipementsResponse] = await Promise.all([getSallesCalendar(), getReservationsEquipements()]);

        // Filter salles by type
        const filteredSalles = sallesResponse.data.filter((salle) => salle.type === "laboratoire" || salle.type === "amphitheatre");
        setSalles(filteredSalles);
        setFilteredSalles(filteredSalles);

        // Ensure equipements is always an array
        const equipementsArray = Array.isArray(equipementsResponse.data) ? equipementsResponse.data : equipementsResponse.data?.data || [];

        // Set equipements data
        setEquipements(equipementsArray);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(error.message || "Erreur lors du chargement des données");
        // Initialize with empty array on error
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
      setTimeError("L'heure de fin doit être après l'heure de début");
      return false;
    }

    const duration = (end - start) / (1000 * 60 * 60); // duration in hours
    if (duration > 4) {
      setTimeError("La durée ne peut pas dépasser 4 heures");
      return false;
    }

    setTimeError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.salle_id || !formData.start_time || !formData.end_time || !formData.purpose) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Validate time range
    if (!validateTimeRange(formData.start_time, formData.end_time)) {
      return;
    }

    try {
      setSubmitting(true);

      // Format equipment data
      const equipmentData = selectedEquipment
        .filter((eq) => eq.quantity > 0)
        .map((eq) => ({
          id: eq.equipmentId,
          quantity: parseInt(eq.quantity),
        }));

      // Format dates to match backend expectations (YYYY-MM-DD HH:mm:ss)
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
        salle_id: parseInt(formData.salle_id),
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
          // Handle validation errors
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
    const parsedQuantity = parseInt(quantity) || "";
    const availableQuantity = equipment.quantity_available || equipment.quantity || 0;

    if (parsedQuantity > availableQuantity) {
      toast.error(`Quantité maximum disponible: ${availableQuantity}`);
      return;
    }

    setSelectedEquipment((prev) => prev.map((item) => (item.equipmentId === equipmentId ? { ...item, quantity: quantity } : item)));
  };

  const handleRemoveEquipment = (equipmentId) => {
    setSelectedEquipment((prev) => prev.filter((item) => item.equipmentId !== equipmentId));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                <FaChalkboardTeacher className="w-6 h-6 mr-2 text-primary-500" />
                Sélection de la salle
              </h3>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une salle..."
                  className="pl-10 pr-4 py-2 border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64 dark:bg-dark-card dark:text-dark-text dark:placeholder-dark-muted"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSalles.map((salle) => (
                <button
                  key={salle.id}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, salle_id: salle.id.toString() }));
                    setCurrentStep(2);
                  }}
                  className={`group p-4 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-md ${
                    formData.salle_id === salle.id.toString() ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10" : "border-gray-100 dark:border-dark-border hover:border-primary-200 dark:hover:border-primary-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">{salle.name}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${salle.type === "laboratoire" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"}`}>{salle.type}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{salle.capacity} places</span>
                      </div>
                    </div>
                    {formData.salle_id === salle.id.toString() && (
                      <div className="bg-primary-500 text-white p-2 rounded-full">
                        <FaCheck className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
              <FaClock className="w-6 h-6 mr-2 text-primary-500" />
              Date et heure
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    placeholderText="Sélectionner date et heure"
                    className="w-full px-4 py-2 border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-card dark:text-dark-text"
                    calendarClassName="reservation-calendar"
                    showTimeSelectOnly={false}
                    portalId="root"
                    popperClassName="reservation-popper"
                    popperPlacement="bottom-start"
                    fixedHeight
                    showPopperArrow={false}
                    monthsShown={1}
                  />
                  <FaClock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date et heure de fin <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DatePicker
                    selected={formData.end_time ? new Date(formData.end_time) : null}
                    onChange={(date) => {
                      setFormData((prev) => ({ ...prev, end_time: date?.toISOString() }));
                      validateTimeRange(formData.start_time ? new Date(formData.start_time) : null, date);
                    }}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={30}
                    timeCaption="Heure"
                    dateFormat="dd/MM/yyyy HH:mm"
                    minDate={formData.start_time ? new Date(formData.start_time) : new Date()}
                    locale={fr}
                    placeholderText="Sélectionner date et heure"
                    className="w-full px-4 py-2 border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-card dark:text-dark-text"
                    calendarClassName="reservation-calendar"
                    showTimeSelectOnly={false}
                    portalId="root"
                    popperClassName="reservation-popper"
                    popperPlacement="bottom-start"
                    fixedHeight
                    showPopperArrow={false}
                    monthsShown={1}
                  />
                  <FaClock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>
            {timeError && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <FaTimes className="w-5 h-5 text-red-400" />
                </div>
                <p className="ml-3 text-sm text-red-600 dark:text-red-400">{timeError}</p>
              </div>
            )}
            {formData.start_time && formData.end_time && !timeError && (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <FaCheck className="w-5 h-5 text-green-400" />
                </div>
                <p className="ml-3 text-sm text-green-600 dark:text-green-400">Durée valide</p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
              <FaCalendar className="w-6 h-6 mr-2 text-primary-500" />
              Objectif de la réservation
            </h3>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-4 py-3 border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none dark:bg-dark-card dark:text-dark-text dark:placeholder-dark-muted"
                rows={6}
                value={formData.purpose}
                onChange={(e) => setFormData((prev) => ({ ...prev, purpose: e.target.value }))}
                placeholder="Décrivez l'objectif de votre réservation..."
                maxLength={500}
              />
              <div className="flex justify-end">
                <span className={`text-sm ${formData.purpose.length >= 450 ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}>{formData.purpose.length}/500 caractères</span>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                <FaTools className="w-6 h-6 mr-2 text-primary-500" />
                Équipements (optionnel)
              </h3>
              <button
                type="button"
                onClick={() => setShowEquipmentDropdown(!showEquipmentDropdown)}
                className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors duration-200 flex items-center"
              >
                Ajouter un équipement
                <FaChevronDown className={`ml-2 transform transition-transform duration-200 ${showEquipmentDropdown ? "rotate-180" : ""}`} />
              </button>
            </div>

            {showEquipmentDropdown && (
              <div className="p-4 bg-gray-50 dark:bg-dark-card/50 rounded-lg border border-gray-200 dark:border-dark-border">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.isArray(equipements) ? (
                    equipements
                      .filter((eq) => !selectedEquipment.some((sel) => sel.equipmentId === eq.id))
                      .map((equipment) => (
                        <button
                          key={equipment.id}
                          type="button"
                          onClick={() => handleEquipmentSelect(equipment)}
                          className="p-3 bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all duration-200 text-left"
                        >
                          <div className="font-medium text-gray-800 dark:text-white">{equipment.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Disponible: {equipment.quantity_available || equipment.quantity || 0}</div>
                        </button>
                      ))
                  ) : (
                    <div className="col-span-3 p-4 text-center text-gray-500 dark:text-gray-400">Aucun équipement disponible</div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {selectedEquipment.map((item) => (
                <div key={item.equipmentId} className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border hover:border-primary-200 dark:hover:border-primary-700 transition-all duration-200">
                  <span className="font-medium text-gray-800 dark:text-white">{item.name}</span>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEquipmentQuantityChange(item.equipmentId, Math.max(1, parseInt(item.quantity) - 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-200"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.maxQuantity}
                        value={item.quantity}
                        onChange={(e) => handleEquipmentQuantityChange(item.equipmentId, e.target.value)}
                        className="w-16 px-2 py-1 text-center border dark:border-dark-border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-card dark:text-dark-text"
                      />
                      <button
                        type="button"
                        onClick={() => handleEquipmentQuantityChange(item.equipmentId, Math.min(item.maxQuantity, parseInt(item.quantity) + 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-200"
                      >
                        +
                      </button>
                    </div>
                    <button type="button" onClick={() => handleRemoveEquipment(item.equipmentId)} className="w-8 h-8 flex items-center justify-center rounded-full text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors duration-200">
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-gray-100 dark:border-dark-border">
        {/* Progress Steps */}
        <div className="px-6 py-6 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center justify-between relative">
            {/* Progress Line - Now positioned between steps */}
            <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2">
              <div className="mx-[3.5rem] h-full">
                <div className="relative h-full bg-gray-200 dark:bg-dark-border rounded-full">
                  <div className="absolute left-0 top-0 h-full bg-primary-500 rounded-full transition-all duration-300" style={{ width: `${((currentStep - 1) / 3) * 100}%` }} />
                </div>
              </div>
            </div>

            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const Icon = step.icon;
              const isActive = currentStep === stepNumber;
              const isCompleted = currentStep > stepNumber;
              const isClickable = stepNumber < currentStep || isStepComplete[stepNumber - 1];

              return (
                <div key={stepNumber} className="flex flex-col items-center relative z-10">
                  <button
                    type="button"
                    onClick={() => {
                      if (isClickable) setCurrentStep(stepNumber);
                    }}
                    disabled={!isClickable}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? "bg-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900/30"
                        : isCompleted
                        ? "bg-primary-500 text-white cursor-pointer hover:ring-4 hover:ring-primary-100 dark:hover:ring-primary-900/30"
                        : isClickable
                        ? "bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400 border-2 border-gray-300 dark:border-dark-border cursor-pointer hover:border-primary-500 dark:hover:border-primary-400"
                        : "bg-gray-100 dark:bg-dark-border text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    {isCompleted ? <FaCheck className="w-6 h-6" /> : <Icon className={`w-6 h-6 ${isActive ? "animate-bounce" : ""}`} />}
                  </button>
                  <span className={`mt-3 font-medium text-sm transition-colors duration-300 ${isActive ? "text-primary-500 dark:text-primary-400" : isCompleted ? "text-primary-500 dark:text-primary-400" : "text-gray-500 dark:text-gray-400"}`}>{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="transition-all duration-300 transform">{renderStepContent()}</div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-dark-border">
              {currentStep > 1 && (
                <button type="button" onClick={() => setCurrentStep(currentStep - 1)} className="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors duration-200">
                  <FaArrowLeft className="mr-2" />
                  Retour
                </button>
              )}
              <div className="ml-auto">
                {currentStep < 4 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isStepComplete[currentStep]) {
                        setCurrentStep(currentStep + 1);
                      } else {
                        toast.error("Veuillez remplir tous les champs obligatoires");
                      }
                    }}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center ${
                      isStepComplete[currentStep] ? "bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700" : "bg-gray-100 dark:bg-dark-border text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Suivant
                    <FaArrowRight className="ml-2" />
                  </button>
                )}
                {currentStep === 4 && (
                  <button type="submit" disabled={submitting} className="px-6 py-3 bg-green-500 dark:bg-green-600 text-white rounded-lg font-medium hover:bg-green-600 dark:hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                    {submitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Confirmation en cours...
                      </>
                    ) : (
                      <>
                        Confirmer la réservation
                        <FaCheck className="ml-2" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReservationForm;
