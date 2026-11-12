"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Team = { id: string; name: string; active: boolean; vote_count: number };
type Contestant = { id: string; name: string };

export default function AdminRound2Page() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTeamName, setNewTeamName] = useState("");
  const [newContestantName, setNewContestantName] = useState("");

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);

    // Tải Teams
    const { data: teamsData } = await supabase.from("teams").select("id, name, active").order("name");
    if (teamsData) {
      const teamsWithVotes = await Promise.all(
        teamsData.map(async (t) => {
          const { count } = await supabase.from("votes").select("*", { count: "exact", head: true }).eq("team_id", t.id);
          return { ...t, vote_count: count || 0 };
        })
      );
      teamsWithVotes.sort((a, b) => b.vote_count - a.vote_count);
      setTeams(teamsWithVotes);
    }

    // Tải Contestants (Thí sinh vòng 3)
    const { data: cData } = await supabase.from("contestants").select("id, name").order("name");
    if (cData) setContestants(cData);

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- Xử lý Teams ---
  const toggleTeamActive = async (id: string, currentStatus: boolean) => {
    if (!supabase) return;
    const { error } = await supabase.from("teams").update({ active: !currentStatus }).eq("id", id);
    if (!error) fetchData();
    else alert("Lỗi: " + error.message);
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !supabase) return;
    const { error } = await supabase.from("teams").insert({ name: newTeamName.trim(), active: true, sort_order: teams.length + 1 });
    if (!error) { setNewTeamName(""); fetchData(); }
    else alert("Lỗi: " + error.message);
  };

  const handleDeleteTeam = async (id: string) => {
    if (!supabase || !confirm("Xóa đội này?")) return;
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (!error) fetchData();
    else alert("Lỗi: " + error.message);
  };

  // --- Xử lý Contestants (Thí sinh) ---
  const handleAddContestant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContestantName.trim() || !supabase) return;
    const { error } = await supabase.from("contestants").insert({ name: newContestantName.trim() });
    if (!error) { setNewContestantName(""); fetchData(); }
    else alert("Lỗi: " + error.message);
  };

  const handleDeleteContestant = async (id: string) => {
    if (!supabase || !confirm("Xóa thí sinh này?")) return;
    const { error } = await supabase.from("contestants").delete().eq("id", id);
    if (!error) fetchData();
    else alert("Lỗi: " + error.message);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Đội thi & Thí sinh</h1>
          <Link href="/admin" className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-300">
            Quay lại Admin
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CỘT 1: QUẢN LÝ ĐỘI THI (VÒNG 1, 2) */}
          <div>
            <div className="mb-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
              <h2 className="mb-3 font-bold text-slate-700">Thêm Đội thi mới</h2>
              <form onSubmit={handleAddTeam} className="flex gap-3">
                <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Nhập tên đội" className="flex-1 rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-emerald-500" required />
                <button type="submit" className="rounded-xl bg-emerald-500 px-6 py-2 font-semibold text-white hover:bg-emerald-600">Thêm</button>
              </form>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
              <h2 className="mb-4 font-bold text-slate-700">Danh sách Đội thi (Vòng 1, 2)</h2>
              {loading ? <p>Đang tải...</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="p-3">Tên đội</th>
                        <th className="p-3 text-center">Số phiếu</th>
                        <th className="p-3">Vòng 2</th>
                        <th className="p-3">Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((team) => (
                        <tr key={team.id} className="border-b border-slate-100">
                          <td className="p-3 font-semibold">{team.name}</td>
                          <td className="p-3 text-center font-bold text-emerald-600">{team.vote_count}</td>
                          <td className="p-3">
                            <label className="inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={team.active} onChange={() => toggleTeamActive(team.id, team.active)} className="sr-only peer" />
                              <div className="relative w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                              <span className="ml-3 text-sm font-medium text-slate-600">{team.active ? "Bật" : "Tắt"}</span>
                            </label>
                          </td>
                          <td className="p-3"><button onClick={() => handleDeleteTeam(team.id)} className="text-rose-500 font-semibold text-sm hover:underline">Xóa</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* CỘT 2: QUẢN LÝ THÍ SINH (VÒNG 3) */}
          <div>
            <div className="mb-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
              <h2 className="mb-3 font-bold text-slate-700">Thêm Thí sinh (Vòng 3)</h2>
              <form onSubmit={handleAddContestant} className="flex gap-3">
                <input type="text" value={newContestantName} onChange={(e) => setNewContestantName(e.target.value)} placeholder="Nhập tên thí sinh" className="flex-1 rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-emerald-500" required />
                <button type="submit" className="rounded-xl bg-blue-500 px-6 py-2 font-semibold text-white hover:bg-blue-600">Thêm</button>
              </form>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
              <h2 className="mb-4 font-bold text-slate-700">Danh sách Thí sinh (Vòng 3)</h2>
              {loading ? <p>Đang tải...</p> : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600 sticky top-0">
                      <tr>
                        <th className="p-3">Tên thí sinh</th>
                        <th className="p-3">Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contestants.map((c) => (
                        <tr key={c.id} className="border-b border-slate-100">
                          <td className="p-3 font-semibold text-slate-700">{c.name}</td>
                          <td className="p-3"><button onClick={() => handleDeleteContestant(c.id)} className="text-rose-500 font-semibold text-sm hover:underline">Xóa</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}