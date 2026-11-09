"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Team = { id: string; name: string; active: boolean; vote_count: number };

export default function AdminRound2Page() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState("");

  const fetchTeams = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data: teamsData } = await supabase.from("teams").select("id, name, active").order("name");
    if (teamsData) {
      const teamsWithVotes = await Promise.all(
        teamsData.map(async (t) => {
          const { count } = await supabase!
            .from("votes")
            .select("*", { count: "exact", head: true })
            .eq("team_id", t.id);
          return { ...t, vote_count: count || 0 };
        })
      );
      teamsWithVotes.sort((a, b) => b.vote_count - a.vote_count);
      setTeams(teamsWithVotes);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const toggleTeamActive = async (id: string, currentStatus: boolean) => {
    if (!supabase) return;
    const { error } = await supabase.from("teams").update({ active: !currentStatus }).eq("id", id);
    if (!error) fetchTeams();
    else alert("Lỗi: " + error.message);
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !supabase) return;
    const { error } = await supabase.from("teams").insert({ name: newTeamName.trim(), active: true, sort_order: teams.length + 1 });
    if (!error) {
      setNewTeamName("");
      fetchTeams();
    } else {
      alert("Lỗi khi thêm đội: " + error.message);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!supabase || !confirm("Cậu có chắc chắn muốn xóa đội này không?")) return;
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (!error) fetchTeams();
    else alert("Lỗi khi xóa: " + error.message);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Quản lý đội thi & Vòng 2</h1>
          <Link href="/admin" className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-300">
            Quay lại Admin
          </Link>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <h2 className="mb-3 font-bold text-slate-700">Thêm đội thi mới</h2>
          <form onSubmit={handleAddTeam} className="flex gap-3">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Nhập tên đội (VD: Đội 06)"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-emerald-500"
              required
            />
            <button type="submit" className="rounded-xl bg-emerald-500 px-6 py-2 font-semibold text-white hover:bg-emerald-600">
              Thêm đội
            </button>
          </form>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="mb-4 text-sm text-slate-500">
            Bảng xếp hạng dựa trên số phiếu. Tích chọn "Hoạt động" để đưa đội vào Vòng 2.
          </p>

          {loading ? (
            <p className="text-center text-slate-500">Đang tải dữ liệu...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="p-3 rounded-tl-lg">Hạng</th>
                    <th className="p-3">Tên đội</th>
                    <th className="p-3">Số phiếu</th>
                    <th className="p-3">Trạng thái Vòng 2</th>
                    <th className="p-3 rounded-tr-lg">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team, index) => (
                    <tr key={team.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-400">#{index + 1}</td>
                      <td className="p-3 font-semibold text-slate-700">{team.name}</td>
                      <td className="p-3 font-bold text-emerald-600">{team.vote_count}</td>
                      <td className="p-3">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={team.active}
                            onChange={() => toggleTeamActive(team.id, team.active)}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                          <span className="ml-3 text-sm font-medium text-slate-600">
                            {team.active ? "Đang bật" : "Đang tắt"}
                          </span>
                        </label>
                      </td>
                      <td className="p-3">
                        <button onClick={() => handleDeleteTeam(team.id)} className="text-rose-500 hover:text-rose-700 font-semibold text-sm">
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}