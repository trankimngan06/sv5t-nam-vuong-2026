"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type ResultItem = { id: string; name: string; votes: number; percent: number };
type RoundData = { round_number: number; title: string; results: ResultItem[]; total: number };

export default function ResultsPage() {
    const [mainRounds, setMainRounds] = useState<RoundData[]>([]);
    const [specialAwards, setSpecialAwards] = useState<Record<string, ResultItem[]>>({});
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!supabase) return;

        // 1. Tải dữ liệu cho Vòng 1, 2 (Đội thi)
        const { data: teams } = await supabase.from("teams").select("id, name").eq("active", true);
        const { data: rounds } = await supabase.from("rounds").select("id, round_number, title").in("round_number", [1, 2]);
        const { data: votes } = await supabase.from("votes").select("team_id, round_id");

        if (rounds && votes && teams) {
            const processedRounds = rounds.map(round => {
                const roundVotes = votes.filter(v => v.round_id === round.id);
                const total = roundVotes.length;
                const calculated = teams.map((t) => {
                    const vCount = roundVotes.filter((v) => v.team_id === t.id).length;
                    const percent = total === 0 ? 0 : Math.round((vCount / total) * 100);
                    return { id: t.id, name: t.name, votes: vCount, percent };
                });
                calculated.sort((a, b) => b.votes - a.votes);
                return { round_number: round.round_number, title: round.title, results: calculated, total };
            });
            processedRounds.sort((a, b) => a.round_number - b.round_number);
            setMainRounds(processedRounds);
        }

        // 2. Tải dữ liệu cho Giải phụ (Thí sinh cá nhân)
        const { data: contestants } = await supabase.from("contestants").select("id, name");
        const { data: specialVotes } = await supabase.from("special_votes").select("category, contestant_id");

        if (contestants && specialVotes) {
            const categories = ["trinh_dien", "trang_phuc", "guong_mat"];
            const calculatedSpecial: Record<string, ResultItem[]> = {};

            categories.forEach(cat => {
                const catVotes = specialVotes.filter(v => v.category === cat);
                const total = catVotes.length;
                const results = contestants.map(c => {
                    const vCount = catVotes.filter(v => v.contestant_id === c.id).length;
                    const percent = total === 0 ? 0 : Math.round((vCount / total) * 100);
                    return { id: c.id, name: c.name, votes: vCount, percent };
                });
                results.sort((a, b) => b.votes - a.votes);
                calculatedSpecial[cat] = results;
            });

            setSpecialAwards(calculatedSpecial);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        if (!supabase) return;

        // Lắng nghe sự kiện realtime
        const channel = supabase
            .channel("realtime-votes")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "votes" }, () => {
                fetchData();
            })
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "special_votes" }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Render khối cho Vòng 1, 2 (Dạng dọc)
    const renderMainRound = (title: string, results: ResultItem[], total: number) => (
        <div className="flex-1 bg-white/60 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-white">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-slate-700 uppercase">{title}</h2>
                <span className="bg-emerald-100 text-emerald-700 font-bold px-4 py-1 rounded-full text-sm">{total} phiếu</span>
            </div>
            <div className="space-y-4">
                {results.map((item, index) => (
                    <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-slate-300">#{index + 1}</span>
                                <span className="text-md font-bold text-slate-700">{item.name}</span>
                            </div>
                            <div className="text-right flex items-baseline gap-2">
                                <span className="text-2xl font-extrabold text-emerald-600">{item.percent}%</span>
                                <span className="text-sm font-semibold text-slate-400">({item.votes} phiếu)</span>
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-300 to-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${item.percent}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Render khối cho Giải phụ (Dạng dọc)
    const renderSpecialAward = (title: string, icon: string, results: ResultItem[]) => (
        <div className="flex-1 bg-white/60 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-white">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-extrabold text-slate-700 flex items-center gap-2">
                    <span className="text-2xl">{icon}</span> {title}
                </h2>
                <span className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full text-xs">
                    {results.reduce((sum, item) => sum + item.votes, 0)} phiếu
                </span>
            </div>
            <div className="space-y-4">
                {results.map((item, index) => (
                    <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-slate-300">#{index + 1}</span>
                                <span className="text-md font-bold text-slate-700">{item.name}</span>
                            </div>
                            <div className="text-right flex items-baseline gap-2">
                                <span className="text-xl font-extrabold text-emerald-600">{item.percent}%</span>
                                <span className="text-xs font-semibold text-slate-400">({item.votes})</span>
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-emerald-400 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${item.percent}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-emerald-50 p-6 flex flex-col">
            <div className="max-w-7xl mx-auto w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-800 uppercase tracking-wide">Kết quả bình chọn trực tiếp</h1>
                    <p className="mt-2 text-slate-500 font-medium">Nam Vương Sinh viên 5 Tốt UHL 2026</p>
                </div>

                {loading ? (
                    <p className="text-center text-slate-500 text-lg">Đang tải dữ liệu...</p>
                ) : (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-500">

                        {/* HÀNG TRÊN: VÒNG 1 & VÒNG 2 */}
                        <div className="flex flex-col lg:flex-row gap-6">
                            {mainRounds.map((round) => (
                                <div key={round.round_number} className="flex-1">
                                    {renderMainRound(round.title, round.results, round.total)}
                                </div>
                            ))}
                        </div>

                        {/* HÀNG DƯỚI: 3 GIẢI PHỤ */}
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-800 uppercase text-center mb-6 mt-10">Bảng xếp hạng Giải phụ</h2>
                            <div className="flex flex-col lg:flex-row gap-6">
                                {renderSpecialAward("Trình diễn ấn tượng", "🎭", specialAwards["trinh_dien"] || [])}
                                {renderSpecialAward("Trang phục ấn tượng", "👗", specialAwards["trang_phuc"] || [])}
                                {renderSpecialAward("Gương mặt yêu thích", "✨", specialAwards["guong_mat"] || [])}
                            </div>
                        </div>

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