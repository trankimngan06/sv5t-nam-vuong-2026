import Link from "next/link";
import Brand from "@/components/Brand";

export default function Home() {
  return <main className="page-bg px-4 py-8 md:py-12">
    <div className="mx-auto max-w-5xl">
      <header className="flex items-center justify-between"><Brand /><span className="pill">19.11.2026</span></header>
      <section className="soft-card mt-8 grid items-center gap-8 overflow-hidden p-6 md:grid-cols-2 md:p-12">
        <div>
          <span className="pill">THE PEOPLE&apos;S CHOICE</span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-slate-700 md:text-5xl">NAM VƯƠNG<br /><span className="text-rose-400">SINH VIÊN 5 TỐT</span></h1>

          {/* Chữ UHL 2026 đã được sửa lại kích thước và xóa phần bị lặp */}
          <div className="mt-4 text-3xl md:text-4xl font-extrabold text-emerald-700 tracking-wide">
            UHL 2026
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="pink-btn" href="/vote/1">Bình chọn vòng 1</Link>
            <Link className="mint-btn" href="/vote/2">Bình chọn vòng 2</Link>
            <Link href="/ket-qua" className="mt-4 block w-full rounded-2xl bg-white border-2 border-emerald-400 px-6 py-3 text-center font-bold text-emerald-600 shadow-sm transition-all hover:bg-emerald-50 hover:shadow-md">
              🏆 Xem Kết quả Trực tiếp
            </Link>
          </div>
        </div>
        <div className="relative flex min-h-64 items-center justify-center rounded-[32px] bg-gradient-to-br from-rose-100 via-orange-50 to-emerald-100 p-8">
          <div className="absolute left-8 top-8 h-20 w-20 rounded-full bg-white/60 blur-sm" />
          <div className="absolute bottom-8 right-8 h-28 w-28 rounded-full bg-rose-200/70 blur-sm" />
          <div className="relative rounded-[35px] bg-white/70 p-10 text-center shadow-xl backdrop-blur">
            <div className="text-6xl">👑</div>
            <div className="mt-3 text-xl font-extrabold tracking-widest text-rose-400">YOUR VOTE</div>
            <div className="text-xs font-semibold tracking-[.25em] text-emerald-700">MATTERS</div>
          </div>
        </div>
      </section>
      <section className="mt-7 grid gap-4 md:grid-cols-2">
        <Link href="/vote/1" className="soft-card p-6 transition hover:-translate-y-1">
          <span className="pill">ROUND 01</span><h2 className="mt-3 text-xl font-bold">Bình chọn vòng 1</h2><p className="mt-2 text-sm text-slate-500">Quét QR vòng 1 hoặc mở trang bình chọn.</p>
        </Link>
        <Link href="/vote/2" className="soft-card p-6 transition hover:-translate-y-1">
          <span className="pill" style={{ background: "#e2f3e9", color: "#4b8766" }}>ROUND 02</span><h2 className="mt-3 text-xl font-bold">Bình chọn vòng 2</h2><p className="mt-2 text-sm text-slate-500">QR riêng cho vòng chung kết.</p>
        </Link>
      </section>
      <footer className="py-8 text-center text-xs text-slate-400">© 2026 CLB Sinh viên 5 Tốt UHL · Nam Vương UHL</footer>
    </div>
  </main>;
}