"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Brand from "@/components/Brand";

type Contestant = { id: string; name: string };
type Category = { id: string; title: string; icon: string; bgColor: string; borderColor: string };

const categories: Category[] = [
    { id: "trinh_dien", title: "Giải Trình diễn ấn tượng nhất", icon: "🌻", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
    { id: "trang_phuc", title: "Giải Trang phục ấn tượng nhất", icon: "🌸", bgColor: "bg-rose-50", borderColor: "border-rose-200" },
    { id: "guong_mat", title: "Giải Gương mặt yêu thích nhất", icon: "🌷", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
];

export default function SpecialVotePage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [contestants, setContestants] = useState<Contestant[]>([]);
    const [selections, setSelections] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const savedName = localStorage.getItem('uhl_voter_name');
        const savedEmail = localStorage.getItem('uhl_voter_email');
        if (savedName) setName(savedName);
        if (savedEmail) setEmail(savedEmail);

        // Xử lý phát nhạc và tắt khi ẩn tab
        const audio = document.getElementById('bg-music') as HTMLAudioElement;
        if (audio) {
            const playAudio = () => {
                audio.play().then(() => {
                    document.removeEventListener('click', playAudio);
                    document.removeEventListener('touchstart', playAudio);
                }).catch(() => { });
            };
            document.addEventListener('click', playAudio);
            document.addEventListener('touchstart', playAudio);

            const handleVisibilityChange = () => {
                if (document.hidden) {
                    audio.pause();
                } else {
                    if (audio.currentTime > 0) audio.play().catch(() => { });
                }
            };
            document.addEventListener("visibilitychange", handleVisibilityChange);

            return () => {
                document.removeEventListener("visibilitychange", handleVisibilityChange);
                document.removeEventListener('click', playAudio);
                document.removeEventListener('touchstart', playAudio);
            };
        }
    }, []);

    useEffect(() => {
        if (!supabase) return;
        supabase.from("contestants").select("id, name").order("name").then(({ data }) => {
            if (data) setContestants(data);
        });
    }, []);

    const handleSelect = (categoryId: string, contestantId: string) => {
        setSelections((prev) => ({ ...prev, [categoryId]: contestantId }));
    };

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!supabase) return;
        if (!name.trim() || !email.trim()) {
            setMessage("Cậu vui lòng điền Họ tên và Email nhé.");
            return;
        }
        if (Object.keys(selections).length !== 3) {
            setMessage("Cậu vui lòng chọn đủ 3 giải thưởng nhé.");
            return;
        }

        setBusy(true);
        setMessage("");
        let hasError = false;
        let alreadyVoted = false;

        for (const cat of categories) {
            const { data, error } = await supabase.rpc("submit_special_vote", {
                p_voter_email: email.trim().toLowerCase(),
                p_category: cat.id,
                p_contestant_id: selections[cat.id],
            });
            if (error) hasError = true;
            if (data?.status === "already_voted") alreadyVoted = true;
        }

        setBusy(false);

        if (hasError) {
            setMessage("Có lỗi xảy ra, vui lòng thử lại sau.");
        } else if (alreadyVoted) {
            setMessage("Email này đã bình chọn cho một hoặc nhiều giải phụ rồi. Cảm ơn cậu!");
        } else {
            localStorage.setItem('uhl_voter_name', name.trim());
            localStorage.setItem('uhl_voter_email', email.trim().toLowerCase());
            setSuccess(true);
        }
    }

    const getContestantName = (id: string) => {
        return contestants.find(c => c.id === id)?.name || "Chưa chọn";
    };

    if (success) {
        return (
            <>
                <audio id="bg-music" loop>
                    <source src="/nhac-giaiphu.mp3" type="audio/mpeg" />
                </audio>
                <main className="page-bg min-h-screen px-4 py-7 animate-in fade-in duration-500">
                    <div className="mx-auto max-w-xl">
                        <Brand />
                        <section className="soft-card mt-7 overflow-hidden">
                            <div className="p-6 md:p-8">
                                <div className="py-8 text-center animate-in zoom-in duration-500">
                                    <div className="text-6xl">🌷</div>
                                    <h2 className="mt-4 text-2xl font-bold text-emerald-700">Cảm ơn cậu!</h2>
                                    <p className="mt-2 text-slate-500">Bình chọn giải phụ thành công! Cảm ơn cậu đã tham gia.</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <audio id="bg-music" loop>
                <source src="/nhac-giaiphu.mp3" type="audio/mpeg" />
            </audio>

            <main className="page-bg min-h-screen px-4 py-7">
                <div className="mx-auto max-w-2xl">
                    <Brand />
                    <section className="soft-card mt-7 overflow-hidden">
                        <div className="bg-gradient-to-r from-rose-100 via-orange-50 to-emerald-100 px-6 py-7 text-center">
                            <span className="pill">SPECIAL AWARDS</span>
                            <h1 className="mt-3 text-2xl font-extrabold text-slate-700">BÌNH CHỌN GIẢI PHỤ</h1>
                            <p className="mt-2 text-sm text-slate-500">Nam Vương Sinh viên 5 Tốt UHL 2026</p>
                        </div>
                        <div className="p-6 md:p-8">
                            <form onSubmit={submit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold">Họ và tên</label>
                                        <input className="soft-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập họ và tên" required />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold">Email</label>
                                        <input className="soft-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@gmail.com" required />
                                    </div>
                                </div>

                                {categories.map((cat) => (
                                    <div key={cat.id} className={`rounded-2xl border ${cat.borderColor} ${cat.bgColor} p-5 shadow-sm`}>
                                        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-700">
                                            <span className="text-2xl">{cat.icon}</span> {cat.title}
                                        </h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            {contestants.map((c) => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => handleSelect(cat.id, c.id)}
                                                    className={`rounded-xl border p-3 text-sm font-semibold transition-all text-left ${selections[cat.id] === c.id
                                                        ? "border-emerald-500 bg-white text-emerald-700 shadow-md transform scale-[1.02]"
                                                        : "border-transparent bg-white/60 text-slate-600 hover:bg-white"
                                                        }`}
                                                >
                                                    {c.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5">
                                    <h3 className="mb-3 text-center font-bold text-slate-700 uppercase tracking-widest text-sm">LỰA CHỌN TÌNH CẢM CỦA BẠN</h3>
                                    <div className="space-y-2 text-sm text-slate-600">
                                        {categories.map(cat => (
                                            <div key={cat.id} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                                <span className="flex items-center gap-2"><span className="text-lg">{cat.icon}</span> {cat.title.replace("Giải ", "")}</span>
                                                <span className={`font-bold ${selections[cat.id] ? "text-emerald-600" : "text-slate-400"}`}>
                                                    {selections[cat.id] ? getContestantName(selections[cat.id]) : "Chưa chọn"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="w-full rounded-2xl bg-rose-400 py-3 font-bold text-white transition-all hover:bg-rose-500 active:scale-95 disabled:opacity-60 shadow-md" disabled={busy}>
                                    {busy ? "Đang gửi..." : "GỬI BÌNH CHỌN GIẢI PHỤ ♡"}
                                </button>
                                {message && <p role="status" className="rounded-xl bg-rose-50 p-3 text-center text-sm text-rose-700">{message}</p>}
                            </form>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
/**
 * Tác giả: Trần Kim Ngân - 2026 - trankimngan20006@gmail.com
 */