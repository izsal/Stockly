import Link from 'next/link'
import { ThemeToggle } from '@/src/components/app/theme-toggle'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  FileSpreadsheet,
  History,
  Lock,
  Package,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const FEATURES = [
  {
    icon: Package,
    title: 'Katalog Produk & Kategori',
    description:
      'Kelola SKU dan barcode unik per ruang kerja, format harga modal & jual Rupiah, serta arsipkan produk lama tanpa menghilangkan riwayat transaksi.',
  },
  {
    icon: ClipboardCheck,
    title: 'Stok Masuk, Keluar, & Opname',
    description:
      'Catat penerimaan barang, penjualan/kerusakan, dan penyesuaian stok fisik dengan penguncian baris transaksi agar saldo tidak pernah minus.',
  },
  {
    icon: History,
    title: 'Buku Besar Riwayat Stok',
    description:
      'Setiap mutasi tercatat permanen (append-only) lengkap dengan saldo sebelum, selisih, saldo sesudah, pelaku, alasan, dan nomor referensi.',
  },
  {
    icon: Truck,
    title: 'Manajemen Supplier',
    description:
      'Simpan data pemasok dan hubungkan langsung pada transaksi stok masuk untuk memudahkan pelacakan sumber barang.',
  },
  {
    icon: AlertTriangle,
    title: 'Peringatan Stok Menipis & Habis',
    description:
      'Pantau produk yang menyentuh batas stok minimum atau sudah habis (= 0) langsung dari ringkasan operasional harian.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Laporan & Ekspor CSV',
    description:
      'Saring laporan stok saat ini, stok menipis, atau pergerakan stok berdasarkan rentang tanggal, lalu unduh sebagai file CSV.',
  },
] as const

const STEPS = [
  {
    step: '01',
    title: 'Daftar & Siapkan Ruang Kerja',
    description:
      'Buat akun dalam satu langkah. Ruang kerja bisnis, peran pemilik (OWNER), dan Gudang Utama langsung disiapkan otomatis.',
  },
  {
    step: '02',
    title: 'Masukkan Produk & Catat Mutasi',
    description:
      'Tambahkan produk beserta stok minimum, lalu catat stok masuk awal, stok keluar harian, dan hasil stok opname.',
  },
  {
    step: '03',
    title: 'Pantau Dashboard & Ekspor Laporan',
    description:
      'Lihat ringkasan unit stok, produk yang perlu segera di-restock, dan unduh laporan CSV untuk rekap pembukuan.',
  },
] as const

const TRUST_POINTS = [
  {
    icon: Lock,
    title: 'Isolasi Multi-Tenant Ketat',
    description:
      'Setiap toko memiliki ruang kerja terpisah yang diverifikasi di sisi server dan database pada setiap permintaan.',
  },
  {
    icon: Users,
    title: 'Kontrol Peran OWNER & STAFF',
    description:
      'Pemilik mengatur katalog, harga, dan supplier; staf fokus mencatat pergerakan stok harian secara terkendali.',
  },
  {
    icon: ShieldCheck,
    title: 'Audit Trail Tanpa Edit Diam-Diam',
    description:
      'Saldo stok hanya berubah lewat mutasi resmi sehingga jumlah fisik dan catatan pembukuan selalu sinkron.',
  },
] as const

export function LandingPage({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
              aria-hidden="true"
            >
              <Boxes className="size-[18px]" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Stockly</span>
          </Link>

          <nav aria-label="Navigasi landing page" className="hidden items-center gap-7 md:flex">
            <a
              href="#fitur"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Fitur
            </a>
            <a
              href="#cara-kerja"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cara Kerja
            </a>
            <a
              href="#keamanan"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Keamanan
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Buka Dashboard
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Masuk
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:px-4"
                >
                  Mulai Gratis
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border bg-card/40">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:px-10">
            <div className="min-w-0 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-primary">
                <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                Manajemen Inventaris untuk UMKM Indonesia
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                Pantau stok barang secara akurat, cegah kehabisan, dan audit setiap mutasi.
              </h1>

              <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Stockly membantu pemilik usaha dan staf gudang mencatat stok masuk, stok keluar,
                opname fisik, hingga ekspor laporan CSV dalam satu ruang kerja yang rapi dan aman.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={isAuthenticated ? '/dashboard' : '/sign-up'}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {isAuthenticated ? 'Masuk ke Dashboard' : 'Buat Ruang Kerja Gratis'}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <a
                  href="#fitur"
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <BarChart3 className="size-4 text-muted-foreground" aria-hidden="true" />
                  Lihat Fitur Utama
                </a>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-2 text-sm text-muted-foreground sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>Anti stok minus</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>Histori audit permanen</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>Ekspor CSV siap Excel</span>
                </div>
              </div>
            </div>

            <Card className="min-w-0 border-border shadow-sm">
              <CardHeader className="border-b border-border px-5 py-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Contoh Ringkasan Ruang Kerja</p>
                    <p className="text-sm font-semibold">Toko Berkah Jaya — Gudang Utama</p>
                  </div>
                  <Badge variant="secondary">Live Ledger</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Produk Aktif</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">128</p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                    <p className="text-xs text-amber-800">Stok Menipis</p>
                    <p className="mt-1 text-xl font-semibold text-amber-900 tabular-nums">6</p>
                  </div>
                  <div className="col-span-2 rounded-lg border border-red-200 bg-red-50/70 p-3 sm:col-span-1">
                    <p className="text-xs text-red-800">Stok Habis</p>
                    <p className="mt-1 text-xl font-semibold text-red-900 tabular-nums">2</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Mutasi Terakhir
                  </p>
                  <div className="divide-y divide-border rounded-lg border border-border bg-background">
                    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">Kopi Arabika Gayo 250g</p>
                        <p className="text-xs text-muted-foreground">Stok Masuk • PO-2026-014</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-emerald-700 tabular-nums">
                        <ArrowUpRight className="size-3.5" aria-hidden="true" />
                        +25
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">Teh Melati Premium 500ml</p>
                        <p className="text-xs text-muted-foreground">Stok Keluar • Penjualan</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-red-700 tabular-nums">
                        <ArrowDownRight className="size-3.5" aria-hidden="true" />
                        -12
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">Minyak Goreng 2L</p>
                        <p className="text-xs text-muted-foreground">Penyesuaian • Stok Opname</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-amber-700 tabular-nums">
                        -2 (24 → 22)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="fitur" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              Fitur Utama
            </p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Semua alur operasional stok harian dalam satu tempat
            </h2>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              Dirancang khusus untuk kebutuhan toko retail, grosir, dan gudang kecil-menengah tanpa
              menu yang membingungkan.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="border-border">
                  <CardContent className="space-y-3 p-5">
                    <span
                      className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground"
                      aria-hidden="true"
                    >
                      <Icon className="size-5" />
                    </span>
                    <h3 className="text-base font-semibold">{feature.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section id="cara-kerja" className="border-y border-border bg-card/50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                Cara Kerja
              </p>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Siap dipakai dalam hitungan menit
              </h2>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {STEPS.map((item) => (
                <Card key={item.step} className="border-border bg-background">
                  <CardContent className="space-y-2.5 p-5">
                    <span className="inline-block text-xs font-semibold tracking-widest text-primary">
                      LANGKAH {item.step}
                    </span>
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="keamanan" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
          <div className="grid gap-4 lg:grid-cols-3">
            {TRUST_POINTS.map((point) => {
              const Icon = point.icon
              return (
                <Card key={point.title} className="border-border">
                  <CardContent className="flex items-start gap-3.5 p-5">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"
                      aria-hidden="true"
                    >
                      <Icon className="size-5" />
                    </span>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">{point.title}</h3>
                      <p className="text-sm leading-6 text-muted-foreground">{point.description}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="mt-10 border-primary/25 bg-primary/[0.04]">
            <CardContent className="flex flex-col items-start justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="space-y-1.5">
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  Siap merapikan pencatatan stok toko Anda?
                </h2>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Daftar sekarang dan mulai catat stok masuk pertama Anda dalam beberapa menit.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={isAuthenticated ? '/dashboard' : '/sign-up'}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {isAuthenticated ? 'Buka Dashboard' : 'Daftar Sekarang'}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                {!isAuthenticated ? (
                  <Link
                    href="/sign-in"
                    className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Sudah punya akun
                  </Link>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border bg-card/60">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-10">
          <div className="flex items-center gap-2">
            <Boxes className="size-4 text-primary" aria-hidden="true" />
            <span>Stockly — Manajemen Inventaris UMKM Indonesia</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/sign-in" className="hover:text-foreground">
              Masuk
            </Link>
            <Link href="/sign-up" className="hover:text-foreground">
              Daftar
            </Link>
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

