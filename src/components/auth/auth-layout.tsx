import type { ReactNode } from 'react'
import { Boxes, Check } from 'lucide-react'

function Wordmark({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex size-10 items-center justify-center rounded-xl ${inverse ? 'bg-white text-primary' : 'bg-primary text-primary-foreground'}`}
        aria-hidden="true"
      >
        <Boxes className="size-5" />
      </span>
      <span className="text-xl font-semibold tracking-tight">Stockly</span>
    </div>
  )
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto grid min-h-svh max-w-[1440px] lg:grid-cols-[1.03fr_0.97fr]">
        <aside className="hidden flex-col justify-between bg-primary px-12 py-10 text-primary-foreground lg:flex xl:px-16">
          <Wordmark inverse />
          <div className="max-w-lg py-12">
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.18em] text-primary-foreground/70">
              Persediaan, lebih tertata
            </p>
            <h2 className="max-w-md text-4xl leading-tight font-semibold tracking-tight xl:text-5xl">
              Mulai dengan fondasi operasional yang jelas.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-primary-foreground/80">
              Satu ruang kerja untuk pemilik, peran yang tegas, dan gudang utama yang siap digunakan.
            </p>
            <ul className="mt-10 flex flex-col gap-4 text-sm">
              {['Workspace khusus bisnis Anda', 'Akses pemilik yang terlindungi', 'Gudang utama dibuat otomatis'].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-white/15" aria-hidden="true">
                    <Check className="size-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-primary-foreground/65">
            Dibuat untuk membantu bisnis Indonesia bekerja lebih rapi.
          </p>
        </aside>
        <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 lg:hidden">
              <Wordmark />
              <p className="mt-3 text-sm text-muted-foreground">Persediaan, lebih tertata.</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </main>
  )
}
