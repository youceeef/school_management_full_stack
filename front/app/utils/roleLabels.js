const ROLE_LABELS = {
  admin: "Administrateur",
  enseignant: "Enseignant",
  responsable_laboratoire: "Responsable de laboratoire",
  eleve: "Élève / Étudiant",
};

export function getRoleLabel(roleName, translate = (value) => value) {
  if (!roleName) return "—";
  return translate(ROLE_LABELS[roleName] || roleName);
}
