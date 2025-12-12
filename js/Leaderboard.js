export default class Leaderboard {
    constructor() {
        this.maxEntries = 50;

        // Supabase 설정
        const SUPABASE_URL = 'https://zdgptafwxowdxmfzwktu.supabase.co';
        const SUPABASE_KEY = 'sb_publishable_0RWCmxUlbQhf9plvkgOimA_m7nreX-F';

        // Supabase 클라이언트 초기화
        this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }

    async getScores() {
        try {
            const { data, error } = await this.supabase
                .from('galaga_leaderboard')
                .select('*')
                .order('score', { ascending: false })
                .limit(this.maxEntries);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching scores:', error);
            return [];
        }
    }

    async saveScore(name, score, level) {
        try {
            const { data, error } = await this.supabase
                .from('galaga_leaderboard')
                .insert([
                    {
                        player_name: name.substring(0, 20),
                        score: score,
                        level: level
                    }
                ])
                .select();

            if (error) throw error;

            // 리더보드 새로고침
            await this.displayLeaderboard();

            return data;
        } catch (error) {
            console.error('Error saving score:', error);
            alert('점수 저장 실패. 다시 시도해주세요.');
            return null;
        }
    }

    async isHighScore(score) {
        const scores = await this.getScores();
        if (scores.length < this.maxEntries) return true;
        return score > scores[scores.length - 1].score;
    }

    async getRank(score) {
        const scores = await this.getScores();
        let rank = 1;
        for (let entry of scores) {
            if (score > entry.score) break;
            rank++;
        }
        return rank;
    }

    async displayLeaderboard() {
        const scores = await this.getScores();
        const table = document.getElementById('leaderboard-table');

        if (!table) return;

        table.innerHTML = `
            <tr style="border-bottom:2px solid #444;">
                <th style="padding:5px; text-align:left;">Rank</th>
                <th style="padding:5px; text-align:left;">Name</th>
                <th style="padding:5px; text-align:right;">Score</th>
                <th style="padding:5px; text-align:right;">Level</th>
                <th style="padding:5px; text-align:right;">Date</th>
            </tr>
        `;

        scores.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #333';

            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

            // 날짜 포맷
            const date = new Date(entry.created_at);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

            row.innerHTML = `
                <td style="padding:5px;">${medal}</td>
                <td style="padding:5px; color:#0ff;">${entry.player_name}</td>
                <td style="padding:5px; text-align:right; color:#ff0;">${entry.score.toLocaleString()}</td>
                <td style="padding:5px; text-align:right; color:#f80;">${entry.level}</td>
                <td style="padding:5px; text-align:right; color:#888; font-size:10px;">${dateStr}</td>
            `;

            table.appendChild(row);
        });

        if (scores.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="5" style="padding:20px; text-align:center; color:#888;">No scores yet. Be the first!</td>';
            table.appendChild(row);
        }
    }
}
