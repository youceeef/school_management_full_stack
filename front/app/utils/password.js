export const PASSWORD_REQUIREMENTS =
  "Le mot de passe doit contenir au moins 12 caractères, avec des minuscules, des majuscules, un chiffre et un symbole.";

export const isStrongPassword = (password) =>
  password.length >= 12 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);
