"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "../../utils/toast";
import Button from "../../components/Button";
import Image from "next/image";
import { getUserProfile, updateUserProfile, deleteUserProfile, deleteProfilePicture, getStorageImageUrl } from "../../services/userProfileService";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const router = useRouter();
  const { updateUser } = useAuth();
  // State for user data
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

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [formData, setFormData] = useState(userData);
  const [previewImage, setPreviewImage] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  // Refs
  const fileInputRef = useRef(null);

  // Cleanup preview URLs when they change or component unmounts
  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const userData = await getUserProfile();

        // Map API field names to frontend field names
        const mappedData = {
          firstName: userData.first_name || "",
          lastName: userData.last_name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
          bio: userData.bio || "",
          role: userData.roles && userData.roles.length > 0 ? userData.roles[0] : "",
          joinDate: new Date(userData.created_at).toLocaleDateString("fr-FR"),
          profileImage: userData.picture ? getStorageImageUrl(userData.picture) : null,
        };

        setUserData(mappedData);
        setFormData(mappedData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile data");
        setLoading(false);
        toast.error(err.message || "Erreur lors du chargement du profil");
      }
    };

    fetchUserProfile();
  }, []);

  // Form handlers
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

    // Validation rules
    const validations = [
      {
        condition: file.size > 2 * 1024 * 1024,
        message: "L'image ne doit pas dépasser 2Mo",
      },
      {
        condition: !["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"].includes(file.type),
        message: "Formats acceptés: JPEG, PNG, JPG, GIF, WEBP",
      },
    ];

    // Check file size and type
    for (const validation of validations) {
      if (validation.condition) {
        toast.error(validation.message);
        return;
      }
    }

    // Create URL for image validation
    const validationUrl = URL.createObjectURL(file);

    // Check dimensions
    const img = document.createElement("img");

    img.onload = function () {
      // Validate dimensions
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

      // Cleanup validation URL
      URL.revokeObjectURL(validationUrl);

      // Create new URL for preview
      const previewUrl = URL.createObjectURL(file);

      // Set preview and update form data
      setPreviewImage(previewUrl);
      setFormData((prev) => ({ ...prev, profileImage: file }));
      toast.success("Image téléchargée avec succès");
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
      
      // Update the global user state immediately
      await updateUser();
      
      // Update local state
      setUserData(prev => ({ ...prev, profileImage: null }));
      setFormData(prev => ({ ...prev, profileImage: null }));
      setPreviewImage(null);
      
      toast.success("Photo de profil supprimée avec succès");
    } catch (err) {
      console.error("Error deleting profile picture:", err);
      toast.error(err.message || "Erreur lors de la suppression de la photo de profil");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.firstName || !formData.lastName) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      // Create FormData for submission
      const formDataToSend = new FormData();

      // Add form fields
      const fields = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone || "",
        address: formData.address || "",
        bio: formData.bio || "",
      };

      // Append all fields to FormData
      Object.entries(fields).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Add password if provided
      if (newPassword) {
        formDataToSend.append("password", newPassword);
      }

      // Handle image upload
      if (formData.profileImage instanceof File) {
        formDataToSend.append("picture", formData.profileImage);
      }

      // Submit form
      const response = await updateUserProfile(formDataToSend);

      // Update the global user state immediately
      await updateUser();

      // Process response
      const updatedUser = response.user;
      const updatedMappedData = {
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        phone: updatedUser.phone || "",
        address: updatedUser.address || "",
        bio: updatedUser.bio || "",
        role: updatedUser.roles && updatedUser.roles.length > 0 ? updatedUser.roles[0] : formData.role,
        joinDate: new Date(updatedUser.created_at).toLocaleDateString("fr-FR"),
        profileImage: updatedUser.picture ? getStorageImageUrl(updatedUser.picture) : null,
      };

      // Update state
      setUserData(updatedMappedData);
      setFormData(updatedMappedData);
      setPreviewImage(null);
      setNewPassword("");
      setIsEditing(false);

      // Show success message
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

  // Profile deletion
  const handleDeleteProfile = async () => {
    try {
      const response = await deleteUserProfile();
      toast.success(response?.message || "Profil supprimé avec succès");
      router.push("/"); // Redirect to home page
    } catch (err) {
      console.error("Error deleting profile:", err);
      toast.error(err.message || "Erreur lors de la suppression du profil");
    }
  };

  // Helper functions
  const getFullName = () => {
    const firstName = userData.firstName || "";
    const lastName = userData.lastName || "";
    return `${firstName} ${lastName}`.trim();
  };

  const renderProfileImage = () => {
    const imageSrc = previewImage || userData.profileImage;

    return (
      <Image
        src={imageSrc || "/default-avatar.png"}
        alt={imageSrc ? "Profile" : "Default Avatar"}
        width={128}
        height={128}
        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
        priority
        onError={() => {
          // If profile image fails to load, reset to default
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

  // Render delete confirmation modal
  const renderDeleteConfirmModal = () => {
    if (!showDeleteConfirm) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Confirmer la suppression</h3>
          <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer votre profil ? Cette action est irréversible.</p>
          <div className="flex justify-end space-x-4">
            <Button onClick={() => setShowDeleteConfirm(false)} variant="secondary">
              Annuler
            </Button>
            <button onClick={handleDeleteProfile} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md">
              Supprimer
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render loading state
  const renderLoading = () => (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="rounded-full bg-gray-200 h-32 w-32 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
      <p className="mt-4 text-gray-600">Chargement du profil...</p>
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <div className="text-red-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
      <p className="text-gray-600">{error}</p>
      <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
        Réessayer
      </button>
    </div>
  );

  // Render edit form
  const renderEditForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Photo de profil */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Photo de profil</label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-300">{renderProfileImage()}</div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button type="button" onClick={triggerFileInput} variant="secondary" className="w-full sm:w-auto">
                Choisir une photo
              </Button>
              {(userData.profileImage || previewImage) && (
                <Button
                  type="button"
                  onClick={handleDeletePicture}
                  variant="danger"
                  className="w-full sm:w-auto"
                >
                  Supprimer
                </Button>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
              className="hidden"
            />
            <p className="mt-1 text-xs text-gray-500">JPG, PNG, GIF ou WEBP. Max 2Mo.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
          <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" name="email" value={formData.email} disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe (optionnel)</label>
          <input type="password" name="password" value={newPassword} onChange={handlePasswordChange} placeholder="Laisser vide pour ne pas changer" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
        <textarea name="bio" value={formData.bio} onChange={handleChange} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"></textarea>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={loading} variant="primary" className="w-full sm:w-auto">
          Enregistrer les modifications
        </Button>
      </div>
    </form>
  );

  // Render profile display
  const renderProfileDisplay = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-4">Informations personnelles</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="mt-1 text-sm sm:text-base">{userData.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Téléphone</p>
              <p className="mt-1 text-sm sm:text-base">{userData.phone || "Non renseigné"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Adresse</p>
              <p className="mt-1 text-sm sm:text-base">{userData.address || "Non renseignée"}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-4">À propos</h2>
          <p className="text-sm sm:text-base text-gray-800">{userData.bio || "Aucune biographie renseignée"}</p>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="max-w-4xl mx-auto">
      {/* Delete Confirmation Modal */}
      {renderDeleteConfirmModal()}

      {/* Content */}
      {loading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="h-24 sm:h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>

          {/* Profile info */}
          <div className="relative px-4 sm:px-6 py-4 sm:py-8">
            <div className="absolute -top-12 sm:-top-16 left-4 sm:left-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white overflow-hidden shadow-lg">{renderProfileImage()}</div>
            </div>

            <div className="ml-28 sm:ml-36">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{getFullName()}</h1>
                  <p className="text-sm sm:text-base text-gray-600">{userData.role}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <button onClick={() => setIsEditing(!isEditing)} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm sm:text-base">
                    {isEditing ? "Annuler" : "Modifier le profil"}
                  </button>
                  {!isEditing && (
                    <button onClick={() => setShowDeleteConfirm(true)} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm sm:text-base">
                      Supprimer le profil
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2 sm:mt-4 text-xs sm:text-sm text-gray-600">
                <p>Membre depuis {userData.joinDate}</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Profile content */}
          <div className="p-4 sm:p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Photo de profil */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Photo de profil</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-300">{renderProfileImage()}</div>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button type="button" onClick={triggerFileInput} variant="secondary" className="w-full sm:w-auto">
                          Choisir une photo
                        </Button>
                        {(userData.profileImage || previewImage) && (
                          <Button
                            type="button"
                            onClick={handleDeletePicture}
                            variant="danger"
                            className="w-full sm:w-auto"
                          >
                            Supprimer
                          </Button>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                        className="hidden"
                      />
                      <p className="mt-1 text-xs text-gray-500">JPG, PNG, GIF ou WEBP. Max 2Mo.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe (optionnel)</label>
                    <input type="password" name="password" value={newPassword} onChange={handlePasswordChange} placeholder="Laisser vide pour ne pas changer" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea name="bio" value={formData.bio} onChange={handleChange} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"></textarea>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" loading={loading} variant="primary" className="w-full sm:w-auto">
                    Enregistrer les modifications
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-sm font-medium text-gray-500 mb-4">Informations personnelles</h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="mt-1 text-sm sm:text-base">{userData.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <p className="mt-1 text-sm sm:text-base">{userData.phone || "Non renseigné"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Adresse</p>
                        <p className="mt-1 text-sm sm:text-base">{userData.address || "Non renseignée"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-medium text-gray-500 mb-4">À propos</h2>
                    <p className="text-sm sm:text-base text-gray-800">{userData.bio || "Aucune biographie renseignée"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
