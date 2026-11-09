"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Brand from "@/components/Brand";
import { supabase } from "@/lib/supabase";

type Team = { id: string; name: string };
export default function VotePage() {
  const params = useParams<{ round: string }>();
  const roundNumber = Number(params.round);
  const [teams, setTeams] = useState<Team[]>([]);
  const [open, setOpen] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [team, setTeam] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!supabase || ![1, 2].includes(roundNumber)) return;
    let active = true;
    Promise.all([
      supabase.from("teams").select("id,name").eq("active", true).order("sort_order"),
      supabase.from("rounds").select("is_open").eq("round_number", roundNumber).single()
    ]).then(([t, r]) => {
      if (!active) return;
      if (!t.error) setTeams(t.data || []);
      if (!r.error) setOpen(r.data.is_open);
    });
    return () => { active = false; };
  }, [roundNumber]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) { setMessage("Website chưa được kết nối cơ sở dữ liệu. Ban tổ chức vui lòng hoàn tất cấu hình."); return; }
    if (!name.trim() || !email.trim() || !team) { setMessage("Cậu vui lòng điền đủ thông tin và chọn đội nhé."); return; }
    setBusy(true); setMessage("");
    const { data, error } = await supabase.rpc("submit_vote", {
      p_round_number: roundNumber,
      p_voter_name: name.trim(),
      p_voter_email: email.trim().toLowerCase(),
      p_team_id: team
    });
    setBusy(false);
    if (error) { setMessage("Chưa gửi được phiếu. Cậu thử lại hoặc báo Ban Tổ chức nhé."); return; }
    if (data?.status === "already_voted") { setMessage("Email này đã bình chọn ở vòng này rồi. Cảm ơn cậu nhé!"); return; }
    if (data?.status === "closed") { setMessage("Vòng bình chọn đã đóng."); return; }
    if (data?.status === "success") { setSuccess(true); setMessage("Bình chọn thành công! Cảm ơn cậu đã tham gia."); }
    else setMessage("Không thể ghi nhận phiếu. Vui lòng thử lại.");
  }

  if (![1, 2].includes(roundNumber)) return <main className="page-bg p-8">Đường dẫn vòng thi không hợp lệ.</main>;
  return <main className="page-bg min-h-screen px-4 py-7 animate-in fade-in duration-500">
    <div className="mx-auto max-w-xl">
      <Brand />
      <section className="soft-card mt-7 overflow-hidden">
        <div className="bg-gradient-to-r from-rose-100 via-orange-50 to-emerald-100 px-6 py-7 text-center">
          <span className="pill">ROUND 0{roundNumber}</span>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-700">BÌNH CHỌN NAM VƯƠNG</h1>
          <p className="mt-2 text-sm text-slate-500">Nam Vương Sinh viên 5 Tốt UHL 2026</p>
        </div>
        <div className="p-6 md:p-8">
          {success ? <div className="py-8 text-center"><div className="text-6xl">🌷</div><h2 className="mt-4 text-2xl font-bold text-emerald-700">Cảm ơn cậu!</h2><p className="mt-2 text-slate-500">{message}</p></div> :
            open === false ? <div className="rounded-2xl bg-rose-50 p-6 text-center"><div className="text-4xl">🌸</div><h2 className="mt-3 font-bold">Vòng bình chọn hiện đã đóng</h2><p className="mt-2 text-sm text-slate-500">Cảm ơn cậu đã quan tâm chương trình.</p></div> :
              <form onSubmit={submit} className="space-y-5">
                <div><label className="mb-2 block text-sm font-semibold">Họ và tên</label><input className="soft-input" value={name} onChange={e => setName(e.target.value)} placeholder="Nhập họ và tên" maxLength={100} required /></div>
                <div><label className="mb-2 block text-sm font-semibold">Email</label><input className="soft-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@gmail.com" maxLength={254} required /></div>
                <div><label className="mb-3 block text-sm font-semibold">Cậu bình chọn cho đội nào?</label><div className="grid grid-cols-1 gap-3">
                  {teams.map(t => (
                    <button type="button" key={t.id} onClick={() => setTeam(t.id)} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${team === t.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                      <div className="text-2xl">👑</div>
                      <div>
                        <div className="font-bold text-slate-700">{t.name}</div>
                        <div className="text-sm text-slate-400">Chạm để chọn</div>
                      </div>
                    </button>
                  ))}
                </div></div>
                <p className="text-xs leading-5 text-slate-400">Mỗi địa chỉ email được bình chọn một lần trong mỗi vòng. Không cần đăng nhập hoặc xác minh email.</p>
                <button className={`w-full rounded-2xl py-3 font-bold transition-all duration-300 ${success ? 'bg-emerald-500 text-white shadow-lg' : 'bg-rose-400 text-white hover:bg-rose-500 shadow-md hover:shadow-lg active:scale-95'} disabled:opacity-60`} disabled={busy || open === null}>
                  {busy ? "Đang gửi..." : "GỬI BÌNH CHỌN ♡"}
                </button>
                {message && <p role="status" className="rounded-xl bg-rose-50 p-3 text-center text-sm text-rose-700">{message}</p>}
              </form>}
          {open === null && !success && <p className="text-center text-sm text-slate-400">Đang tải trạng thái bình chọn...</p>}
        </div>
      </section>
      <p className="py-6 text-center text-xs text-slate-400">CLB Sinh viên 5 Tốt UHL · 19.11.2026</p>
    </div>
  </main>;
}
