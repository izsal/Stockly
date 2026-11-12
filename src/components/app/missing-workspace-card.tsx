import { Card, CardHeader } from '@/components/ui/card'
import { DashboardShell } from './dashboard-shell'

export function MissingWorkspaceState({ userName }: { userName: string }) {
  return (
    <DashboardShell workspaceName="Stockly" userName={userName}>
      <Card role="alert">
        <CardHeader className="px-6 pt-6 pb-6">
          <h1 className="text-xl font-semibold">Ruang kerja belum tersedia</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Akun Anda aktif, tetapi ruang kerja belum berhasil disiapkan. Keluar lalu masuk kembali;
            jika masalah berlanjut, hubungi pengelola.
          </p>
        </CardHeader>
      </Card>
    </DashboardShell>
  )
}

