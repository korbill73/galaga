export default class Leaderboard {
    constructor() {
        this.maxEntries = 10;
        this.storageKey = 'galaga_leaderboard';
    }

    getScores() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    saveScore(name, score, level) {
        const scores = this.getScores();
        scores.push({
            name: name.substring(0, 10), // Max 10 characters
            score: score,
            level: level,
            date: new Date().toISOString()
        });

        // Sort by score descending
        scores.sort((a, b) => b.score - a.score);

        // Keep only top 10
        const topScores = scores.slice(0, this.maxEntries);

        localStorage.setItem(this.storageKey, JSON.stringify(topScores));
        return topScores;
    }

    isHighScore(score) {
        const scores = this.getScores();
        if (scores.length < this.maxEntries) return true;
        return score > scores[scores.length - 1].score;
    }

    getRank(score) {
        const scores = this.getScores();
        let rank = 1;
        for (let entry of scores) {
            if (score > entry.score) break;
            rank++;
        }
        return rank;
    }

    displayLeaderboard() {
        const scores = this.getScores();
        const table = document.getElementById('leaderboard-table');

        if (!table) return;

        table.innerHTML = `
            <tr style="border-bottom:2px solid #444;">
                <th style="padding:5px; text-align:left;">Rank</th>
                <th style="padding:5px; text-align:left;">Name</th>
                <th style="padding:5px; text-align:right;">Score</th>
                <th style="padding:5px; text-align:right;">Level</th>
            </tr>
        `;

        scores.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #333';

            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

            row.innerHTML = `
                <td style="padding:5px;">${medal}</td>
                <td style="padding:5px; color:#0ff;">${entry.name}</td>
                <td style="padding:5px; text-align:right; color:#ff0;">${entry.score.toLocaleString()}</td>
                <td style="padding:5px; text-align:right; color:#f80;">${entry.level}</td>
            `;

            table.appendChild(row);
        });

        if (scores.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4" style="padding:20px; text-align:center; color:#888;">No scores yet. Be the first!</td>';
            table.appendChild(row);
        }
    }
}
