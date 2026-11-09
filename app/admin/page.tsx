"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import * as XLSX from "xlsx";
import Brand from "@/components/Brand";
import { supabase, ADMIN_EMAIL } from "@/lib/supabase";

// Đã sửa lại Type cho khớp với Database thật của cậu
type Round = { id: string; round_number: number; title: string; is_open: boolean };
type Vote = { voter_name: string; voter_email: string; team_id: string; round_id: string; created_at: string };

export default function AdminPage() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data: { session } } = await supabase.auth.getSession();
    const current = session?.user.email?.toLowerCase() || null;
    setSessionEmail(current);

    if (current !== ADMIN_EMAIL) { setLoading(false); return; }

    const [r, v] = await Promise.all([
      supabase.from("rounds").select("*").order("round_number"),
      supabase.from("votes").select("*").order("created_at", { ascending: false })
    ]);

    if (!r.error) setRounds(r.data || []);
    if (!v.error) setVotes(v.data || []);
    setLoading(false);
  }

  useEffect(() => {
    setOrigin(window.location.origin);
    load();
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) { setNotice("Chưa cấu hình Supabase."); return; }
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: window.location.origin + "/admin" } });
    setNotice(error ? error.message : "Đã gửi liên kết đăng nhập đến email quản trị. Hãy mở email trên thiết bị này.");
  }

  async function logout() {
    await supabase?.auth.signOut();
    setSessionEmail(null);
    setRounds([]);
    setVotes([]);
  }

  async function toggle(round: Round) {
    if (!supabase) return;
    const { error } = await supabase.rpc("admin_set_round_status", { p_round_number: round.round_number, p_is_open: !round.is_open });
    setNotice(error ? "Không thể đổi trạng thái." : `Đã ${round.is_open ? "đóng" : "mở"} vòng ${round.round_number}.`);
    await load();
  }

  function exportFile(roundNo: number | "all") {
    const roundObj = rounds.find(r => r.round_number === roundNo);

    const rows = votes.filter(v => {
      if (roundNo === "all") return true;
      return v.round_id === roundObj?.id;
    }).map((v, i) => ({
      "STT": i + 1,
      "Họ và tên": v.voter_name,
      "Email": v.voter_email,
      "Thời gian": new Date(v.created_at).toLocaleString("vi-VN")
    }));

    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, "Binh chon");
    XLSX.writeFile(book, roundNo === "all" ? "UHL_Tong_hop_2_vong.xlsx" : `UHL_Binh_chon_vong_${roundNo}.xlsx`);
  }

  if (loading) return <main className="page-bg min-h-screen p-8 text-center">Đang tải trang quản trị...</main>;

  if (!sessionEmail || sessionEmail !== ADMIN_EMAIL) return (
    <main className="page-bg min-h-screen px-4 py-8">
      <div className="mx-auto max-w-md">
        <Brand />
        <section className="soft-card mt-8 p-7">
          <span className="pill">ADMIN ONLY</span>
          <h1 className="mt-4 text-2xl font-extrabold">Đăng nhập Ban Tổ chức</h1>
          <form onSubmit={login} className="mt-6 space-y-4">
            <input className="soft-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <button className="pink-btn w-full">Gửi link đăng nhập</button>
          </form>
          {notice && <p className="mt-4 text-sm text-rose-600">{notice}</p>}
        </section>
      </div>
    </main>
  );

  return (
    <main className="page-bg min-h-screen px-4 py-7">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Brand />
          <button className="mint-btn" onClick={logout}>Đăng xuất</button>
        </div>

        <div className="mt-7">
          <span className="pill">ADMIN DASHBOARD</span>
          <h1 className="mt-3 text-3xl font-extrabold">Quản lý bình chọn</h1>
          <p className="mt-1 text-sm text-slate-500">Đăng nhập: {sessionEmail}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/admin/round2" className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-center text-sm font-bold text-white transition-all hover:bg-emerald-600 hover:shadow-lg">
            ⚙️ Quản lý Top 5 vào Vòng 2
          </a>
          <a href="/ket-qua" target="_blank" className="flex-1 rounded-xl bg-blue-500 px-4 py-3 text-center text-sm font-bold text-white transition-all hover:bg-blue-600 hover:shadow-lg">
            🏆 Xem Kết quả Trực tiếp
          </a>
        </div>

        {notice && <p className="mt-4 rounded-xl bg-white p-3 text-sm">{notice}</p>}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {rounds.map(r => {
            // SỬA LẠI CHỖ NÀY: Đếm theo round_id thay vì round_number
            const count = votes.filter(v => v.round_id === r.id).length;

            return (
              <section key={r.id} className="soft-card p-5">
                <div className="flex items-center justify-between">
                  <span className="pill">ROUND 0{r.round_number}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${r.is_open ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {r.is_open ? "ĐANG MỞ" : "ĐANG ĐÓNG"}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-bold">{r.title}</h2>
                <div className="my-4 text-4xl font-extrabold text-rose-400">
                  {count}
                  <span className="ml-2 text-sm font-medium text-slate-400">phiếu</span>
                </div>
                <button className={r.is_open ? "mint-btn w-full" : "pink-btn w-full"} onClick={() => toggle(r)}>
                  {r.is_open ? "Đóng vòng bình chọn" : "Mở vòng bình chọn"}
                </button>
                <div className="mt-4 flex justify-center rounded-xl bg-white p-4">
                  <QRCodeCanvas value={`${origin}/vote/${r.round_number}`} size={150} includeMargin />
                </div>
                <p className="mt-2 break-all text-center text-xs text-slate-400">{origin}/vote/{r.round_number}</p>
                <button className="mt-3 w-full rounded-xl border border-emerald-200 bg-white p-3 text-sm font-bold text-emerald-700" onClick={() => exportFile(r.round_number)}>
                  Xuất Excel vòng {r.round_number}
                </button>
              </section>
            );
          })}
        </div>

        <section className="soft-card mt-5 p-5">
          <h2 className="text-lg font-bold">Tổng hợp dữ liệu</h2>
          <div className="mt-4 flex gap-2">
            <button className="pink-btn" onClick={() => exportFile("all")}>Tải Excel tổng hợp</button>
            <button className="rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-rose-600" onClick={load}>Làm mới dữ liệu</button>
          </div>
        </section>
      </div>
    </main>
  );
}