# Voint Panel

**Voint** — B2B AI səsli agent + CRM platformasının biznes paneli. Biznes sahibi bu paneldə zənglərini, CRM-ni, RAG məlumatlarını və analitikanı idarə edir.

React + TypeScript + Vite + Tailwind CSS (v4) + Zustand + React Router.

## Quraşdırma və işə salma

```bash
npm install
npm run dev
```

Panel `http://localhost:5173` ünvanında açılacaq.

Production build:

```bash
npm run build
npm run preview
```

## Backend URL-nin təyin edilməsi

`.env.example` faylını `.env` adı ilə kopyalayın və backend ünvanını qeyd edin:

```bash
VITE_API_URL=http://localhost:8080
```

Panel bütün sorğuları `VITE_API_URL` + `/api/v1` ünvanına göndərir (voint-backend, Spring Boot, port 8080).

## Mock rejimi

Backend işləmirsə panel avtomatik **mock data** ilə işləyir — bütün ekranlar real backend olmadan da baxıla bilər.

`.env` faylında `VITE_USE_MOCK` dəyişəni ilə idarə olunur:

| Dəyər   | Davranış                                                              |
| ------- | --------------------------------------------------------------------- |
| `auto`  | (default) Əvvəl real API-yə müraciət edir, backend əlçatan deyilsə mock data qaytarır |
| `true`  | Həmişə mock data istifadə edir                                         |
| `false` | Həmişə real API istifadə edir (backend mütləq işləməlidir)             |

Mock rejimdə əlavə/redaktə/silmə əməliyyatları yaddaşda saxlanılır və səhifə yenilənəndə sıfırlanır.

## Demo giriş

Backend seed məlumatları ilə uyğundur (mock rejimdə də işləyir):

- **E-poçt:** `admin@ces.az`
- **Şifrə:** `voint123`

## Ekranlar

1. **Login** — e-poçt/şifrə ilə giriş, JWT localStorage-da saxlanılır
2. **Dashboard** — zəng sayı, həll olunma faizi, rezervasiya sayı, orta müddət + günlük zəng qrafiki
3. **Zənglər** — zəng siyahısı; zəngə klik → transkript + AI xülasə
4. **Müştərilər (CRM)** — müştəri siyahısı, zəng tarixçəsi, əlavə/redaktə
5. **Rezervasiyalar** — agentin topladığı sorğular; təsdiq/rədd düymələri
6. **RAG Data** — qiymətlər, xidmətlər, FAQ, iş saatları — əlavə/silmə
7. **Ayarlar** — salamlama mətni, iş saatları, yönləndirmə nömrəsi, agent dili

## Qovluq strukturu

```
src/
├── api/          # axios + backend çağırışları + mock fallback
├── components/   # təkrar istifadə olunan komponentlər
├── pages/        # ekranlar
├── router/       # marşrutlar + qorunan route-lar
├── store/        # Zustand (auth, tenant)
├── theme/        # dizayn tokenləri
└── lib/          # köməkçi funksiyalar
```
