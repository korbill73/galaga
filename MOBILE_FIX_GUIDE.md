# 모바일 입력 문제 해결 방법

## 문제
모바일에서 HTML input 필드가 작동하지 않음 (키보드가 열리지 않음)

## 해결책
브라우저 네이티브 `prompt()` 사용

## Game.js 수정 필요

**83번째 줄 근처**에서 다음과 같이 변경:

### 기존 코드 (복잡):
```javascript
if (this.leaderboard.isHighScore(this.score)) {
    const nameInputSection = document.getElementById('name-input-section');
    const nameInput = document.getElementById('player-name-input');
    // ... 복잡한 이벤트 핸들러 ...
}
```

### 새 코드 (간단):
```javascript
const isHighScore = await this.leaderboard.isHighScore(this.score);

if (isHighScore) {
    setTimeout(async () => {
        const playerName = prompt('🏆 NEW HIGH SCORE! 🏆\nEnter your name:', 'PLAYER');
        if (playerName !== null) {
            const name = playerName.trim() || 'PLAYER';
            await this.leaderboard.saveScore(name, this.score, this.level);
            this.soundManager.play('powerup');
        }
    }, 500);
}
```

## 장점
- ✅ 100% 모바일 호환
- ✅ 키보드 자동 열림
- ✅ 간단하고 안정적
- ✅ HTML/CSS 수정 불필요

## 적용 방법
1. Game.js 83-120번째 줄을 위 코드로 교체
2. HTML의 name-input-section은 더 이상 사용하지 않음
