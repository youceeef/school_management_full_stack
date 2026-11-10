"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  EyeIcon,
  FunnelIcon,
  KeyIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
  TrashIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import AdminRoute from "../../components/AdminRoute";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import SearchInput from "../../components/SearchInput";
import UserDetailsModal from "../../components/UserDetailsModal";
import { Card, DataTable, PageHeader, StatsCard } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { getUsers, removeUserRole, bulkUserAction } from "../../services/userService";
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

const BULK_ROLES = ["admin", "enseignant", "responsable_laboratoire", "eleve"];

function getInitialFilterState() {
  if (typeof window === "undefined") {
    return {
      search: "",
      role: "",
      status: "",
      department: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "created_at",
      sortDirection: "desc",
      page: 1,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const hasParams = Array.from(params.keys()).length > 0;

  if (hasParams) {
    return {
      search: params.get("search") || "",
      role: params.get("role") || "",
      status: params.get("status") || "",
      department: params.get("department") || "",
      dateFrom: params.get("date_from") || "",
      dateTo: params.get("date_to") || "",
      sortBy: params.get("sort_by") || "created_at",
      sortDirection: params.get("sort_direction") || "desc",
      page: parseInt(params.get("page") || "1", 10) || 1,
    };
  }

  try {
    const saved = sessionStorage.getItem("users_filter_state");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        search: parsed.search || "",
        role: parsed.role || "",
        status: parsed.status || "",
        department: parsed.department || "",
        dateFrom: parsed.dateFrom || "",
        dateTo: parsed.dateTo || "",
        sortBy: parsed.sortBy || "created_at",
        sortDirection: parsed.sortDirection || "desc",
        page: parsed.page || 1,
      };
    }
  } catch (e) {
    console.warn("Could not read filters from sessionStorage:", e);
  }

  return {
    search: "",
    role: "",
    status: "",
    department: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "created_at",
    sortDirection: "desc",
    page: 1,
  };
}

function UsersPage() {
  const { user: currentUser } = useAuth();
  const { tr, dateLocale, isRtl } = useLanguage();

  const initialState = useMemo(() => getInitialFilterState(), []);

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(EMPTY_META);
  const [loading, setLoading] = useState(true);

  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState(initialState.search);
  const [debouncedSearch, setDebouncedSearch] = useState(initialState.search);
  const [roleFilter, setRoleFilter] = useState(initialState.role);
  const [statusFilter, setStatusFilter] = useState(initialState.status);
  const [departmentFilter, setDepartmentFilter] = useState(initialState.department);
  const [dateFrom, setDateFrom] = useState(initialState.dateFrom);
  const [dateTo, setDateTo] = useState(initialState.dateTo);
  const [sortBy, setSortBy] = useState(initialState.sortBy);
  const [sortDirection, setSortDirection] = useState(initialState.sortDirection);
  const [page, setPage] = useState(initialState.page);

  // Bulk actions & selection
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkRoleMenu, setShowBulkRoleMenu] = useState(false);
  const [bulkActionType, setBulkActionType] = useState("assign"); // "assign" or "remove"

  // User details modal
  const [detailsUserId, setDetailsUserId] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const headerCheckboxRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Synchronize filters with URL search parameters and sessionStorage for navigation persistence
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stateObj = {
      search: debouncedSearch,
      role: roleFilter,
      status: statusFilter,
      department: departmentFilter,
      dateFrom,
      dateTo,
      sortBy,
      sortDirection,
      page,
    };

    try {
      sessionStorage.setItem("users_filter_state", JSON.stringify(stateObj));
    } catch (e) {
      // Ignore quota errors
    }

    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (departmentFilter) params.set("department", departmentFilter);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (sortBy !== "created_at") params.set("sort_by", sortBy);
    if (sortDirection !== "desc") params.set("sort_direction", sortDirection);
    if (page > 1) params.set("page", String(page));

    const queryStr = params.toString();
    const nextUrl = window.location.pathname + (queryStr ? `?${queryStr}` : "");
    window.history.replaceState(null, "", nextUrl);
  }, [
    debouncedSearch,
    roleFilter,
    statusFilter,
    departmentFilter,
    dateFrom,
    dateTo,
    sortBy,
    sortDirection,
    page,
  ]);

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

  // Master checkbox indeterminate state
  useEffect(() => {
    if (!headerCheckboxRef.current) return;
    const pageUserIds = users.map((u) => u.id);
    const selectedOnPage = pageUserIds.filter((id) => selectedUserIds.includes(id));
    const allSelectedOnPage = pageUserIds.length > 0 && selectedOnPage.length === pageUserIds.length;
    const someSelectedOnPage = selectedOnPage.length > 0 && !allSelectedOnPage;

    headerCheckboxRef.current.indeterminate = someSelectedOnPage;
  }, [users, selectedUserIds]);

  const toggleSelectAllPage = () => {
    const pageUserIds = users.map((u) => u.id);
    const allSelectedOnPage = pageUserIds.length > 0 && pageUserIds.every((id) => selectedUserIds.includes(id));

    if (allSelectedOnPage) {
      setSelectedUserIds((prev) => prev.filter((id) => !pageUserIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...pageUserIds])));
    }
  };

  const toggleSelectUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

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
    setSortBy("created_at");
    setSortDirection("desc");
    setPage(1);
    setSelectedUserIds([]);
    try {
      sessionStorage.removeItem("users_filter_state");
    } catch (e) {}
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
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

  // Bulk actions executor
  const executeBulkAction = async (action, extra = {}) => {
    if (!selectedUserIds.length) return;
    try {
      setBulkActionLoading(true);
      const res = await bulkUserAction({
        userIds: selectedUserIds,
        action,
        role: extra.role,
        reason: extra.reason,
      });

      const processed = res.processed_count || 0;
      const skipped = res.skipped_count || 0;

      if (skipped > 0 && res.skipped_reasons?.length) {
        toast.info(
          `${processed} utilisateur(s) mis à jour. Note : ${res.skipped_reasons.join(" ")}`
        );
      } else {
        toast.success(tr(res.message || "Action groupée traitée avec succès."));
      }

      setSelectedUserIds([]);
      setShowBulkRoleMenu(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(tr(err.message || "Erreur lors de l'exécution de l'action groupée"));
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = () => {
    toast.confirmDelete(
      `Êtes-vous sûr de vouloir supprimer définitivement les ${selectedUserIds.length} utilisateurs sélectionnés ? Les administrateurs protégés seront automatiquement ignorés.`,
      () => executeBulkAction("delete"),
      {
        loading: tr("Suppression groupée en cours..."),
        success: tr("Suppression effectuée"),
        error: tr("Erreur lors de la suppression"),
      }
    );
  };

  const handleBulkSuspend = () => {
    const reason = window.prompt(
      tr("Veuillez saisir le motif de la suspension pour ces comptes :"),
      "Suspension administrative"
    );
    if (reason !== null && reason.trim()) {
      executeBulkAction("suspend", { reason: reason.trim() });
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveRole(row, roleName);
                }}
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

  const allPageIds = users.map((u) => u.id);
  const isAllPageSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedUserIds.includes(id));

  const columns = [
    {
      header: (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            ref={headerCheckboxRef}
            checked={isAllPageSelected}
            onChange={toggleSelectAllPage}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900"
            aria-label={tr("Sélectionner tous les utilisateurs")}
          />
        </div>
      ),
      accessor: "select",
      align: "center",
      render: (row) => (
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedUserIds.includes(row.id)}
            onChange={() => toggleSelectUser(row.id)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900"
            aria-label={`${tr("Sélectionner")} ${row.first_name} ${row.last_name}`}
          />
        </div>
      ),
    },
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
          <button
            type="button"
            onClick={() => setDetailsUserId(row.id)}
            className="text-start font-medium text-slate-900 hover:text-primary-600 dark:text-slate-100 dark:hover:text-primary-400"
          >
            {row.first_name} {row.last_name}
          </button>
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
    {
      header: tr("Actions"),
      accessor: "actions",
      align: "center",
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="secondary"
            size="sm"
            icon={EyeIcon}
            onClick={() => setDetailsUserId(row.id)}
            aria-label={`${tr("Détails")} ${row.first_name}`}
          >
            {tr("Détails")}
          </Button>
        </div>
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

      {/* Floating / Sticky Bulk Action Bar */}
      {selectedUserIds.length > 0 && (
        <aside
          aria-label={tr("Actions groupées")}
          className="sticky bottom-4 z-40 rounded-2xl border border-primary-200 bg-white/95 p-4 shadow-xl backdrop-blur-md transition-all sm:p-5 dark:border-primary-900/40 dark:bg-slate-900/95"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between" dir={isRtl ? "rtl" : "ltr"}>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 font-bold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
                {selectedUserIds.length}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {selectedUserIds.length > 1
                    ? `${selectedUserIds.length} ${tr("utilisateurs sélectionnés")}`
                    : `1 ${tr("utilisateur sélectionné")}`}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {tr("Appliquez une action immédiate à l'ensemble de la sélection.")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Role Actions Popover / Dropdown */}
              <div className="relative">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ShieldCheckIcon}
                  disabled={bulkActionLoading}
                  onClick={() => {
                    setBulkActionType("assign");
                    setShowBulkRoleMenu((v) => !v);
                  }}
                >
                  {tr("Attribuer un rôle")}
                </Button>
                {showBulkRoleMenu && (
                  <div className="absolute bottom-full mb-2 left-0 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                    <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {bulkActionType === "assign" ? tr("Attribuer le rôle") : tr("Retirer le rôle")}
                    </p>
                    {BULK_ROLES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          executeBulkAction(bulkActionType === "assign" ? "assign_role" : "remove_role", {
                            role: r,
                          });
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <span>{getRoleLabel(r, tr)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={XMarkIcon}
                disabled={bulkActionLoading}
                onClick={() => {
                  setBulkActionType("remove");
                  setShowBulkRoleMenu((v) => !v);
                }}
              >
                {tr("Retirer un rôle")}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                icon={CheckIcon}
                disabled={bulkActionLoading}
                onClick={() => executeBulkAction("approve")}
              >
                {tr("Approuver")}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                icon={NoSymbolIcon}
                disabled={bulkActionLoading}
                onClick={handleBulkSuspend}
              >
                {tr("Suspendre")}
              </Button>

              <Button
                variant="danger"
                size="sm"
                icon={TrashIcon}
                disabled={bulkActionLoading}
                onClick={handleBulkDelete}
              >
                {tr("Supprimer")}
              </Button>

              <button
                type="button"
                onClick={() => setSelectedUserIds([])}
                disabled={bulkActionLoading}
                className="ml-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {tr("Désélectionner tout")}
              </button>
            </div>
          </div>
        </aside>
      )}

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

            {/* Mobile Card Layout */}
            <div className="space-y-3 md:hidden">
              {users.length ? (
                users.map((row) => (
                  <article
                    key={row.id}
                    className={`rounded-xl border p-4 transition-colors ${
                      selectedUserIds.includes(row.id)
                        ? "border-primary-300 bg-primary-50/30 dark:border-primary-800 dark:bg-primary-950/20"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(row.id)}
                          onChange={() => toggleSelectUser(row.id)}
                          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900"
                          aria-label={`${tr("Sélectionner")} ${row.first_name}`}
                        />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setDetailsUserId(row.id)}
                            className="truncate text-start font-semibold text-slate-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
                          >
                            {row.first_name} {row.last_name}
                          </button>
                          <a
                            href={`mailto:${row.email}`}
                            className="mt-0.5 block truncate text-sm text-primary-600 dark:text-primary-400"
                          >
                            {row.email}
                          </a>
                        </div>
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
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <div>
                        <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                          {tr("Rôles attribués")}
                        </p>
                        {roleBadges(row, true)}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={EyeIcon}
                        onClick={() => setDetailsUserId(row.id)}
                      >
                        {tr("Détails")}
                      </Button>
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

      {/* User Details Slide-over / Modal */}
      {detailsUserId && (
        <UserDetailsModal
          isOpen={Boolean(detailsUserId)}
          onClose={() => setDetailsUserId(null)}
          userId={detailsUserId}
          currentUser={currentUser}
          totalAdmins={meta.counts.admins}
          onUserUpdated={() => setRefreshKey((k) => k + 1)}
        />
      )}
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
