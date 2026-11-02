import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import * as assetsApi from "../api/assets";
import type { Asset, AssetInput, AssetQuery } from "../types/asset";
import AssetFilters from "../components/assets/AssetFilters";
import AssetTable from "../components/assets/AssetTable";
import AssetFormDialog from "../components/assets/AssetFormDialog";
import ConfirmDialog from "../components/assets/ConfirmDialog";

const PAGE_SIZE = 10;

/** Debounce a rapidly-changing value (used for the search input). */
function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** Asset Inventory page — table, search, filters, pagination, CRUD dialogs. */
export default function Assets() {
  // Query state drives the API call
  const [query, setQuery] = useState<AssetQuery>({
    sort_by: "created_at",
    sort_order: "desc",
    page: 1,
    page_size: PAGE_SIZE,
  });
  const debouncedSearch = useDebounced(query.search ?? "");

  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [deleting, setDeleting] = useState<Asset | null>(null);

  // Fetch whenever any effective query parameter changes
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await assetsApi.listAssets({ ...query, search: debouncedSearch });
      setAssets(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      setError("Failed to load assets. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [query, debouncedSearch]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Merge a partial query patch; any change except paging resets to page 1
  const patchQuery = (patch: Partial<AssetQuery>) =>
    setQuery((q) => ({ ...q, ...patch, page: "page" in patch ? patch.page! : 1 }));

  // Toggle sort direction when the same column is clicked again
  const handleSort = (field: "name" | "risk") =>
    setQuery((q) => ({
      ...q,
      sort_by: field,
      sort_order: q.sort_by === field && q.sort_order === "asc" ? "desc" : "asc",
      page: 1,
    }));

  const handleCreate = async (input: AssetInput) => {
    await assetsApi.createAsset(input);
    await fetchAssets();
  };

  const handleUpdate = async (input: AssetInput) => {
    if (!editing) return;
    await assetsApi.updateAsset(editing.id, input);
    await fetchAssets();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await assetsApi.deleteAsset(deleting.id);
    setDeleting(null);
    await fetchAssets();
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (asset: Asset) => {
    setEditing(asset);
    setFormOpen(true);
  };

  const rangeLabel = useMemo(() => {
    if (total === 0) return "0 assets";
    const start = (query.page! - 1) * PAGE_SIZE + 1;
    const end = Math.min(query.page! * PAGE_SIZE, total);
    return `${start}–${end} of ${total} assets`;
  }, [query.page, total]);

  return (
    <div className="space-y-4">
      {/* Header + add button */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Asset Inventory</h2>
          <p className="text-sm text-slate-500">{rangeLabel}</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Add Asset
        </button>
      </div>

      <AssetFilters query={query} onChange={patchQuery} />

      {error && (
        <p className="text-sm text-severity-critical bg-severity-critical/10 border border-severity-critical/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <AssetTable
        assets={assets}
        loading={loading}
        sortBy={query.sort_by}
        sortOrder={query.sort_order}
        onSort={handleSort}
        onEdit={openEdit}
        onDelete={setDeleting}
      />

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Page {query.page} of {pages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => patchQuery({ page: query.page! - 1 })}
              disabled={query.page! <= 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-surface-800 border border-surface-600/50 text-slate-300 hover:bg-surface-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={() => patchQuery({ page: query.page! + 1 })}
              disabled={query.page! >= pages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-surface-800 border border-surface-600/50 text-slate-300 hover:bg-surface-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit dialog */}
      <AssetFormDialog
        open={formOpen}
        asset={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleting}
        title="Delete Asset"
        message={`Delete "${deleting?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
