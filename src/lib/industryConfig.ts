import type { TenantIndustry } from "../api/types";
import {
  Truck,
  Scissors,
  Utensils,
  HeartPulse,
  Wrench,
  ShoppingBag,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export interface IndustryMeta {
  industry: TenantIndustry;
  label: string;
  icon: LucideIcon;
  catalogTitle: string;
  catalogSubtitle: string;
  newItemButtonText: string;
  itemNameLabel: string;
  itemNamePlaceholder: string;
  categoryLabel: string;
  categoryPlaceholder: string;
  priceLabel: string;
  pricePlaceholder: string;
  unitLabel: string;
  defaultUnit: string;
  unitPlaceholder: string;
  durationLabel?: string;
  specsLabel: string;
  specsPlaceholder: string;
  statusAvailable: string;
  statusUnavailable: string;
  showRentalFields: boolean;
  showDurationField: boolean;
  showStockQuantity: boolean;
  emptyStateTitle: string;
  emptyStateText: string;
}

export const INDUSTRY_CONFIGS: Record<TenantIndustry, IndustryMeta> = {
  RENTAL: {
    industry: "RENTAL",
    label: "Ağır Tikinti Texnikası və İcarə",
    icon: Truck,
    catalogTitle: "Texnika və İcarə Parkı Kataloqu",
    catalogSubtitle: "Mövcud texnikalar, günlük və aylıq icarə qiymətləri və park vəziyyəti (AI zənglərdə bu məlumatlardan istifadə edir)",
    newItemButtonText: "Yeni Texnika Əlavə Et",
    itemNameLabel: "Texnika / Model Adı *",
    itemNamePlaceholder: "Məs: JCB 3CX Ekskavator-Yükləyici",
    categoryLabel: "Kateqoriya / Texnika Növü",
    categoryPlaceholder: "Məs: Ağır Tikinti Texnikası",
    priceLabel: "Günlük Qiymət (AZN) *",
    pricePlaceholder: "350.00",
    unitLabel: "İcarə Vahidi",
    defaultUnit: "gün",
    unitPlaceholder: "gün, saat, ay",
    specsLabel: "Texniki Parametrlər / Spesifikasiyalar",
    specsPlaceholder: "Məs: Çalov həcmi 1.0 m³, Qazma dərinliyi 4.24 m, Çəki: 8 ton",
    statusAvailable: "Mövcuddur (Parkda)",
    statusUnavailable: "İcarədədir / Məşğul",
    showRentalFields: true,
    showDurationField: false,
    showStockQuantity: true,
    emptyStateTitle: "Heç bir texnika tapılmadı",
    emptyStateText: "Excel və ya PDF qiymət cədvəli yükləyərək bütün parkı avtomatik əlavə edə bilərsiniz.",
  },

  BEAUTY_SALON: {
    industry: "BEAUTY_SALON",
    label: "Bərbər və Gözəllik Salonu",
    icon: Scissors,
    catalogTitle: "Xidmətlər və Qiymət Siyahısı",
    catalogSubtitle: "Göstərilən xidmətlər, qiymətlər və icra müddətləri (AI zənglərdə rezervasiya üçün bu məlumatlardan istifadə edir)",
    newItemButtonText: "Yeni Xidmət Əlavə Et",
    itemNameLabel: "Xidmətin Adı *",
    itemNamePlaceholder: "Məs: Klassik Saç Kəsimi və Styling",
    categoryLabel: "Bölmə / Xidmət Qrupu",
    categoryPlaceholder: "Məs: Kişi xidmətləri, Saç baxımı, Saqqal",
    priceLabel: "Xidmət Qiyməti (AZN) *",
    pricePlaceholder: "15.00",
    unitLabel: "Vahid",
    defaultUnit: "seans",
    unitPlaceholder: "seans, dəfə",
    durationLabel: "Xidmət Müddəti (Dəqiqə ilə — AI rezervasiya vaxtını buna görə tənzimləyir) *",
    specsLabel: "Xidmətə Nələr Daxildir",
    specsPlaceholder: "Məs: Saç yuma, kəsim, fen və styling daxildir",
    statusAvailable: "Aktiv (Rezervasiya açıqdır)",
    statusUnavailable: "Müvəqqəti Dayandırılıb",
    showRentalFields: false,
    showDurationField: true,
    showStockQuantity: false,
    emptyStateTitle: "Heç bir xidmət əlavə edilməyib",
    emptyStateText: "Gözəllik salonunuzun və ya bərbərxananızın xidmətlərini və qiymətlərini əlavə edin.",
  },

  RESTAURANT: {
    industry: "RESTAURANT",
    label: "Restoran, Kafe və Qida",
    icon: Utensils,
    catalogTitle: "Menyu və Qiymət Kataloqu",
    catalogSubtitle: "Yeməklər, içkilər, porsiya qiymətləri və tərkibi (AI zənglərdə sifarişlər üçün bu məlumatlardan istifadə edir)",
    newItemButtonText: "Menyuya Yemək Əlavə Et",
    itemNameLabel: "Yemək / İçki Adı *",
    itemNamePlaceholder: "Məs: Quzu Ətindən Lülə Kabab",
    categoryLabel: "Menyu Bölməsi",
    categoryPlaceholder: "Məs: Əsas Yeməklər, Kabablar, Salatlar, İçkilər",
    priceLabel: "Qiymət (AZN) *",
    pricePlaceholder: "9.50",
    unitLabel: "Porsiya / Ölçü",
    defaultUnit: "porsiya",
    unitPlaceholder: "porsiya, ədəd, 100 qr, şüşə",
    specsLabel: "Tərkibi və Qarnir",
    specsPlaceholder: "Məs: Quzu əti, quyruq, narşərab, təndir lavaşı və sumaq ilə",
    statusAvailable: "Menyuda var",
    statusUnavailable: "Bitib (Stop-List)",
    showRentalFields: false,
    showDurationField: false,
    showStockQuantity: false,
    emptyStateTitle: "Menyu boşdur",
    emptyStateText: "Restoran menyunuzu Excel və ya PDF faylı yükləyərək və ya tək-tək əlavə edin.",
  },

  CLINIC: {
    industry: "CLINIC",
    label: "Klinika və Tibb Mərkəzi",
    icon: HeartPulse,
    catalogTitle: "Tibbi Xidmətlər və Qəbul Cədvəli",
    catalogSubtitle: "Müayinələr, analizlər, prosedurlar və qəbul qiymətləri (AI zənglərdə pasiyentləri qəbula yazmaq üçün istifadə edir)",
    newItemButtonText: "Yeni Tibbi Xidmət Əlavə Et",
    itemNameLabel: "Xidmət / Müayinə / Həkim Qəbulu *",
    itemNamePlaceholder: "Məs: Terapevt İlkin Müayinəsi və EKQ",
    categoryLabel: "Tibbi Şöbə / İxtisas",
    categoryPlaceholder: "Məs: Terapiya, Stomatologiya, Kardiologiya, Laboratoriya",
    priceLabel: "Xidmət Qiyməti (AZN) *",
    pricePlaceholder: "40.00",
    unitLabel: "Ölçü",
    defaultUnit: "müayinə",
    unitPlaceholder: "müayinə, prosedur, analiz",
    durationLabel: "Qəbul Müddəti (Dəqiqə ilə — AI pasiyentləri buna əsasən növbəyə yazır) *",
    specsLabel: "Xidmətin Təsviri və Hazırlıq Qaydaları",
    specsPlaceholder: "Məs: Aç qarına gəlinməlidir, nəticələr 2 saat ərzində verilir",
    statusAvailable: "Qəbula Açıqdır",
    statusUnavailable: "Qəbul Doludur / Dayandırılıb",
    showRentalFields: false,
    showDurationField: true,
    showStockQuantity: false,
    emptyStateTitle: "Heç bir tibbi xidmət tapılmadı",
    emptyStateText: "Klinikanızın müayinə və analiz xidmətlərini əlavə edin.",
  },

  AUTO_SERVICE: {
    industry: "AUTO_SERVICE",
    label: "Avto-Servis və Usta Xidmətləri",
    icon: Wrench,
    catalogTitle: "Avto-Servis Xidmətləri və Qiymətlər",
    catalogSubtitle: "Təmir, diaqnostika, yağ dəyişmə və usta xidmətləri (AI zənglərdə müştəriləri servisə yazmaq üçün istifadə edir)",
    newItemButtonText: "Yeni Servis Xidməti Əlavə Et",
    itemNameLabel: "Servis Xidmətinin Adı *",
    itemNamePlaceholder: "Məs: Mühərrik Yağının və Filtrlərin Dəyişdirilməsi",
    categoryLabel: "Xidmət Qrupu",
    categoryPlaceholder: "Məs: Mühərrik təmiri, Diaqnostika, Asqı sistemi, Təkər təmiri",
    priceLabel: "Xidmət Qiyməti (AZN) *",
    pricePlaceholder: "25.00",
    unitLabel: "Ölçü",
    defaultUnit: "xidmət",
    unitPlaceholder: "xidmət, ədəd, saat",
    durationLabel: "Təxmini İcra Müddəti (dəqiqə)",
    specsLabel: "Xidmətin Təfərrüatları",
    specsPlaceholder: "Məs: Yağ filtri daxildir, kompüter diaqnostikası pulsuzdur",
    statusAvailable: "Qəbula Açıqdır (Boks boşdur)",
    statusUnavailable: "Servis Məşğuldur",
    showRentalFields: false,
    showDurationField: true,
    showStockQuantity: false,
    emptyStateTitle: "Heç bir servis xidməti tapılmadı",
    emptyStateText: "Avto-servisinizin xidmətlərini və qiymətlərini əlavə edin.",
  },

  RETAIL: {
    industry: "RETAIL",
    label: "Pərakəndə Satış, Mağaza və Aptek",
    icon: ShoppingBag,
    catalogTitle: "Məhsul və Qiymət Kataloqu",
    catalogSubtitle: "Məhsullar, satış qiymətləri və anbar qalıqları (AI zənglərdə müştərilərə stok məlumatı vermək üçün istifadə edir)",
    newItemButtonText: "Yeni Məhsul Əlavə Et",
    itemNameLabel: "Məhsulun Adı *",
    itemNamePlaceholder: "Məs: Aspirin Cardio 100mq",
    categoryLabel: "Məhsul Qrupu / Kateqoriya",
    categoryPlaceholder: "Məs: Dərman vasitələri, Vitaminlər, Kosmetika",
    priceLabel: "Satış Qiyməti (AZN) *",
    pricePlaceholder: "4.50",
    unitLabel: "Ölçü Vahidi",
    defaultUnit: "qutu",
    unitPlaceholder: "qutu, ədəd, kq, litr",
    specsLabel: "Tərkibi / Dozalanma / Parametrlər",
    specsPlaceholder: "Məs: 100 mq, 28 tablet, Almaniya istehsalı",
    statusAvailable: "Stokda var",
    statusUnavailable: "Bitib / Stokda yoxdur",
    showRentalFields: false,
    showDurationField: false,
    showStockQuantity: true,
    emptyStateTitle: "Heç bir məhsul tapılmadı",
    emptyStateText: "Mağazanızın və ya aptekinizin qiymət cədvəlini Excel və ya CSV ilə yükləyin.",
  },

  SERVICES: {
    industry: "SERVICES",
    label: "Ümumi Xidmətlər və Konsaltinq",
    icon: Briefcase,
    catalogTitle: "Xidmətlər və Qiymət Kataloqu",
    catalogSubtitle: "Təklif olunan xidmətlər, paketlər və konsultasiyalar (AI zənglərdə müştərilərə məlumat vermək üçün istifadə edir)",
    newItemButtonText: "Yeni Xidmət Əlavə Et",
    itemNameLabel: "Xidmətin Adı *",
    itemNamePlaceholder: "Məs: 1 Saatlıq Hüquqi Konsultasiya",
    categoryLabel: "Xidmət Qrupu",
    categoryPlaceholder: "Məs: Hüquq, Mühasibatlıq, Təlim, Dizayn",
    priceLabel: "Xidmət Qiyməti (AZN) *",
    pricePlaceholder: "50.00",
    unitLabel: "Vahid",
    defaultUnit: "saat",
    unitPlaceholder: "saat, seans, layihə, aylıq",
    durationLabel: "Görüş Müddəti (dəqiqə)",
    specsLabel: "Xidmətin Şərtləri və Təsviri",
    specsPlaceholder: "Məs: Online (Zoom) və ya ofisdə görüş",
    statusAvailable: "Aktiv (Qəbul açıqdır)",
    statusUnavailable: "Qəbul Dayandırılıb",
    showRentalFields: false,
    showDurationField: true,
    showStockQuantity: false,
    emptyStateTitle: "Heç bir xidmət tapılmadı",
    emptyStateText: "Şirkətinizin göstərdiyi xidmətləri və qiymətlərini daxil edin.",
  },
};

export function getIndustryConfig(industry?: TenantIndustry | null): IndustryMeta {
  if (industry && INDUSTRY_CONFIGS[industry]) {
    return INDUSTRY_CONFIGS[industry];
  }
  return INDUSTRY_CONFIGS.RENTAL;
}
