"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type TeamResult = { id: string; name: string; votes: number; percent: number };

export default function ResultsPage() {
    const [round1Results, setRound1Results] = useState<TeamResult[]>([]);
    const [round2Results, setRound2Results] = useState<TeamResult[]>([]);
    const [total1, setTotal1] = useState(0);
    const [total2, setTotal2] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!supabase) return;

        // 1. Lấy danh sách đội đang bật và danh sách các vòng
        const { data: teams } = await supabase.from("teams").select("id, name").eq("active", true);
        const { data: rounds } = await supabase.from("rounds").select("id, round_number");
        // 2. Lấy tất cả phiếu bầu
        const { data: votes } = await supabase.from("votes").select("team_id, round_id");

        if (teams && rounds && votes) {
            // Hàm xử lý tính toán cho từng vòng
            const processRound = (roundNum: number) => {
                const roundData = rounds.find(r => r.round_number === roundNum);
                if (!roundData) return { results: [], total: 0 };

                const roundVotes = votes.filter(v => v.round_id === roundData.id);
                const total = roundVotes.length;

                const calculated = teams.map((team) => {
                    const teamVotes = roundVotes.filter((v) => v.team_id === team.id).length;
                    const percent = total === 0 ? 0 : Math.round((teamVotes / total) * 100);
                    return { id: team.id, name: team.name, votes: teamVotes, percent };
                });
                calculated.sort((a, b) => b.votes - a.votes);
                return { results: calculated, total };
            };

            const r1 = processRound(1);
            setRound1Results(r1.results);
            setTotal1(r1.total);

            const r2 = processRound(2);
            setRound2Results(r2.results);
            setTotal2(r2.total);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData(); // Tải dữ liệu ngay khi mở trang

        if (!supabase) return;
        // Lắng nghe sự kiện real-time khi có phiếu mới
        const channel = supabase
            .channel("realtime-votes")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "votes" }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const renderRoundBlock = (title: string, results: TeamResult[], total: number) => (
        <div className="flex-1 bg-white/60 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-white">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-slate-700">{title}</h2>
                <span className="bg-emerald-100 text-emerald-700 font-bold px-4 py-1 rounded-full text-sm">
                    {total} phiếu
                </span>
            </div>
            <div className="space-y-4">
                {results.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-4">Chưa có đội nào hoạt động</p>
                ) : (
                    results.map((team, index) => (
                        <div key={team.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                            <div className="flex justify-between items-end mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-slate-300">#{index + 1}</span>
                                    <span className="text-md font-bold text-slate-700">{team.name}</span>
                                </div>
                                <div className="text-right flex items-baseline gap-2">
                                    <span className="text-2xl font-extrabold text-emerald-600">{team.percent}%</span>
                                    <span className="text-sm font-semibold text-slate-400">({team.votes} phiếu)</span>
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-emerald-300 to-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${team.percent}%` }}
                                ></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-emerald-50 p-6 flex flex-col">
            <div className="max-w-7xl mx-auto w-full">
                <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    <h1 className="text-3xl font-extrabold text-slate-800 uppercase tracking-wide">
                        Kết quả bình chọn trực tiếp
                    </h1>
                    <p className="mt-2 text-slate-500 font-medium">Nam Vương Sinh viên 5 Tốt UHL 2026</p>
                </div>

                {loading ? (
                    <p className="text-center text-slate-500 text-lg">Đang tải dữ liệu...</p>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in zoom-in duration-500">
                        {renderRoundBlock("Vòng 1", round1Results, total1)}
                        {renderRoundBlock("Vòng 2", round2Results, total2)}
                    </div>
                )}

                <div className="mt-12 text-center">
                    <Link href="/admin" className="text-slate-400 hover:text-slate-600 text-sm underline bg-white/50 px-4 py-2 rounded-full">
                        Quay lại trang Admin
                    </Link>
                </div>
            </div>
        </div>
    );
}