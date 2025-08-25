import toast, { Toaster } from "react-hot-toast";

// Durées par défaut pour chaque type de notification
const durations = {
  success: 3000,
  error: 4000,
  info: 2500,
  loading: 3000,
};

/**
 * Affiche une notification de succès
 * @param {string} message - Message à afficher
 * @param {object} options - Options supplémentaires pour la notification
 */
export const notifySuccess = (message, options = {}) => {
  toast.success(message, {
    duration: durations.success,
    style: {
      wordBreak: 'break-word',
      whiteSpace: 'normal',
      ...options.style,
    },
    ...options,
  });
};

/**
 * Affiche une notification d'erreur
 * @param {string} message - Message à afficher
 * @param {object} options - Options supplémentaires pour la notification
 */
export const notifyError = (message, options = {}) => {
  toast.error(message, {
    duration: durations.error,
    style: {
      wordBreak: 'break-word',
      whiteSpace: 'normal',
      ...options.style,
    },
    ...options,
  });
};

/**
 * Affiche une notification d'information
 * @param {string} message - Message à afficher
 * @param {object} options - Options supplémentaires pour la notification
 */
export const notifyInfo = (message, options = {}) => {
  // Utiliser toast avec des options personnalisées pour info puisque toast.info n'existe pas nativement
  toast(message, {
    duration: durations.info,
    icon: "ℹ️",
    style: {
      background: "#3b82f6",
      color: "#fff",
      wordBreak: 'break-word',
      whiteSpace: 'normal',
      ...options.style,
    },
    ...options,
  });
};

/**
 * Affiche une notification de chargement
 * @param {string} message - Message à afficher pendant le chargement
 * @param {Promise} promise - Promise à surveiller
 * @param {object} options - Options avec messages de succès et d'erreur
 * @returns {Promise} - Renvoie la promise d'origine
 */
export const notifyPromise = (message, promise, options = {}) => {
  return toast.promise(
    promise,
    {
      loading: message,
      success: options.success || "Opération réussie",
      error: options.error || "Une erreur est survenue",
    },
    {
      duration: durations.loading,
      ...options.toastOptions,
    }
  );
};

/**
 * Affiche une notification personnalisée
 * @param {string} message - Message à afficher
 * @param {object} options - Options supplémentaires pour la notification
 */
export const notifyCustom = (message, options = {}) => {
  toast(message, {
    style: {
      wordBreak: 'break-word',
      whiteSpace: 'normal',
      ...options.style,
    },
    ...options,
  });
};

/**
 * Rejette toutes les notifications actuellement affichées
 */
export const dismissAll = () => {
  toast.dismiss();
};

/**
 * Fonction de confirmation qui utilise une notification toast
 * avec des boutons d'action et retourne une promise pour gérer la réponse
 * @param {string} message - Message de confirmation
 * @returns {Promise<boolean>} - Promise résolue avec la réponse de l'utilisateur
 */
export const confirm = (message) => {
  return new Promise((resolve) => {
    const toastId = toast.custom(
      (t) => (
        <div className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex flex-col`}>
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Confirmation</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">{message}</p>
              </div>
            </div>
          </div>
          <div className="flex border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                toast.dismiss(toastId);
                resolve(false);
              }}
              className="w-full border border-transparent rounded-none rounded-bl-lg px-4 py-3 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                toast.dismiss(toastId);
                resolve(true);
              }}
              className="w-full border border-transparent rounded-none rounded-br-lg px-4 py-3 flex items-center justify-center text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 focus:outline-none"
            >
              Confirmer
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  });
};

/**
 * Fonction pour supprimer un élément avec une confirmation et un toast
 * @param {string} message - Message de confirmation
 * @param {Function} deleteAction - Fonction à exécuter si l'utilisateur confirme
 * @param {object} options - Options pour les messages toast
 */
export const confirmDelete = async (message, deleteAction, options = {}) => {
  if (await confirm(message)) {
    return notifyPromise(
      options.loading || "Suppression en cours...",
      new Promise((resolve, reject) => {
        try {
          const result = deleteAction();
          // Si l'action de suppression renvoie une promise, on la gère
          if (result instanceof Promise) {
            result.then(resolve).catch(reject);
          } else {
            // Sinon on simule un délai pour l'effet visuel
            setTimeout(resolve, 800);
          }
        } catch (error) {
          reject(error);
        }
      }),
      {
        success: options.success || "Élément supprimé avec succès",
        error: options.error || "Erreur lors de la suppression",
        toastOptions: options.toastOptions,
      }
    );
  }
  return Promise.resolve(false);
};

/**
 * Affiche un message de bienvenue une seule fois par session
 * @param {string} key - Clé unique pour identifier le message
 * @param {string} type - Type de toast ('info', 'success', 'error', ou 'custom')
 * @param {string} message - Message à afficher
 * @param {object} options - Options supplémentaires pour la notification
 */
export const showWelcomeOnce = (key, type, message, options = {}) => {
  // Vérifier que nous sommes dans un environnement client avec sessionStorage
  if (typeof window !== "undefined" && window.sessionStorage) {
    const hasShown = sessionStorage.getItem(`hasShown_${key}`);

    if (!hasShown) {
      // Afficher le message selon le type
      if (type === "info") {
        notifyInfo(message, options);
      } else if (type === "success") {
        notifySuccess(message, options);
      } else if (type === "error") {
        notifyError(message, options);
      } else {
        notifyCustom(message, options);
      }
      // Marquer que le message a été affiché
      sessionStorage.setItem(`hasShown_${key}`, "true");
    }
  }
};

// Exports des fonctions de toast d'origine pour une utilisation avancée
export const originalToast = toast;

const toastUtils = {
  success: notifySuccess,
  error: notifyError,
  info: notifyInfo,
  promise: notifyPromise,
  custom: notifyCustom,
  dismiss: dismissAll,
  confirm,
  confirmDelete,
  showWelcomeOnce,
  original: toast,
};

export default toastUtils;
