import Image from "next/image";

export default function Brand({ compact=false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3">
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm">
      <Image src="/logo.jpg" alt="Logo CLB Sinh viên 5 Tốt UHL" fill className="object-contain p-1" />
    </div>
    <div>
      <div className="text-xs font-bold tracking-wide text-emerald-700">CLB SINH VIÊN 5 TỐT UHL</div>
      {!compact && <div className="text-sm font-extrabold text-slate-700">NAM VƯƠNG 2026</div>}
    </div>
  </div>;
}
