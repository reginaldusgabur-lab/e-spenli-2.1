'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DatabaseZap, Database, FileText, Info, ShieldCheck } from "lucide-react";

const StatCard = ({ title, value, icon: Icon, description, className }: any) => (
    <Card className={`h-full flex flex-col ${className || ''}`}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <p className="text-2xl font-bold">{value}</p>
            </div>
            {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
        </CardHeader>
        <CardContent>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

export default function KeamananPage() {
  return (
    <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-3">
                <ShieldCheck className="h-7 w-7"/>
                Keamanan Kuota
            </h1>
        </div>

        <Card className="bg-card/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <DatabaseZap className="h-6 w-6" />
                    Keamanan Kuota (Spark Plan)
                </CardTitle>
                <CardDescription>
                    Analisis penggunaan data sekolah Anda. Dirancang untuk efisiensi maksimum pada paket gratis Firebase.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <StatCard 
                        title="WRITES (TULIS)"
                        value="Hanya Saat Sync"
                        icon={Database}
                        description="1 Aksi = 1 Tulis. Operasi tulis hanya terjadi saat ada perubahan data (contoh: absen, setujui izin). Tidak dihitung ulang saat reload halaman."
                    />
                    <StatCard 
                        title="READS (BACA)"
                        value="Bebas Reload"
                        icon={FileText}
                        description="Data diambil dari memori browser (cache). Rp 0,- Biaya. Anda hanya akan menggunakan kuota baca saat pertama kali membuka aplikasi atau saat ada data baru."
                    />
                </div>
                <Alert>
                    <Info className="h-4 w-4"/>
                    <AlertTitle>Informasi</AlertTitle>
                    <AlertDescription>
                        Anda bebas membuka menu apapun berkali-kali tanpa khawatir biaya tambahan. Sistem dirancang untuk efisiensi penuh bagi sekolah.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>

    </div>
  );
}
