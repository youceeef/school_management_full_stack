"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CalendarDaysIcon,
  CameraIcon,
  EnvelopeIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhoneIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "../../utils/toast";
import Button from "../../components/Button";
import FormInput from "../../components/FormInput";
import FormTextArea from "../../components/FormTextArea";
import { Card, PageHeader } from "../../components/ui";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  deleteProfilePicture,
  getStorageImageUrl,
} from "../../services/userProfileService";
import { useAuth } from "../../context/AuthContext";
import TwoFactorSection from "./TwoFactorSection";

export default function Profile() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
    role: "",
    joinDate: "",
    profileImage: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState(userData);
  const [previewImage, setPreviewImage] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const profile = await getUserProfile();

        const mappedData = {
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          address: profile.address || "",
          bio: profile.bio || "",
          role: profile.roles && profile.roles.length > 0 ? profile.roles[0] : "",
          joinDate: new Date(profile.created_at).toLocaleDateString("fr-FR"),
          profileImage: profile.picture ? getStorageImageUrl(profile.picture) : null,
          twoFactorEnabled: Boolean(profile.two_factor_enabled),
        };

        setUserData(mappedData);
        setFormData(mappedData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Impossible de charger les données du profil");
        setLoading(false);
        toast.error(err.message || "Erreur lors du chargement du profil");
      }
    };

    fetchUserProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    setNewPassword(e.target.value);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validations = [
      {
        condition: file.size > 2 * 1024 * 1024,
        message: "L'image ne doit pas dépasser 2 Mo",
      },
      {
        condition: !["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"].includes(
          file.type
        ),
        message: "Formats acceptés : JPEG, PNG, JPG, GIF, WEBP",
      },
    ];

    for (const validation of validations) {
      if (validation.condition) {
        toast.error(validation.message);
        return;
      }
    }

    const validationUrl = URL.createObjectURL(file);
    const img = document.createElement("img");

    img.onload = function () {
      if (img.width < 100 || img.height < 100) {
        URL.revokeObjectURL(validationUrl);
        toast.error("L'image doit avoir au minimum 100x100 pixels");
        return;
      }
      if (img.width > 2000 || img.height > 2000) {
        URL.revokeObjectURL(validationUrl);
        toast.error("L'image ne doit pas dépasser 2000x2000 pixels");
        return;
      }

      URL.revokeObjectURL(validationUrl);
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
      setFormData((prev) => ({ ...prev, profileImage: file }));
      toast.success("Image sélectionnée avec succès");
    };

    img.onerror = function () {
      URL.revokeObjectURL(validationUrl);
      toast.error("Format d'image invalide ou erreur de chargement.");
    };

    img.src = validationUrl;
  };

  const handleDeletePicture = async () => {
    try {
      await deleteProfilePicture();
      await updateUser();
      setUserData((prev) => ({ ...prev, profileImage: null }));
      setFormData((prev) => ({ ...prev, profileImage: null }));
      setPreviewImage(null);
      toast.success("Photo de profil supprimée avec succès");
    } catch (err) {
      console.error("Error deleting profile picture:", err);
      toast.error(err.message || "Erreur lors de la suppression de la photo de profil");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      const formDataToSend = new FormData();
      const fields = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone || "",
        address: formData.address || "",
        bio: formData.bio || "",
      };

      Object.entries(fields).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      if (newPassword) {
        formDataToSend.append("password", newPassword);
      }

      if (formData.profileImage instanceof File) {
        formDataToSend.append("picture", formData.profileImage);
      }

      const response = await updateUserProfile(formDataToSend);
      await updateUser();

      const updatedUser = response.user;
      const updatedMappedData = {
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        phone: updatedUser.phone || "",
        address: updatedUser.address || "",
        bio: updatedUser.bio || "",
        role:
          updatedUser.roles && updatedUser.roles.length > 0
            ? updatedUser.roles[0]
            : formData.role,
        joinDate: new Date(updatedUser.created_at).toLocaleDateString("fr-FR"),
        profileImage: updatedUser.picture ? getStorageImageUrl(updatedUser.picture) : null,
      };

      setUserData(updatedMappedData);
      setFormData(updatedMappedData);
      setPreviewImage(null);
      setNewPassword("");
      setIsEditing(false);

      if (response.updated) {
        const { text_fields, picture } = response.updated;
        if (text_fields && picture) {
          toast.success("Profil et photo mis à jour avec succès");
        } else if (picture) {
          toast.success("Photo de profil mise à jour avec succès");
        } else if (text_fields) {
          toast.success("Informations du profil mises à jour avec succès");
        } else {
          toast.success("Profil mis à jour avec succès");
        }
      } else {
        toast.success("Profil mis à jour avec succès");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(err.message || "Erreur lors de la mise à jour du profil");
    }
  };

  const handleDeleteProfile = async () => {
    try {
      const response = await deleteUserProfile();
      toast.success(response?.message || "Profil supprimé avec succès");
      router.push("/");
    } catch (err) {
      console.error("Error deleting profile:", err);
      toast.error(err.message || "Erreur lors de la suppression du profil");
    }
  };

  const getFullName = () => {
    return `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Utilisateur";
  };

  const renderProfileImage = (sizeClass = "w-20 h-20") => {
    const imageSrc = previewImage || userData.profileImage;

    return (
      <Image
        src={imageSrc || "/default-avatar.png"}
        alt={imageSrc ? "Photo de profil" : "Avatar par défaut"}
        width={112}
        height={112}
        className={`${sizeClass} rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800`}
        priority
        onError={() => {
          if (userData.profileImage) {
            setUserData((prev) => ({
              ...prev,
              profileImage: null,
            }));
          }
          if (previewImage) {
            setPreviewImage(null);
          }
        }}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="py-12 text-center">
          <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white mb-2">
            Erreur de chargement
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon profil"
        description="Gérez vos coordonnées personnelles, votre biographie et la sécurité de votre compte."
        actions={[
          {
            children: isEditing ? "Annuler les modifications" : "Modifier le profil",
            icon: isEditing ? XMarkIcon : PencilSquareIcon,
            variant: isEditing ? "secondary" : "primary",
            onClick: () => setIsEditing(!isEditing),
          },
        ]}
      />

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-5">
            {renderProfileImage("w-20 h-20")}
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">
                {getFullName()}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 capitalize mt-0.5">
                {userData.role || "Membre EduSpace"} ·{" "}
                <span className="inline-flex items-center gap-1 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  <CalendarDaysIcon className="w-3.5 h-3.5" />
                  Inscrit le {userData.joinDate}
                </span>
              </p>
            </div>
          </div>

          {!isEditing && (
            <Button
              variant="danger"
              size="sm"
              icon={TrashIcon}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Supprimer le compte
            </Button>
          )}
        </div>

        <div className="pt-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Photo de profil
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    onClick={triggerFileInput}
                    variant="secondary"
                    size="sm"
                    icon={CameraIcon}
                  >
                    Choisir une image
                  </Button>
                  {(userData.profileImage || previewImage) && (
                    <Button
                      type="button"
                      onClick={handleDeletePicture}
                      variant="danger"
                      size="sm"
                      icon={TrashIcon}
                    >
                      Retirer la photo
                    </Button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                    className="hidden"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    JPG, PNG, GIF ou WEBP (max. 2 Mo)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Prénom"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  label="Nom"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  label="Adresse e-mail"
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled
                />
                <FormInput
                  label="Nouveau mot de passe (optionnel)"
                  id="password"
                  name="password"
                  type="password"
                  value={newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Laisser vide pour conserver l’actuel"
                />
                <FormInput
                  label="Téléphone"
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
                <FormInput
                  label="Adresse postale"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <FormTextArea
                label="Biographie / Spécialité"
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                placeholder="Présentez votre fonction ou vos enseignements au CSFT..."
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                  Annuler
                </Button>
                <Button type="submit" loading={loading} variant="primary">
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Coordonnées
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <EnvelopeIcon className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Adresse e-mail</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {userData.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <PhoneIcon className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Téléphone</p>
                      <p className="text-sm font-mono tabular-nums text-slate-900 dark:text-white">
                        {userData.phone || "Non renseigné"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Adresse</p>
                      <p className="text-sm text-slate-900 dark:text-white">
                        {userData.address || "Non renseignée"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  À propos
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {userData.bio || "Aucune biographie renseignée."}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {!loading && (
        <TwoFactorSection
          initialEnabled={userData.twoFactorEnabled}
          onStatusChange={(newStatus) =>
            setUserData((prev) => ({ ...prev, twoFactorEnabled: newStatus }))
          }
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-xl max-w-md w-full space-y-4">
            <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white">
              Confirmer la suppression du compte
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Êtes-vous sûr de vouloir supprimer définitivement votre profil ? Cette action est
              irréversible.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={() => setShowDeleteConfirm(false)} variant="secondary">
                Annuler
              </Button>
              <Button onClick={handleDeleteProfile} variant="danger">
                Confirmer la suppression
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
