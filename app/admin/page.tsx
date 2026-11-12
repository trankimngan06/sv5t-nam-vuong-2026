"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import * as XLSX from "xlsx";
import Brand from "@/components/Brand";
import { supabase, ADMIN_EMAIL } from "@/lib/supabase";

type Round = { id: string; round_number: number; title: string; is_open: boolean };
type Vote = { voter_name: string; voter_email: string; team_id: string | null; contestant_id: string | null; round_id: string; created_at: string };
type Team = { id: string; name: string };
type Contestant = { id: string; name: string };

export default function AdminPage() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [contestants, setContestants] = useState<Contestant[]>([]);

  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data: { session } } = await supabase.auth.getSession();
    const current = session?.user.email?.toLowerCase() || null;
    setSessionEmail(current);

    // CHỈ ADMIN_EMAIL mới được load dữ liệu
    if (current !== ADMIN_EMAIL) { setLoading(false); return; }

    const [r, v, t, c] = await Promise.all([
      supabase.from("rounds").select("*").order("round_number"),
      supabase.from("votes").select("*").order("created_at", { ascending: false }),
      supabase.from("teams").select("id, name"),
      supabase.from("contestants").select("id, name")
    ]);

    if (!r.error) setRounds(r.data || []);
    if (!v.error) setVotes(v.data || []);
    if (!t.error) setTeams(t.data || []);
    if (!c.error) setContestants(c.data || []);
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
    const dataToExport: any[] = [];

    const addSectionTitle = (title: string) => {
      dataToExport.push({ "STT": "", "Họ và tên": `=== ${title} ===` });
    };

    const processRound = (rNum: number) => {
      const roundObj = rounds.find(r => r.round_number === rNum);
      if (!roundObj) return;
      const roundVotes = votes.filter(v => v.round_id === roundObj.id);

      addSectionTitle(roundObj.title || `Vòng ${rNum}`);

      roundVotes.forEach((v, i) => {
        let selectedName = "";
        if (v.team_id) selectedName = teams.find(t => t.id === v.team_id)?.name || "Không xác định";
        else if (v.contestant_id) selectedName = contestants.find(c => c.id === v.contestant_id)?.name || "Không xác định";

        dataToExport.push({
          "STT": i + 1,
          "Họ và tên": v.voter_name,
          "Email": v.voter_email,
          "Bình chọn cho": selectedName,
          "Thời gian": new Date(v.created_at).toLocaleString("vi-VN")
        });
      });
      dataToExport.push({});
    };

    if (roundNo === "all") {
      const mainRounds = rounds.filter(r => r.round_number <= 3).sort((a, b) => a.round_number - b.round_number);
      mainRounds.forEach(r => processRound(r.round_number));
    } else {
      processRound(roundNo);
    }

    const sheet = XLSX.utils.json_to_sheet(dataToExport);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Binh chon");
    XLSX.writeFile(book, roundNo === "all" ? "UHL_Tong_hop.xlsx" : `UHL_Binh_chon_vong_${roundNo}.xlsx`);
  }

  if (loading) return <main className="page-bg min-h-screen p-8 text-center">Đang tải trang quản trị...</main>;

  if (!sessionEmail || sessionEmail !== ADMIN_EMAIL) return (
    <main className="page-bg min-h-screen px-4 py-8">
      <div className="mx-auto max-w-md">
        <Brand />
        <section className="soft-card mt-8 p-7">
          <span className="pill">ADMIN ONLY</span>
          <h1 className="mt-4 text-2xl font-extrabold">Đăng nhập Ban Tổ chức</h1>
          <p className="mt-2 text-sm text-slate-500">Hệ thống chỉ cho phép email quản trị truy cập.</p>
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

        {/* Nút điều hướng nhanh (Đã thêm đủ 4 nút) */}
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-800">
            🏠 Trang chủ
          </a>
          <a href="/vote/1" target="_blank" className="rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-bold text-rose-500 transition-all hover:bg-rose-50 hover:text-rose-600">
            🗳️ Vote Vòng 1
          </a>
          <a href="/vote/2" target="_blank" className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-600 transition-all hover:bg-emerald-50 hover:text-emerald-700">
            🗳️ Vote Vòng 2
          </a>
          <a href="/vote/giai-phu" target="_blank" className="rounded-xl border border-purple-300 bg-white px-3 py-2 text-xs font-bold text-purple-600 transition-all hover:bg-purple-50 hover:text-purple-700">
            🌻 Vote Giải phụ
          </a>
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

        {/* DANH SÁCH CÁC VÒNG THI */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rounds.map(r => {
            const count = votes.filter(v => v.round_id === r.id).length;
            const voteUrl = r.round_number === 3 ? `${origin}/vote/giai-phu` : `${origin}/vote/${r.round_number}`;

            return (
              <section key={r.id} className="soft-card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="pill">ROUND 0{r.round_number}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${r.is_open ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {r.is_open ? "ĐANG MỞ" : "ĐANG ĐÓNG"}
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-bold h-14 overflow-hidden line-clamp-2">{r.title}</h2>
                  <div className="my-4 text-4xl font-extrabold text-rose-400">
                    {count}
                    <span className="ml-2 text-sm font-medium text-slate-400">phiếu</span>
                  </div>
                </div>

                <div>
                  <button className={r.is_open ? "mint-btn w-full" : "pink-btn w-full"} onClick={() => toggle(r)}>
                    {r.is_open ? "Đóng vòng bình chọn" : "Mở vòng bình chọn"}
                  </button>
                  <div className="mt-4 flex justify-center rounded-xl bg-white p-4">
                    <QRCodeCanvas value={voteUrl} size={150} includeMargin />
                  </div>
                  <p className="mt-2 break-all text-center text-xs text-slate-400">{voteUrl}</p>
                </div>
              </section>
            );
          })}
        </div>

        {/* KHU VỰC XUẤT EXCEL */}
        <section className="soft-card mt-8 p-6">
          <h2 className="text-xl font-bold mb-4 text-slate-700">Tải dữ liệu Excel</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rounds.find(r => r.round_number === 1) && (
              <button className="w-full rounded-xl border border-emerald-200 bg-white p-4 text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-colors shadow-sm" onClick={() => exportFile(1)}>
                Xuất Excel Vòng 1
              </button>
            )}

            {rounds.find(r => r.round_number === 2) && (
              <button className="w-full rounded-xl border border-emerald-200 bg-white p-4 text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-colors shadow-sm" onClick={() => exportFile(2)}>
                Xuất Excel Vòng 2
              </button>
            )}

            {rounds.find(r => r.round_number === 3) && (
              <button className="w-full rounded-xl border border-emerald-200 bg-white p-4 text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-colors shadow-sm" onClick={() => exportFile(3)}>
                Xuất Excel Vòng 3
              </button>
            )}

            <button className="w-full rounded-xl bg-rose-400 p-4 text-sm font-bold text-white hover:bg-rose-500 transition-colors shadow-sm" onClick={() => exportFile("all")}>
              Tải Excel Tổng hợp
            </button>
          </div>

          <button className="w-full mt-6 rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm font-bold text-slate-600 hover:bg-slate-100" onClick={load}>
            Làm mới dữ liệu
          </button>
        </section>
      </div>
    </main>
  );
}