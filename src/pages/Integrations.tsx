import { useEffect, useState, type FormEvent } from "react";
import {
  Code2,
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Webhook,
  FileCode,
  AlertCircle,
  CheckCircle2,
  Cpu,
} from "lucide-react";
import {
  listApiKeys,
  createApiKey,
  revokeApiKey,
  getWebhook,
  updateWebhook,
  type ApiKeyItem,
  type ApiKeyCreatedResult,
} from "../api/integrations";
import { useTenantId } from "../lib/useTenantId";
import { apiErrorText } from "../lib/apiError";
import { formatDate } from "../lib/format";
import {
  GlassButton,
  GlassCard,
  GlassInput,
  GlassModal,
} from "../components/kit";
import { Spinner } from "../components/ui";

export function IntegrationsPage() {
  const tenantId = useTenantId();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New Key Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [keyName, setKeyName] = useState("1C Anbar Sinxronizasiyası");
  const [creating, setCreating] = useState(false);

  // Created Key Revealed Modal
  const [revealedKey, setRevealedKey] = useState<ApiKeyCreatedResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Webhook State
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);

  // Code sample tab
  const [codeTab, setCodeTab] = useState<"1c" | "curl" | "python" | "node">("1c");

  const loadData = async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [keysData, webhookData] = await Promise.all([
        listApiKeys(tenantId),
        getWebhook(tenantId),
      ]);
      setKeys(keysData);
      if (webhookData) {
        setWebhookUrl(webhookData.url);
      }
    } catch (e) {
      setError(apiErrorText(e, "İnteqrasiya məlumatları yüklənərkən xəta baş verdi"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [tenantId]);

  // Handle Create API Key
  const handleCreateKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenantId || !keyName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      const result = await createApiKey(tenantId, { name: keyName });
      setRevealedKey(result);
      setCreateModalOpen(false);
      setKeyName("");
      await loadData();
    } catch (err) {
      setError(apiErrorText(err, "API açarı yaradılarkən xəta baş verdi"));
    } finally {
      setCreating(false);
    }
  };

  // Handle Revoke Key
  const handleRevoke = async (key: ApiKeyItem) => {
    if (!tenantId) return;
    if (!confirm(`"${key.name}" API açarı ləğv edilsin? Bu açarla işləyən 1C/ERP sorğuları dərhal dayandırılacaq.`)) return;

    try {
      await revokeApiKey(tenantId, key.id);
      setKeys((prev) => prev.filter((k) => k.id !== key.id));
      setSuccess(`"${key.name}" açarı ləğv edildi`);
    } catch (err) {
      setError(apiErrorText(err, "Açar ləğv edilərkən xəta baş verdi"));
    }
  };

  // Handle Save Webhook
  const handleSaveWebhook = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenantId || !webhookUrl.trim()) return;

    setSavingWebhook(true);
    setError(null);
    setSuccess(null);
    try {
      await updateWebhook(tenantId, {
        url: webhookUrl,
        secret: webhookSecret || undefined,
        active: true,
      });
      setSuccess("Webhook sazlamaları uğurla yadda saxlanıldı!");
    } catch (err) {
      setError(apiErrorText(err, "Webhook yadda saxlanılarkən xəta baş verdi"));
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleApiKey = keys[0]?.keyPrefix ? `${keys[0].keyPrefix.replace("...", "")}xxxx...` : "vk_live_your_api_key_here";

  return (
    <div className="space-y-8 pb-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a0a0a] text-[#39ff14]">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0a0a0a]">
              İnteqrasiyalar və Açıq REST API
            </h1>
            <p className="text-xs sm:text-sm text-[#6b6b6b]">
              1C:Müəssisə, ERP, CRM və ya vebsaytınızı Voint ilə birləşdirin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="http://localhost:8080/swagger-ui.html"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e5e5e5] bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-[#0a0a0a] shadow-sm hover:bg-[#f5f5f5] transition-all"
          >
            <FileCode className="h-4 w-4 text-[#6b6b6b]" />
            <span>OpenAPI / Swagger Sənədləri</span>
            <ExternalLink className="h-3 w-3 text-[#9e9e9e]" />
          </a>
          <GlassButton onClick={() => setCreateModalOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Yeni API Açarı</span>
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
      {success && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs sm:text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ── 1. API KEYS SECTION ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-[#0a0a0a]" />
            <h2 className="text-sm sm:text-base font-bold text-[#0a0a0a]">Xarici API Açarları (API Keys)</h2>
          </div>
          <span className="text-xs text-[#6b6b6b]">{keys.length} aktiv açar</span>
        </div>

        <GlassCard className="overflow-hidden border border-[#e5e5e5]">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner />
            </div>
          ) : keys.length === 0 ? (
            <div className="p-8 text-center">
              <Key className="mx-auto h-8 w-8 text-[#9e9e9e]" />
              <p className="mt-2 text-xs sm:text-sm font-semibold text-[#0a0a0a]">Hələ heç bir API açarı yaradılmayıb</p>
              <p className="mt-0.5 text-xs text-[#6b6b6b]">1C və ya ERP sisteminizi bağlamaq üçün ilk açarınızı yaradın.</p>
              <GlassButton onClick={() => setCreateModalOpen(true)} className="mt-3 gap-1.5">
                <Plus className="h-4 w-4" />
                <span>API Açarı Yarat</span>
              </GlassButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-[#e5e5e5] bg-[#fafafa] text-[#6b6b6b] font-medium">
                  <tr>
                    <th className="px-4 py-3">Açarın Adı</th>
                    <th className="px-4 py-3">Açar Prefiksi</th>
                    <th className="px-4 py-3">İcazələr</th>
                    <th className="px-4 py-3">Son İstifadə</th>
                    <th className="px-4 py-3">Yaradılma Tarixi</th>
                    <th className="px-4 py-3 text-right">Ləğv Et</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0]">
                  {keys.map((key) => (
                    <tr key={key.id} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3.5 font-semibold text-[#0a0a0a]">{key.name}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-[#6b6b6b]">{key.keyPrefix}</td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-lg bg-[#f0f0f0] px-2 py-0.5 text-[11px] font-medium text-[#404040]">
                          {key.permissions}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#6b6b6b]">
                        {key.lastUsedAt ? formatDate(key.lastUsedAt) : "Heç istifadə edilməyib"}
                      </td>
                      <td className="px-4 py-3.5 text-[#6b6b6b]">{formatDate(key.createdAt)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleRevoke(key)}
                          className="rounded-lg p-1.5 text-[#6b6b6b] hover:bg-red-50 hover:text-red-600 transition-all"
                          title="Açarı ləğv et"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>

      {/* ── 2. 1C & CODE SAMPLES ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-[#0a0a0a]" />
            <h2 className="text-sm sm:text-base font-bold text-[#0a0a0a]">1C:Müəssisə və Proqramlaşdırma Kod Nümunələri</h2>
          </div>

          <div className="flex rounded-xl border border-[#e5e5e5] bg-[#f5f5f5] p-1 text-xs">
            <button
              onClick={() => setCodeTab("1c")}
              className={`rounded-lg px-3 py-1 font-medium transition-all ${
                codeTab === "1c" ? "bg-white text-[#0a0a0a] shadow-sm" : "text-[#6b6b6b] hover:text-[#0a0a0a]"
              }`}
            >
              1C:Müəssisə (BSL)
            </button>
            <button
              onClick={() => setCodeTab("curl")}
              className={`rounded-lg px-3 py-1 font-medium transition-all ${
                codeTab === "curl" ? "bg-white text-[#0a0a0a] shadow-sm" : "text-[#6b6b6b] hover:text-[#0a0a0a]"
              }`}
            >
              cURL (Terminal)
            </button>
            <button
              onClick={() => setCodeTab("python")}
              className={`rounded-lg px-3 py-1 font-medium transition-all ${
                codeTab === "python" ? "bg-white text-[#0a0a0a] shadow-sm" : "text-[#6b6b6b] hover:text-[#0a0a0a]"
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setCodeTab("node")}
              className={`rounded-lg px-3 py-1 font-medium transition-all ${
                codeTab === "node" ? "bg-white text-[#0a0a0a] shadow-sm" : "text-[#6b6b6b] hover:text-[#0a0a0a]"
              }`}
            >
              Node.js
            </button>
          </div>
        </div>

        <GlassCard className="p-5 bg-[#0d0d0d] text-white border-black">
          <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-[#888] font-mono ml-2">
                {codeTab === "1c" && "1C_Catalog_Sync.bsl"}
                {codeTab === "curl" && "sync_catalog.sh"}
                {codeTab === "python" && "voint_sync.py"}
                {codeTab === "node" && "voint_sync.js"}
              </span>
            </div>
            <button
              onClick={() => {
                const code =
                  codeTab === "1c"
                    ? code1C(sampleApiKey)
                    : codeTab === "curl"
                    ? codeCurl(sampleApiKey)
                    : codeTab === "python"
                    ? codePython(sampleApiKey)
                    : codeNode(sampleApiKey);
                handleCopy(code);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-[#262626] px-2.5 py-1 text-xs text-[#ddd] hover:bg-[#333] transition-all"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[#39ff14]" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Kopyalandı!" : "Kodu Kopyala"}</span>
            </button>
          </div>

          <pre className="mt-4 overflow-x-auto text-xs font-mono leading-relaxed text-[#e0e0e0]">
            {codeTab === "1c" && code1C(sampleApiKey)}
            {codeTab === "curl" && codeCurl(sampleApiKey)}
            {codeTab === "python" && codePython(sampleApiKey)}
            {codeTab === "node" && codeNode(sampleApiKey)}
          </pre>
        </GlassCard>
      </div>

      {/* ── 3. REALTIME WEBHOOK SETTINGS ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Webhook className="h-4 w-4 text-[#0a0a0a]" />
          <h2 className="text-sm sm:text-base font-bold text-[#0a0a0a]">Canlı Webhook və Hadisələr</h2>
        </div>

        <GlassCard className="p-5">
          <form onSubmit={handleSaveWebhook} className="space-y-4 max-w-2xl">
            <p className="text-xs text-[#6b6b6b]">
              AI zəng əsnasında müştəri stok və ya mövcudluq soruşanda, Voint avtomatik sizin göstərdiyiniz URL-ə sorğu göndərərək real-vaxt cavabını alır.
            </p>

            <div>
              <label className="text-xs font-semibold text-[#0a0a0a]">Sizin Serverin Webhook URL-i</label>
              <GlassInput
                placeholder="https://api.shirketiniz.az/v1/voint-webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="mt-1 font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0a0a0a]">Webhook Secret (İstəyə bağlı təhlükəsizlik açarı)</label>
              <GlassInput
                type="password"
                placeholder="••••••••••••••••"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="mt-1 font-mono text-xs"
              />
            </div>

            <div className="pt-2">
              <GlassButton type="submit" disabled={savingWebhook} className="gap-1.5">
                <Check className="h-4 w-4" />
                <span>Webhook Sazlamalarını Yadda Saxla</span>
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      </div>

      {/* ── CREATE KEY MODAL ── */}
      <GlassModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Yeni 1C / ERP API Açarı Yarat"
      >
        <form onSubmit={handleCreateKey} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#0a0a0a]">Açarın Adı və ya Məqsədi *</label>
            <GlassInput
              required
              placeholder="Məs: 1C Əsas Anbar Sinxronizasiyası"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="mt-1"
            />
            <p className="mt-1 text-[11px] text-[#6b6b6b]">
              Bu açarla xarici sisteminiz məhsul qiymətlərini və stok qalıqlarını avtomatik yeniləyə biləcək.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#e5e5e5]">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-xl border border-[#e5e5e5] bg-white px-4 py-2 text-xs sm:text-sm font-medium text-[#6b6b6b] hover:bg-[#f5f5f5]"
            >
              Ləğv et
            </button>
            <GlassButton type="submit" disabled={creating} className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span>Açarı Yarat</span>
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* ── REVEALED KEY MODAL (SHOWN ONCE) ── */}
      <GlassModal
        isOpen={!!revealedKey}
        onClose={() => setRevealedKey(null)}
        title="🎉 Yeni API Açarı Yaradıldı!"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
            <strong>Diqqət:</strong> Bu açarı indi kopyalayın və təhlükəsiz yerdə saxlayın. Təhlükəsizlik qaydalarına görə bu açar bir daha tam şəkildə ekranda göstərilməyəcək.
          </div>

          <div>
            <label className="text-xs font-semibold text-[#0a0a0a]">Xarici API Açarı (Bearer Token)</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                readOnly
                value={revealedKey?.rawApiKey || ""}
                className="w-full rounded-xl border border-[#e5e5e5] bg-[#fafafa] p-2.5 font-mono text-xs text-[#0a0a0a] select-all"
              />
              <button
                onClick={() => revealedKey && handleCopy(revealedKey.rawApiKey)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0a0a0a] px-3.5 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-[#262626] transition-all"
              >
                {copied ? <Check className="h-4 w-4 text-[#39ff14]" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Kopyalandı!" : "Kopyala"}</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#e5e5e5]">
            <GlassButton onClick={() => setRevealedKey(null)}>
              <span>Açarı Kopyaladım, Bağla</span>
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}

function code1C(apiKey: string): string {
  return `// 1C:Müəssisə (BSL) - Voint Kataloq Sinxronizasiyası
ServerUnvani = "panel.voint.az";
HTTPBaglanti = Yeni HTTPBaglanti(ServerUnvani, 443,,,, 30, Yeni FunksiyaTəhlükəsizliyi());

Basliqlar = Yeni Map;
Basliqlar.Insert("X-Voint-Api-Key", "${apiKey}");
Basliqlar.Insert("Content-Type", "application/json; charset=utf-8");

// Göndəriləcək məhsul məlumatları
JSONYazici = Yeni JSONYazici;
JSONYazici.SetString();

Elementler = Yeni Massiv;
Element = Yeni Map;
Element.Insert("sku", "JCB-3CX");
Element.Insert("name", "JCB 3CX Ekskavator-Yükləyici");
Element.Insert("category", "Tikinti Texnikası");
Element.Insert("priceDaily", 350.00);
Element.Insert("priceMonthly", 7500.00);
Element.Insert("deposit", 500.00);
Element.Insert("inStock", True);
Element.Insert("stockQuantity", 2);
Elementler.Add(Element);

Govde = Yeni Map;
Govde.Insert("replaceAll", False);
Govde.Insert("items", Elementler);

WriteJSON(JSONYazici, Govde);
JSONMetn = JSONYazici.Close();

HTTPSorqu = Yeni HTTPSorqu("/api/v1/external/catalog/bulk-sync", Basliqlar);
HTTPSorqu.SetBodyFromString(JSONMetn, TextEncoding.UTF8);

Cavab = HTTPBaglanti.Post(HTTPSorqu);
Message("Status: " + String(Cavab.StatusCode));`;
}

function codeCurl(apiKey: string): string {
  return `# Tək məhsul əlavə et və ya qiymətini yenilə (Upsert)
curl -X POST https://panel.voint.az/api/v1/external/catalog/items \\
  -H "X-Voint-Api-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sku": "JCB-3CX",
    "name": "JCB 3CX Ekskavator-Yükləyici",
    "category": "Tikinti Texnikası",
    "priceDaily": 350.00,
    "priceMonthly": 7500.00,
    "deposit": 500.00,
    "inStock": true,
    "stockQuantity": 2,
    "specs": "Çalov: 1.0 m³, Dərinlik: 4.24 m"
  }'

# 1C / ERP-dən toplu sinxronizasiya (Bulk Sync)
curl -X POST https://panel.voint.az/api/v1/external/catalog/bulk-sync \\
  -H "X-Voint-Api-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "replaceAll": false,
    "items": [
      {
        "sku": "CAT-320",
        "name": "CAT 320 Paletli Ekskavator",
        "category": "Ekskavatorlar",
        "priceDaily": 600.00,
        "deposit": 1000.00,
        "inStock": true
      }
    ]
  }'`;
}

function codePython(apiKey: string): string {
  return `import requests

API_KEY = "${apiKey}"
BASE_URL = "https://panel.voint.az/api/v1/external"

headers = {
    "X-Voint-Api-Key": API_KEY,
    "Content-Type": "application/json"
}

# 1C/Anbar bazasından məhsulları Voint-ə göndər
payload = {
    "replaceAll": False,
    "items": [
        {
            "sku": "JCB-3CX",
            "name": "JCB 3CX Ekskavator-Yükləyici",
            "category": "Tikinti Texnikası",
            "priceDaily": 350.0,
            "priceMonthly": 7500.0,
            "deposit": 500.0,
            "inStock": True,
            "stockQuantity": 3
        }
    ]
}

resp = requests.post(f"{BASE_URL}/catalog/bulk-sync", json=payload, headers=headers)
print("Status:", resp.status_code)
print("Nəticə:", resp.json())`;
}

function codeNode(apiKey: string): string {
  return `const axios = require('axios');

const API_KEY = '${apiKey}';
const BASE_URL = 'https://panel.voint.az/api/v1/external';

async function syncCatalog() {
  const response = await axios.post(
    \`\${BASE_URL}/catalog/items\`,
    {
      sku: 'JCB-3CX',
      name: 'JCB 3CX Ekskavator-Yükləyici',
      category: 'Tikinti Texnikası',
      priceDaily: 350,
      inStock: true
    },
    {
      headers: {
        'X-Voint-Api-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );
  console.log('Cavab:', response.data);
}

syncCatalog();`;
}
