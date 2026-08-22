import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Plus,
  Search,
  Upload,
  Trash2,
  Edit2,
  CheckCircle2,
  Check,
  AlertCircle,
  Package,
} from "lucide-react";
import {
  getCatalogItems,
  createCatalogItem,
  updateCatalogItem,
  updateCatalogItemStock,
  deleteCatalogItem,
  uploadCatalogFile,
  type CatalogItem,
  type CatalogItemInput,
} from "../api/catalog";
import { useTenantId } from "../lib/useTenantId";
import { useTenantStore } from "../store/tenant";
import { getIndustryConfig } from "../lib/industryConfig";
import { apiErrorText } from "../lib/apiError";
import {
  GlassButton,
  GlassCard,
  GlassInput,
  GlassTextarea,
  GlassModal,
} from "../components/kit";
import { Spinner } from "../components/ui";

export function CatalogPage() {
  const tenantId = useTenantId();
  const { tenant, loadTenant } = useTenantStore();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Industry Configuration for this tenant
  const industryMeta = useMemo(() => {
    return getIndustryConfig(tenant?.industry);
  }, [tenant?.industry]);

  const HeaderIcon = industryMeta.icon;

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState<CatalogItemInput>({
    sku: "",
    name: "",
    category: "Ümumi",
    itemType: industryMeta.industry === "RENTAL" ? "RENTAL" : industryMeta.industry === "RESTAURANT" ? "FOOD_DRINK" : industryMeta.industry === "RETAIL" ? "PRODUCT" : "SERVICE",
    price: null,
    priceDaily: null,
    priceMonthly: null,
    deposit: null,
    currency: "AZN",
    unit: industryMeta.defaultUnit,
    durationMinutes: industryMeta.showDurationField ? 30 : null,
    inStock: true,
    stockQuantity: 1,
    specs: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const loadCatalog = async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      if (!tenant) {
        await loadTenant(tenantId);
      }
      const data = await getCatalogItems(tenantId);
      setItems(data);
    } catch (e) {
      setError(apiErrorText(e, "Kataloq yüklənərkən xəta baş verdi"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalog();
  }, [tenantId]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        search === "" ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(search.toLowerCase())) ||
        (item.specs && item.specs.toLowerCase().includes(search.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(search.toLowerCase()));

      const matchCategory = selectedCategory === "ALL" || item.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [items, search, selectedCategory]);

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const inStock = items.filter((i) => i.inStock).length;
    const outOfStock = items.filter((i) => !i.inStock).length;
    return { total, inStock, outOfStock, categoriesCount: categories.length };
  }, [items, categories]);

  // Handle Quick Stock / Availability Toggle
  const handleToggleStock = async (item: CatalogItem) => {
    if (!tenantId) return;
    const newStock = !item.inStock;
    try {
      await updateCatalogItemStock(tenantId, item.id, { inStock: newStock });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, inStock: newStock } : i))
      );
    } catch (e) {
      setError(apiErrorText(e, "Vəziyyət dəyişdirilə bilmədi"));
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      sku: "",
      name: "",
      category: categories[0] || "Əsas",
      itemType: industryMeta.industry === "RENTAL" ? "RENTAL" : industryMeta.industry === "RESTAURANT" ? "FOOD_DRINK" : industryMeta.industry === "RETAIL" ? "PRODUCT" : "SERVICE",
      price: null,
      priceDaily: null,
      priceMonthly: null,
      deposit: null,
      currency: "AZN",
      unit: industryMeta.defaultUnit,
      durationMinutes: industryMeta.showDurationField ? 30 : null,
      inStock: true,
      stockQuantity: 1,
      specs: "",
      description: "",
    });
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setForm({
      sku: item.sku || "",
      name: item.name,
      category: item.category || "Ümumi",
      itemType: item.itemType || (industryMeta.industry === "RENTAL" ? "RENTAL" : "SERVICE"),
      price: item.price ?? item.priceDaily,
      priceDaily: item.priceDaily,
      priceMonthly: item.priceMonthly,
      deposit: item.deposit,
      currency: item.currency || "AZN",
      unit: item.unit || industryMeta.defaultUnit,
      durationMinutes: item.durationMinutes,
      inStock: item.inStock,
      stockQuantity: item.stockQuantity,
      specs: item.specs || "",
      description: item.description || "",
    });
    setModalOpen(true);
  };

  // Save Item
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenantId || !form.name.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const payload: CatalogItemInput = {
        ...form,
        itemType: industryMeta.industry === "RENTAL" ? "RENTAL" : industryMeta.industry === "RESTAURANT" ? "FOOD_DRINK" : industryMeta.industry === "RETAIL" ? "PRODUCT" : "SERVICE",
        priceDaily: industryMeta.showRentalFields ? (form.priceDaily ?? form.price) : form.priceDaily,
      };

      if (editingItem) {
        const updated = await updateCatalogItem(tenantId, editingItem.id, payload);
        setItems((prev) => prev.map((i) => (i.id === editingItem.id ? updated : i)));
      } else {
        const created = await createCatalogItem(tenantId, payload);
        setItems((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setError(apiErrorText(err, "Yadda saxlanılarkən xəta baş verdi"));
    } finally {
      setSaving(false);
    }
  };

  // Delete Item
  const handleDelete = async (item: CatalogItem) => {
    if (!tenantId) return;
    if (!confirm(`"${item.name}" kataloqdan silinsin?`)) return;

    try {
      await deleteCatalogItem(tenantId, item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      setError(apiErrorText(err, "Silinərkən xəta baş verdi"));
    }
  };

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;

    setUploading(true);
    setError(null);
    setUploadSuccess(null);
    try {
      const imported = await uploadCatalogFile(tenantId, file);
      setUploadSuccess(`"${file.name}" faylından ${imported.length} mövqe uğurla əlavə edildi!`);
      await loadCatalog();
    } catch (err) {
      setError(apiErrorText(err, "Fayl import edilərkən xəta baş verdi"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── HEADER (Tailored to Tenant Industry) ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a0a0a] text-[#39ff14]">
              <HeaderIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0a0a0a]">
                {industryMeta.catalogTitle}
              </h1>
              <p className="text-xs sm:text-sm text-[#6b6b6b]">
                {industryMeta.catalogSubtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Upload File Button */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.pdf,.docx,.txt"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#e5e5e5] bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-[#0a0a0a] shadow-sm hover:bg-[#f5f5f5] transition-all">
              {uploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  <span>Fayl oxunur...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 text-[#6b6b6b]" />
                  <span>Fayldan Yüklə (Excel, PDF, CSV)</span>
                </>
              )}
            </div>
          </label>

          {/* Add Item Button */}
          <GlassButton onClick={handleOpenAdd} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>{industryMeta.newItemButtonText}</span>
          </GlassButton>
        </div>
      </div>

      {/* ── ALERTS ── */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs sm:text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {uploadSuccess && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs sm:text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <GlassCard className="p-4">
          <span className="text-xs font-medium text-[#6b6b6b]">Ümumi Say</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0a0a0a]">{stats.total}</span>
            <span className="text-xs text-[#6b6b6b]">mövqe</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <span className="text-xs font-medium text-[#6b6b6b]">{industryMeta.statusAvailable}</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{stats.inStock}</span>
            <span className="text-xs text-emerald-600">aktiv</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <span className="text-xs font-medium text-[#6b6b6b]">{industryMeta.statusUnavailable}</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{stats.outOfStock}</span>
            <span className="text-xs text-amber-600">passiv</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <span className="text-xs font-medium text-[#6b6b6b]">Kateqoriyalar</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0a0a0a]">{stats.categoriesCount}</span>
            <span className="text-xs text-[#6b6b6b]">bölmə</span>
          </div>
        </GlassCard>
      </div>

      {/* ── SEARCH & CATEGORY FILTER ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e9e9e]" />
          <input
            type="text"
            placeholder="Axtarış edin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#e5e5e5] bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-[#0a0a0a] placeholder-[#9e9e9e] focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
              selectedCategory === "ALL"
                ? "bg-[#0a0a0a] text-white shadow-sm"
                : "border border-[#e5e5e5] bg-white text-[#6b6b6b] hover:bg-[#f5f5f5]"
            }`}
          >
            Hamısı ({items.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-[#0a0a0a] text-white shadow-sm"
                  : "border border-[#e5e5e5] bg-white text-[#6b6b6b] hover:bg-[#f5f5f5]"
              }`}
            >
              {cat} ({items.filter((i) => i.category === cat).length})
            </button>
          ))}
        </div>
      </div>

      {/* ── CATALOG TABLE (Industry-Tailored) ── */}
      <GlassCard className="overflow-hidden border border-[#e5e5e5]">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f5f5] text-[#9e9e9e]">
              <Package className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[#0a0a0a]">{industryMeta.emptyStateTitle}</h3>
            <p className="mt-1 text-xs text-[#6b6b6b] max-w-sm">
              {industryMeta.emptyStateText}
            </p>
            <GlassButton onClick={handleOpenAdd} className="mt-4 gap-1.5">
              <Plus className="h-4 w-4" />
              <span>{industryMeta.newItemButtonText}</span>
            </GlassButton>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-[#e5e5e5] bg-[#fafafa] text-[#6b6b6b] font-medium">
                <tr>
                  <th className="px-4 py-3">Ad və Təsvir</th>
                  <th className="px-4 py-3">Bölmə</th>
                  <th className="px-4 py-3">{industryMeta.priceLabel.replace(" *", "")}</th>
                  {industryMeta.showDurationField && <th className="px-4 py-3">Müddət</th>}
                  {industryMeta.showRentalFields && <th className="px-4 py-3">Aylıq / Depozit</th>}
                  <th className="px-4 py-3">Vəziyyət / Status</th>
                  <th className="px-4 py-3 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {filteredItems.map((item) => {
                  const displayPrice = item.price ?? item.priceDaily;

                  return (
                    <tr key={item.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-[#0a0a0a]">{item.name}</div>
                        <div className="flex items-center gap-2 text-[11px] text-[#6b6b6b] mt-0.5">
                          {item.sku && <span className="font-mono bg-[#f0f0f0] px-1.5 py-0.5 rounded text-[10px]">Kod: {item.sku}</span>}
                          {item.specs && <span className="truncate max-w-xs">{item.specs}</span>}
                          {item.description && !item.specs && <span className="truncate max-w-xs">{item.description}</span>}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-lg bg-[#f0f0f0] px-2 py-0.5 text-xs font-medium text-[#404040]">
                          {item.category || "Əsas"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-medium text-[#0a0a0a]">
                        {displayPrice != null ? (
                          <div>
                            <span className="text-sm font-bold text-[#0a0a0a]">{displayPrice} {item.currency || "AZN"}</span>
                            <span className="text-xs text-[#6b6b6b]"> / {item.unit || industryMeta.defaultUnit}</span>
                          </div>
                        ) : "-"}
                      </td>

                      {industryMeta.showDurationField && (
                        <td className="px-4 py-3.5 text-[#6b6b6b]">
                          {item.durationMinutes != null ? (
                            <span className="font-medium text-[#0a0a0a]">⏱️ {item.durationMinutes} dəqiqə</span>
                          ) : "-"}
                        </td>
                      )}

                      {industryMeta.showRentalFields && (
                        <td className="px-4 py-3.5 text-[#6b6b6b]">
                          <div>
                            {item.priceMonthly != null && <div>Aylıq: {item.priceMonthly} AZN</div>}
                            {item.deposit != null && <div className="text-[11px] text-[#888]">Depozit: {item.deposit} AZN</div>}
                            {!item.priceMonthly && !item.deposit && "-"}
                          </div>
                        </td>
                      )}

                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleToggleStock(item)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                            item.inStock
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          }`}
                          title="Vəziyyəti dəyişmək üçün klikləyin"
                        >
                          {item.inStock ? (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span>{industryMeta.statusAvailable}</span>
                            </>
                          ) : (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              <span>{industryMeta.statusUnavailable}</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="rounded-lg p-1.5 text-[#6b6b6b] hover:bg-[#f0f0f0] hover:text-[#0a0a0a] transition-all"
                            title="Redaktə et"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="rounded-lg p-1.5 text-[#6b6b6b] hover:bg-red-50 hover:text-red-600 transition-all"
                            title="Sil"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* ── ADD / EDIT MODAL (Tailored to Tenant Industry) ── */}
      <GlassModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? "Məlumatları Redaktə Et" : industryMeta.newItemButtonText}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-[#0a0a0a]">{industryMeta.itemNameLabel}</label>
              <GlassInput
                required
                placeholder={industryMeta.itemNamePlaceholder}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0a0a0a]">{industryMeta.categoryLabel}</label>
              <GlassInput
                placeholder={industryMeta.categoryPlaceholder}
                value={form.category || ""}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0a0a0a]">Kod / SKU / Artikul (istəyə bağlı)</label>
              <GlassInput
                placeholder="Məs: KOD-01"
                value={form.sku || ""}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="mt-1 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0a0a0a]">{industryMeta.priceLabel}</label>
              <GlassInput
                type="number"
                step="0.01"
                required
                placeholder={industryMeta.pricePlaceholder}
                value={form.price ?? form.priceDaily ?? ""}
                onChange={(e) => {
                  const val = e.target.value ? parseFloat(e.target.value) : null;
                  setForm({ ...form, price: val, priceDaily: val });
                }}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0a0a0a]">{industryMeta.unitLabel}</label>
              <GlassInput
                placeholder={industryMeta.unitPlaceholder}
                value={form.unit || industryMeta.defaultUnit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Service / Clinic duration in minutes */}
            {industryMeta.showDurationField && (
              <div className="col-span-2">
                <label className="text-xs font-semibold text-[#0a0a0a]">{industryMeta.durationLabel}</label>
                <GlassInput
                  type="number"
                  placeholder="30"
                  value={form.durationMinutes ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, durationMinutes: e.target.value ? parseInt(e.target.value) : null })
                  }
                  className="mt-1"
                />
              </div>
            )}

            {/* Rental specific fields */}
            {industryMeta.showRentalFields && (
              <>
                <div>
                  <label className="text-xs font-semibold text-[#0a0a0a]">Aylıq Qiymət (AZN)</label>
                  <GlassInput
                    type="number"
                    step="0.01"
                    placeholder="7500"
                    value={form.priceMonthly ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, priceMonthly: e.target.value ? parseFloat(e.target.value) : null })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0a0a0a]">Depozit (AZN)</label>
                  <GlassInput
                    type="number"
                    step="0.01"
                    placeholder="500"
                    value={form.deposit ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, deposit: e.target.value ? parseFloat(e.target.value) : null })
                    }
                    className="mt-1"
                  />
                </div>
              </>
            )}

            {/* Stock Quantity for physical goods / rental */}
            {industryMeta.showStockQuantity && (
              <div className="col-span-2">
                <label className="text-xs font-semibold text-[#0a0a0a]">Mövcud Say</label>
                <GlassInput
                  type="number"
                  placeholder="1"
                  value={form.stockQuantity ?? 1}
                  onChange={(e) =>
                    setForm({ ...form, stockQuantity: parseInt(e.target.value) || 1 })
                  }
                  className="mt-1"
                />
              </div>
            )}

            <div className="col-span-2">
              <label className="text-xs font-semibold text-[#0a0a0a]">{industryMeta.specsLabel}</label>
              <GlassInput
                placeholder={industryMeta.specsPlaceholder}
                value={form.specs || ""}
                onChange={(e) => setForm({ ...form, specs: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-semibold text-[#0a0a0a]">Əlavə Təsvir / Qeydlər</label>
              <GlassTextarea
                placeholder="Şərtlər, qaydalar və ya əlavə məlumatlar..."
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="col-span-2 flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="inStockCheck"
                checked={form.inStock ?? true}
                onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                className="h-4 w-4 rounded border-[#e5e5e5] text-black focus:ring-black"
              />
              <label htmlFor="inStockCheck" className="text-xs font-medium text-[#0a0a0a] cursor-pointer">
                {industryMeta.statusAvailable}
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#e5e5e5]">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-[#e5e5e5] bg-white px-4 py-2 text-xs sm:text-sm font-medium text-[#6b6b6b] hover:bg-[#f5f5f5]"
            >
              Ləğv et
            </button>
            <GlassButton type="submit" disabled={saving} className="gap-1.5">
              <Check className="h-4 w-4" />
              <span>{editingItem ? "Yadda Saxla" : "Əlavə Et"}</span>
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
}
