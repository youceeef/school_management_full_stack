"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  FunnelIcon,
  KeyIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import AdminRoute from "../../components/AdminRoute";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import SearchInput from "../../components/SearchInput";
import { Card, DataTable, PageHeader, StatsCard } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { getUsers, removeUserRole } from "../../services/userService";
import { getRoleLabel } from "../../utils/roleLabels";
import toast from "../../utils/toast";

const EMPTY_META = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
  from: null,
  to: null,
  counts: { total: 0, admins: 0, pending: 0 },
};

const STATUS_STYLES = {
  approved:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  pending:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  rejected:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
  suspended:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

const STATUS_LABELS = {
  approved: "Approuvé",
  pending: "En attente",
  rejected: "Refusé",
  suspended: "Suspendu",
};

function UsersPage() {
  const { user: currentUser } = useAuth();
  const { tr, dateLocale } = useLanguage();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let active = true;

    const loadUsers = async () => {
      setLoading(true);
      try {
        const response = await getUsers({
          page,
          per_page: 15,
          search: debouncedSearch || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          department: departmentFilter.trim() || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          sort_by: sortBy,
          sort_direction: sortDirection,
        });

        if (!active) return;

        const nextMeta = response.meta || EMPTY_META;
        if (page > nextMeta.last_page && nextMeta.last_page > 0) {
          setPage(nextMeta.last_page);
          return;
        }

        setUsers(response.data || []);
        setMeta({ ...EMPTY_META, ...nextMeta, counts: { ...EMPTY_META.counts, ...nextMeta.counts } });
      } catch (error) {
        if (!active) return;
        console.error("Error fetching users:", error);
        toast.error(tr(error.message || "Erreur lors du chargement des utilisateurs"));
        setUsers([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadUsers();
    return () => {
      active = false;
    };
  }, [
    dateFrom,
    dateTo,
    debouncedSearch,
    departmentFilter,
    page,
    refreshKey,
    roleFilter,
    sortBy,
    sortDirection,
    statusFilter,
    tr,
  ]);

  const handleRemoveRole = (row, roleName) => {
    const userName = `${row.first_name} ${row.last_name}`.trim();
    toast.confirmDelete(
      `Êtes-vous sûr de vouloir retirer le rôle "${getRoleLabel(roleName, tr)}" de l'utilisateur "${userName}" ?`,
      async () => {
        await removeUserRole(row.id, roleName);
        setRefreshKey((value) => value + 1);
      },
      {
        loading: tr("Retrait du rôle en cours..."),
        success: tr("Le rôle a été retiré"),
        error: tr("Erreur lors du retrait du rôle"),
      }
    );
  };

  const resetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setDepartmentFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const updateSort = (field) => {
    setPage(1);
    if (sortBy === field) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const sortHeader = (label, field) => (
    <button
      type="button"
      onClick={() => updateSort(field)}
      className="inline-flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400"
    >
      <span>{tr(label)}</span>
      {sortBy === field &&
        (sortDirection === "asc" ? (
          <ArrowUpIcon className="h-3.5 w-3.5" />
        ) : (
          <ArrowDownIcon className="h-3.5 w-3.5" />
        ))}
    </button>
  );

  const approvalBadge = (status) => {
    const normalized = STATUS_LABELS[status] ? status : "approved";
    return (
      <span
        className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[normalized]}`}
      >
        {tr(STATUS_LABELS[normalized])}
      </span>
    );
  };

  const formatDate = (value) =>
    value ? new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium" }).format(new Date(value)) : "—";

  const isProtectedAdminRole = (row, roleName) =>
    roleName === "admin" &&
    (Number(row.id) === Number(currentUser?.id) || Number(meta.counts.admins) <= 1);

  const roleBadges = (row, mobile = false) => {
    if (!row.roles?.length) {
      return <span className="text-xs text-slate-400 dark:text-slate-500">{tr("Aucun rôle")}</span>;
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        {row.roles.map((role) => {
          const roleName = typeof role === "object" ? role.name : role;
          const protectedRole = isProtectedAdminRole(row, roleName);
          return (
            <span
              key={`${row.id}-${roleName}-${mobile ? "mobile" : "desktop"}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <span>{getRoleLabel(roleName, tr)}</span>
              <button
                type="button"
                onClick={() => handleRemoveRole(row, roleName)}
                disabled={protectedRole}
                className="rounded p-0.5 text-slate-400 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:text-red-400"
                title={
                  protectedRole
                    ? tr("Le dernier administrateur ou votre propre rôle administrateur ne peut pas être retiré.")
                    : tr("Retirer ce rôle")
                }
                aria-label={`${tr("Retirer ce rôle")} ${getRoleLabel(roleName, tr)}`}
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </span>
          );
        })}
      </div>
    );
  };

  const columns = [
    {
      header: sortHeader("ID", "id"),
      accessor: "id",
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">#{row.id}</span>
      ),
    },
    {
      header: sortHeader("Utilisateur", "name"),
      accessor: "first_name",
      render: (row) => (
        <div>
          <span className="block font-medium text-slate-900 dark:text-slate-100">
            {row.first_name} {row.last_name}
          </span>
          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
            {row.department || row.institution || "—"}
          </span>
        </div>
      ),
    },
    {
      header: sortHeader("Adresse e-mail", "email"),
      accessor: "email",
      render: (row) => <span className="text-sm text-slate-600 dark:text-slate-400">{row.email}</span>,
    },
    {
      header: "Rôles attribués",
      accessor: "roles",
      render: (row) => roleBadges(row),
    },
    {
      header: sortHeader("Approbation", "approval_status"),
      accessor: "approval_status",
      render: (row) => approvalBadge(row.approval_status),
    },
    {
      header: sortHeader("Inscription", "created_at"),
      accessor: "created_at",
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
          {formatDate(row.created_at)}
        </span>
      ),
    },
  ];

  const statsCards = [
    { title: "Comptes enregistrés", value: meta.counts.total.toLocaleString(dateLocale), icon: UsersIcon },
    { title: "Administrateurs", value: meta.counts.admins.toLocaleString(dateLocale), icon: KeyIcon },
    { title: "Comptes en attente", value: meta.counts.pending.toLocaleString(dateLocale), icon: ClockIcon },
  ];

  const hasFilters = Boolean(
    searchTerm || roleFilter || statusFilter || departmentFilter || dateFrom || dateTo
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Annuaire des utilisateurs"
        description="Recherchez, filtrez et administrez les rôles des membres de la plateforme."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {statsCards.map((stat) => (
          <StatsCard key={stat.title} {...stat} loading={loading && meta.counts.total === 0} />
        ))}
      </div>

      <Card title="Filtres" subtitle="Affinez la liste sans télécharger tout l’annuaire">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <SearchInput
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setPage(1);
            }}
            onClear={() => {
              setSearchTerm("");
              setPage(1);
            }}
            placeholder="Rechercher par nom, email, établissement..."
            className="xl:col-span-2"
          />
          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">{tr("Tous les rôles")}</option>
            <option value="admin">{getRoleLabel("admin", tr)}</option>
            <option value="enseignant">{getRoleLabel("enseignant", tr)}</option>
            <option value="responsable_laboratoire">{getRoleLabel("responsable_laboratoire", tr)}</option>
            <option value="eleve">{getRoleLabel("eleve", tr)}</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">{tr("Tous les statuts")}</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {tr(label)}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={departmentFilter}
            onChange={(event) => {
              setDepartmentFilter(event.target.value);
              setPage(1);
            }}
            placeholder={tr("Département")}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 shrink-0 text-slate-400" />
            <Button variant="secondary" size="sm" onClick={resetFilters} disabled={!hasFilters} className="w-full">
              {tr("Réinitialiser")}
            </Button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:max-w-xl">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="mb-1 block">{tr("Inscrit à partir du")}</span>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="mb-1 block">{tr("Inscrit jusqu’au")}</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
        </div>
      </Card>

      <Card title="Comptes utilisateurs" subtitle="Liste paginée des membres de la plateforme">
        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <div className="hidden md:block">
              <DataTable columns={columns} data={users} searchable={false} />
            </div>

            <div className="space-y-3 md:hidden">
              {users.length ? (
                users.map((row) => (
                  <article
                    key={row.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-900 dark:text-white">
                          {row.first_name} {row.last_name}
                        </h3>
                        <a
                          href={`mailto:${row.email}`}
                          className="mt-0.5 block truncate text-sm text-primary-600 dark:text-primary-400"
                        >
                          {row.email}
                        </a>
                      </div>
                      {approvalBadge(row.approval_status)}
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">{tr("Département")}</dt>
                        <dd className="mt-1 text-slate-800 dark:text-slate-200">
                          {row.department || row.institution || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">{tr("Inscription")}</dt>
                        <dd className="mt-1 text-slate-800 dark:text-slate-200">{formatDate(row.created_at)}</dd>
                      </div>
                    </dl>
                    <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {tr("Rôles attribués")}
                      </p>
                      {roleBadges(row, true)}
                    </div>
                  </article>
                ))
              ) : (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  {tr("Aucun utilisateur ne correspond aux filtres sélectionnés.")}
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {meta.total > 0
                  ? `${tr("Affichage")} ${meta.from}–${meta.to} ${tr("sur")} ${meta.total}`
                  : tr("Aucun utilisateur")}
              </p>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ChevronLeftIcon}
                  disabled={loading || meta.current_page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  {tr("Précédent")}
                </Button>
                <span className="min-w-20 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
                  {meta.current_page} / {meta.last_page}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={loading || meta.current_page >= meta.last_page}
                  onClick={() => setPage((value) => Math.min(meta.last_page, value + 1))}
                >
                  <span>{tr("Suivant")}</span>
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function ProtectedUsersPage() {
  return (
    <AdminRoute>
      <UsersPage />
    </AdminRoute>
  );
}
