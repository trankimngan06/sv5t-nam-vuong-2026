const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cấu hình test
const TOTAL_USERS = 150; // Số người test
const DURATION_MINUTES = 3; // Thời gian test (3 phút)

async function testVote (userIndex) {
    const email = `test_user_${ userIndex }_${ Date.now() }@gmail.com`;
    const name = `Khán giả test ${ userIndex }`;

    // CẬU CẦN THAY ID NÀY BẰNG ID THẬT CỦA ĐỘI TRONG SUPABASE
    const teamId = "0989bf13-83e9-4104-9dac-c2d07aa49439";

    const start = Date.now();
    const { data, error } = await supabase.rpc('submit_vote', {
        p_round_number: 1,
        p_voter_name: name,
        p_voter_email: email,
        p_team_id: teamId
    });
    const end = Date.now();

    if (error) {
        console.log(`❌ Lỗi ở người ${ userIndex }:`, error.message);
    } else {
        console.log(`✅ Người ${ userIndex } vote xong trong ${ end - start }ms`);
    }
}

async function runTest () {
    console.log(`🚀 Bắt đầu giả lập ${ TOTAL_USERS } người vote trong ${ DURATION_MINUTES } phút...`);

    const delayPerUser = (DURATION_MINUTES * 60 * 1000) / TOTAL_USERS;

    for (let i = 1; i <= TOTAL_USERS; i++) {
        testVote(i);
        await new Promise(resolve => setTimeout(resolve, delayPerUser));
    }

    console.log("⏳ Đã gửi hết 150 yêu cầu. Đợi 5 giây để Database xử lý xong...");
    setTimeout(() => {
        console.log("🏁 Kết thúc test!");
        process.exit(0);
    }, 5000);
}

runTest();