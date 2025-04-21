const defaultPlayers = [
    {"id":1,"name":"未命名","role":"常规","team":"A","claims":[],"whiteClaims":[],"speech":[]},
    {"id":2,"name":"未命名","role":"常规","team":"A","claims":[],"whiteClaims":[],"speech":[]},
    {"id":3,"name":"未命名","role":"常规","team":"A","claims":[],"whiteClaims":[],"speech":[]},
    {"id":4,"name":"未命名","role":"常规","team":"B","claims":[],"whiteClaims":[],"speech":[]},
    {"id":5,"name":"未命名","role":"常规","team":"B","claims":[],"whiteClaims":[],"speech":[]},
    {"id":6,"name":"未命名","role":"常规","team":"B","claims":[],"whiteClaims":[],"speech":[]}
];

const teamColors = {
    A: 'red',
    B: 'blue',
    C: 'green',
    白板: 'black',
    旅行者: 'purple'
}

const teamColorsLight = {
    A: '#ffe6e6',
    B: '#e6f2ff',
    C: '#e6ffe6',
    白板: '#f5f5f5',
    旅行者: '#f9e6ff'
}

let players = [];

let words = {
    'A': '',
    'B': '',
    'C': ''
}

let nextId = () => {
    if (players.length === 0) {
        return 1;
    }
    const maxId = Math.max(...players.map(p => p.id));
    return maxId + 1;
}

// 添加新玩家
function addPlayer() {
    const newPlayer = {
        id: nextId(),
        name: '未命名',
        role: '常规',
        team: 'A',
        speech: [],
        claims: [],
        whiteClaims: []
    };
    players.push(newPlayer);
    renderPlayers();
}

// 删除玩家
function removePlayer(id) {
    players = players.filter(p => p.id !== id);
    // 更新 ID，所有玩家的 ID 依次调整
    players.forEach((p, index) => {
        p.id = index + 1;
    });
    renderPlayers();
}

// 重置游戏
function resetGame() {
    players = JSON.parse(JSON.stringify(defaultPlayers)); // 深拷贝
    words = {
        'A': '',
        'B': '',
        'C': ''
    }
    renderPlayers();
}

// 渲染玩家表格
function renderPlayers() {
    // 发生修改。如果有计算结果，就重新生成
    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
        resultsDiv.innerHTML = '';
        // calculateScores();
    }

    // 考虑兼容性，如果 players 没有 speech 字段，则添加之
    players.forEach(player => {
        if (!player.speech) {
            player.speech = [];
        }
    });

    renderDictionary();

    const tbody = document.getElementById('players-body');
    tbody.innerHTML = players.map(player => `
        <tr>
            <td>
                ${playerDisplayWrapper(player, true)}
            </td>
            <td>
                <select onchange="updatePlayer(${player.id}, 'role', this.value)">
                    <option ${player.role === '常规' ? 'selected' : ''}>常规</option>
                    <option ${player.role === '内奸' ? 'selected' : ''}>内奸</option>
                    <option ${player.role === '白板' ? 'selected' : ''}>白板</option>
                    <option ${player.role === '旅行者' ? 'selected' : ''}>旅行者</option>
                </select>
            </td>
            <td>
                <select onchange="updatePlayer(${player.id}, 'team', this.value)"
                    ${['白板','旅行者'].includes(player.role) ? 'style="display: none"' : ''}>
                    <option ${player.team === 'A' ? 'selected' : ''}>A</option>
                    <option ${player.team === 'B' ? 'selected' : ''}>B</option>
                    <option ${player.team === 'C' ? 'selected' : ''}>C</option>
                </select>
            </td>
            <td>
                ${renderPlayerWord(player)}
            </td>
            <td>
                ${player.speech.map(s => `<div style="font-size: small">
                    <u onclick="readPlayerSpeech()">[${s.order}] ${s.content}</u>
                </div>`).join('')}
            </td>
            <td>
                <input type="text" 
                    placeholder="例:2,3" 
                    value="${player.claims.join(',')}"
                    ${['白板'].includes(player.role) ? 'style="display: none"' : ''}
                    onchange="updateClaims(${player.id}, this.value, 'claims')"
                    onkeydown="if (event.key === 'Enter') this.blur()">
            </td>
            <td>
                <input type="text" 
                    placeholder="例:1" 
                    value="${player.whiteClaims.join(',')}"
                    ${player.role === '旅行者' ? 'disabled' : ''}
                    ${['白板','旅行者'].includes(player.role) ? 'style="display: none"' : ''}
                    onchange="updateClaims(${player.id}, this.value, 'whiteClaims')"
                    onkeydown="if (event.key === 'Enter') this.blur()">
            </td>
            <td>
                <button onclick="removePlayer(${player.id})">❌ 删除</button>
            </td>
        </tr>
    `).join('');
    saveGameStateToLocalStorage();
}

// 用于正确渲染玩家序号的辅助函数
function playerIdWrapper(player) {
    return `<span class="id-displayer" style="background: ${teamColors[player.role] || teamColors[player.team]}">${player.id}</span>`;
}

function playerDisplayWrapper(player, isEditable = false) {
    return `
        ${playerIdWrapper(player)}
        <span 
            class="player-name" 
            ${isEditable ? `ondblclick="editPlayerName(${player.id}, this)"` : ''}
            title="${isEditable ? '双击编辑昵称' : ''}"
            style="cursor: ${isEditable ? 'pointer' : 'default'};"
        >${player.name}</span>
    `;
}

function editPlayerName(playerId, element) {
    // 获取当前名字
    const currentName = element.textContent;

    // 创建一个输入框
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.style.width = '50%';

    // 替换当前元素内容为输入框
    element.textContent = '';
    element.appendChild(input);

    // 聚焦到输入框
    input.focus();

    // 当输入框失去焦点时保存新名字
    input.addEventListener('blur', () => {
        const newName = input.value.trim();
        if (newName && newName !== currentName) {
            // 更新显示
            element.textContent = newName;

            // 调用保存逻辑（例如发送到服务器）
            savePlayerName(playerId, newName);
        } else {
            // 如果名字未改变或为空，恢复原始名字
            element.textContent = currentName;
        }
    });

    // 允许按下 Enter 键保存
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            input.blur(); // 触发失去焦点事件
        }
    });
}

function savePlayerName(playerId, newName) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    player.name = newName;
    renderPlayers();
}

// 重新显示所有玩家的词语
function renderDictionary() {
    const wordA = document.getElementById('wordA');
    const wordB = document.getElementById('wordB');
    const wordC = document.getElementById('wordC');

    wordA.value = words['A'];
    wordB.value = words['B'];
    wordC.value = words['C'];
}

// 重新显示某玩家的词语
function renderPlayerWord(player) {
    if (!player) return '-';

    if (['A','B','C'].includes(player.team)) {
        if (player.role === '常规') {
            return (words[player.team] !== '') ? `
                <span class="word-displayer" style="background: ${teamColors[player.team]}">${words[player.team]}</span>
            ` : '';
        } else if (player.role === '内奸') {
            return `
                ${Object.keys(words)
                    .filter(team => team !== player.team)
                    .filter(team => words[team] !== '')
                    .map(team => `
                        <span class="word-displayer" style="background: ${teamColors[team]}">
                            ${words[team]}
                        </span>
                    `).join('')}
            `;
        }
    }

    return '-';
}

// 更新词语
function updateWord(team, word) {
    words[team] = word.trim();

    renderPlayers();
}

// 更新玩家信息
function updatePlayer(id, field, value) {
    const player = players.find(p => p.id === id);
    if (!player) return;
    
    player[field] = value;
    
    if (['白板','旅行者'].includes(player.role)) {
        player.team += '0'; // 旅行者和白板不属于任何队伍，该操作用来记录原来的队伍，方便之后恢复
        player.claims = [];
        player.whiteClaims = [];
    }

    // 如果一个白板和旅行者变成了常规玩家或内奸，恢复原来的队伍
    if (['常规','内奸'].includes(value)) {
        const originalTeam = player.team.slice(0, 1);
        if (['A','B','C'].includes(originalTeam)) {
            player.team = originalTeam;
        } else {
            player.team = 'A';
        }
    }
    
    renderPlayers();
}

// 更新指认信息
function updateClaims(id, value, field) {
    const player = players.find(p => p.id === id);
    if (!player) return;
    
    player[field] = [...new Set(value.split(/[,，、\ ]/))]
        .map(item => parseInt(item, 10))
        .filter(n => !isNaN(n) && Number.isInteger(n) && n > 0)
        .filter(n => n <= players.length);
    
    renderPlayers();
}

// 分析实际队伍构成
function analyzeTeams() {
    const teams = { A: [], B: [], C: [] };
    players.forEach(p => {
        if (['A','B','C'].includes(p.team)) {
            teams[p.team].push(p);
        }

        // if (p.role === '内奸') {
        //     // const actualTeam = p.team === 'A' ? 'B' : 'A';
        //     // teams[actualTeam].push(p);
        //     teams[p.team].push(p);
        // } else if (p.team) {
        //     teams[p.team].push(p);
        // }
    });
    // 如果有队伍是空的，删去
    for (const team in teams) {
        if (teams[team].length === 0) {
            delete teams[team];
        }
    }
    return teams;
}

// 计算得分
function calculateScores() {
    const teams = analyzeTeams();
    const whiteboardResults = analyzeWhiteboard();
    const whiteboardClaims = whiteboardResults[0];
    const playerCorrectWhiteboardClaims = whiteboardResults[1];
    
    const scores = players.map(p => ({
        id: p.id,
        name: p.name,
        // word: p.word,
        role: p.role,
        team: p.team,
        speech: p.speech,
        claims: p.claims,
        whiteClaims: p.whiteClaims,
        correctClaims: undefined,
        correctWhiteboardClaims: undefined,
        receivedWrongClaims: undefined,
        receivedTeammateClaims: undefined,
        isRevealed: undefined,
        score: undefined,
        teamScore: undefined,
        result: ''
    }));
    
    // 计算常规玩家和内奸
    players.forEach(player => {
        const scoreObj = scores.find(s => s.id === player.id);
        if (!scoreObj) return;
        
        if (['常规','内奸'].includes(player.role)) {
            const actualTeam = getActualTeam(player);
            const actualTeammates = actualTeam.filter(p => p.id !== player.id);
            
            // 正确指认数
            scoreObj.correctClaims = player.claims
                .filter(claimedId => actualTeammates.some(t => t.id === claimedId))
                .length;
            
            // 被非队友指认次数
            scoreObj.receivedWrongClaims = players
                .filter(p => p.role === '常规' || p.role === '内奸')
                .filter(p => p.claims.includes(player.id))
                .filter(p => !actualTeammates.some(t => t.id === p.id))
                .filter(p => p.id !== player.id)
                .length;
            
            // 是否被队友指认
            scoreObj.receivedTeammateClaims = actualTeammates.filter(t => t.claims.includes(player.id)).length;

            // 指认白板的情况
            scoreObj.correctWhiteboardClaims = playerCorrectWhiteboardClaims[player.id] || 0;

            // 计算得分
            scoreObj.score = (scoreObj.receivedTeammateClaims > 0)
                   ? scoreObj.correctClaims + scoreObj.receivedWrongClaims + scoreObj.correctWhiteboardClaims
                   : 0;
        }
        
        // 处理白板
        if (player.role === '白板') {
            scoreObj.result = judgeWhiteboard(player.id, whiteboardClaims);
            scoreObj.receivedWrongClaims = whiteboardClaims[player.id]?.teammateClaims || 0;
            scoreObj.isRevealed = whiteboardClaims[player.id]?.isRevealed || false;
        }
        
        // 处理旅行者
        if (player.role === '旅行者') {
            scoreObj.result = judgeTraveler(player.claims, teams);
        }
    });
    
    // 计算队伍总分
    const teamScoresArr = Object.keys(teams).map(team => {
        return {
            team: team,
            score: scores.filter(s => s.team === team).reduce((sum, s) => sum + s.score, 0),
            result: '平'
        }
    });

    if (teamScoresArr.length <= 1) {
        // 如果只有一个队伍，为平
        teamScoresArr.forEach(t => {
            t.result = '平';
        });
    } else {
        // 按分数降序排序
        teamScoresArr.sort((a, b) => b.score - a.score);

        const scoresOnly = teamScoresArr.map(t => t.score);
        const uniqueScores = [...new Set(scoresOnly)];
        
        if (teamScoresArr.length === 2) {
            // 两队并列
            if (uniqueScores.length === 1) {
                teamScoresArr[0].result = '平';
                teamScoresArr[1].result = '平';
            } else {
                teamScoresArr[0].result = '胜';
                teamScoresArr[1].result = '负';
            }
        }
        if (teamScoresArr.length === 3) {
            // 三队并列
            if (uniqueScores.length === 1) {
                teamScoresArr[0].result = '平';
                teamScoresArr[1].result = '平';
                teamScoresArr[2].result = '平';
            } else if (uniqueScores.length === 2) {
                // 有两队并列
                if (scoresOnly[0] === scoresOnly[1]) {
                    // 前两名并列
                    teamScoresArr[0].result = '胜';
                    teamScoresArr[1].result = '胜';
                    teamScoresArr[2].result = '负';
                } else {
                    // 后两名并列
                    teamScoresArr[0].result = '胜';
                    teamScoresArr[1].result = '负';
                    teamScoresArr[2].result = '负';
                }
            } else {
                // 没有并列
                teamScoresArr[0].result = '胜';
                teamScoresArr[1].result = '平';
                teamScoresArr[2].result = '负';
            }
        }
    }

    // 把 teamScore 应用到每个队员上
    scores.forEach(s => {
        const teamScore = teamScoresArr.find(t => t.team === s.team);
        if (teamScore) {
            s.teamScore = teamScore.score;
            s.result = teamScore.result;
        }
    });
    
    displayResults(scores, teamScoresArr, whiteboardClaims);
}

// 辅助函数：获取实际队伍
function getActualTeam(player) {
    const teams = analyzeTeams();
    // if (player.role === '内奸') {
    //     return teams[player.team === 'A' ? 'B' : 'A'];
    // }
    return teams[player.team] || [];
}

// 分析白板被指认情况
function analyzeWhiteboard() {
    const whiteboardCount = players.filter(p => p.role === '白板').length;
    const playerClaimsAboutWhiteboard = {};

    // 记录每个玩家指认白板正确的数量
    const playerCorrectWhiteboardClaims = {};
    
    players.forEach(p => {
        if (p.role !== '旅行者' && p.role !== '白板') {
            p.whiteClaims.forEach(id => {
                // 统计每个玩家被指认为白板的次数
                if (!playerClaimsAboutWhiteboard[id]) {
                    playerClaimsAboutWhiteboard[id] = 0;
                }
                playerClaimsAboutWhiteboard[id]++;

                // 统计每个玩家指认白板正确的数量
                if (!playerCorrectWhiteboardClaims[p.id]) {
                    playerCorrectWhiteboardClaims[p.id] = 0;
                }
                if (players.some(w => w.id === id && w.role === '白板')) {
                    playerCorrectWhiteboardClaims[p.id]++;
                }
            });
        }
    });

    // 排序
    let sortedWhiteboardClaims = Object.entries(playerClaimsAboutWhiteboard)
        .map(([id, count]) => ({ id: Number(id), count }))
        .sort((a, b) => b.count - a.count);

    // 记录所有与第k名并列的玩家的名次（在排序数组中的下标）
    const indicesOfKthTies = [];
    const kthCount = sortedWhiteboardClaims[whiteboardCount - 1]?.count;
    if (kthCount !== undefined) {
        sortedWhiteboardClaims.forEach((item, index) => {
            if (item.count === kthCount) {
                indicesOfKthTies.push(index);
            }
        });
    }

    // 返回前k名，但如果这些并列名次的最后一名超过k，则所有并列名次都被去掉
    let lastRank = sortedWhiteboardClaims.filter(item => item.count >= kthCount).length;
    if (indicesOfKthTies.length > 0 && indicesOfKthTies[indicesOfKthTies.length - 1] >= whiteboardCount) {
        // 如果这些并列名次的最后一名超过k，则所有并列名次都被去掉
        lastRank -= indicesOfKthTies.length;
    }

    sortedWhiteboardClaims = sortedWhiteboardClaims.slice(0, lastRank);

    const claims = {};
    players.filter(p => p.role === '白板').forEach(wp => {
        claims[wp.id] = {
            // 有多少玩家把这个白板当作自己队友（即 claims 里包含了白板的 id）
            teammateClaims: players.filter(p => p.claims.includes(wp.id)).length,
            // 有多少玩家把这个白板指认为白板（即 whiteClaims 里包含了白板的 id）
            whiteClaims: players.filter(p => p.whiteClaims.includes(wp.id)).length,
            // 这个白板是否被揭示出来（即在被指认为白板最多的前几名里）
            isRevealed: sortedWhiteboardClaims.some(item => item.id === wp.id)
        };
    });
    return [claims, playerCorrectWhiteboardClaims];
}

// 计算白板结果
function judgeWhiteboard(id, claims) {
    const data = claims[id];
    let result = '平';
    if (!data) result = '负';
    
    if (data.teammateClaims >= 2) {
        result = '胜';
    } else if (data.teammateClaims === 1 && !data.isRevealed) {
        result = '胜';
    } else if (data.teammateClaims === 1) {
        result = '平';
    } else {
        result = '负';
    }
    return result;
}

// 计算旅行者结果
function judgeTraveler(claims, teams) {
    const guessedPlayers = claims.map(Number);
    if (Object.values(teams).some(team => {
        const teamIds = team.map(p => p.id);
        return teamIds.length === guessedPlayers.length &&
               teamIds.every(id => guessedPlayers.includes(id));
    })) return '胜';
    return '负';
}

// 显示结果
function displayResults(scores, teamScores, whiteboardClaims) {
    const resultsDiv = document.getElementById('results');
    let html = `<h3>计分结果</h3>`;
    
    // 玩家得分表
    const hasWhiteboard = players.some(p => p.role === '白板');
    const teams = analyzeTeams();
    const teamNames = Object.keys(teams);
    const winningTeamNames = teamNames.filter(team => teamScores.some(t => t.team === team && t.result === '胜'));
    let mvps = [], svps = [];

    for (const team of teamNames) {
        // 计算 MVP 或 SVP
        const teamPlayers = teams[team];
        const maxScore = Math.max(...teamPlayers.map(p => scores.find(s => s.id === p.id).score));
        const mvpCandidates = teamPlayers.filter(p => scores.find(s => s.id === p.id).score === maxScore);
        const maxClaimedByTeammateInMvpCandidates = Math.max(...mvpCandidates.map(p => scores.find(s => s.id === p.id).receivedTeammateClaims));
        // 胜组为 mvp，平组或败组为 svp
        if (winningTeamNames.includes(team)) {
            const mvp = mvpCandidates.filter(p => scores.find(s => s.id === p.id).receivedTeammateClaims === maxClaimedByTeammateInMvpCandidates);
            mvps = mvps.concat(mvp);
        } else {
            const svp = mvpCandidates.filter(p => scores.find(s => s.id === p.id).receivedTeammateClaims === maxClaimedByTeammateInMvpCandidates);
            svps = svps.concat(svp);
        }
    }

    html += `<table>
        <tr>
            <th>玩家</th>
            <th>角色</th>
            <th>得知词语</th>
            <th>发言内容</th>
            <th>指认队友</th>
            ${hasWhiteboard ? '<th>指认白板</th>' : ''}
            <th>指认队友得分</th>
            ${hasWhiteboard ? '<th>指认白板得分</th>' : ''}
            <th>欺骗得分</th>
            <th>被队友指认</th>
            <th>得分</th>
            <th>队内总分</th>
            <th>结果</th>
        </tr>`;
    
    scores.forEach(s => {
        const claimsStr = s.claims.map(c => playerIdWrapper(scores.find(s => s.id === c))).join('');
        const whiteClaimsStr = hasWhiteboard ? s.whiteClaims.map(c => playerIdWrapper(scores.find(s => s.id === c))).join('') : '';
        const isClaimedByTeammates = s.receivedTeammateClaims === undefined ? '-' : s.receivedTeammateClaims > 0 ? '是' : '否';
        const isRevealed = s.isRevealed === undefined ? '-' : s.isRevealed ? '被揭露' : '未被揭露';

        html += `<tr style="background: ${teamColorsLight[s.team] || teamColorsLight[s.role]}">
            <td>${playerDisplayWrapper(s)}</td>
            <td>${s.role}</td>
            <td>${renderPlayerWord(s)}</td>
            <td>${s.speech.map(s => `<div style="font-size: small">
                <span>[${s.order}] ${s.content}</span>
            </div>`).join('')}</td>
            <td>${claimsStr ? claimsStr : '-'}</td>
            ${hasWhiteboard ? `<td>${whiteClaimsStr ? whiteClaimsStr : '-'}</td>` : ''}
            <td>${s.correctClaims === undefined ? '-' : `${s.correctClaims}`}</td>
            ${hasWhiteboard ? `<td>${s.correctWhiteboardClaims === undefined ? '-' : `${s.correctWhiteboardClaims}`}</td>` : ''}
            <td>${s.receivedWrongClaims === undefined ? '-' : `${s.receivedWrongClaims}`}</td>
            <td>${s.role === '白板' ? isRevealed : isClaimedByTeammates}</td>
            <td>${s.score === undefined ? '-' : s.score}</td>
            <td>${s.teamScore === undefined ? '-' : s.teamScore}</td>
            <td class="${s.result === '胜' ? 'win' : s.result === '平' ? 'draw' : 'lose'}">
            ${s.result} ${mvps.some(mvp => mvp.id === s.id) ? '<span class="mvp-badge">👑 MVP</span>' : 
                svps.some(svp => svp.id === s.id) ? '<span class="mvp-badge">🎉 SVP</span>' : ''}
            </td>
        </tr>`;
    });

    html += `</table>`;
    
    resultsDiv.innerHTML = html;
}

function saveGameStateToLocalStorage() {
    const gameState = {
        words: words,
        players: players
    };
    localStorage.setItem('gameState', JSON.stringify(gameState));
    return gameState;
}

function outputGameStateJSON() {
    const gameState = saveGameStateToLocalStorage(); // 执行输出时，先保存状态
    const jsonString = JSON.stringify(gameState);
    console.log(jsonString);
    alert(jsonString);
    // 复制到剪贴板
    navigator.clipboard.writeText(jsonString).then(() => {
        alert("游戏状态已复制到剪贴板");
    }).catch(err => {
        console.error('复制失败:', err);
        alert("复制失败，请手动复制");
    });
}

function readGameStateJSON() {
    const jsonString = prompt("请输入游戏状态的 JSON 字符串：");
    if (!jsonString) return;
    
    try {
        const gameState = JSON.parse(jsonString);
        words = gameState.words;
        players = gameState.players;
        renderPlayers();
    } catch (e) {
        alert("无效的 JSON 字符串");
    }
}

function showDialog(title, placeholder, dialogId, onConfirm) {
    const dialog = document.createElement('div');
    dialog.style.position = 'fixed';
    dialog.style.top = '50%';
    dialog.style.left = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.backgroundColor = 'white';
    dialog.style.padding = '20px';
    dialog.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    dialog.style.zIndex = '1000';

    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    dialog.appendChild(titleElement);

    const textarea = document.createElement('textarea');
    textarea.rows = 10;
    textarea.cols = 50;
    textarea.placeholder = placeholder;
    textarea.value = localStorage.getItem(dialogId) || '';
    dialog.appendChild(textarea);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '10px';
    buttonContainer.style.textAlign = 'right';

    const confirmButton = document.createElement('button');
    confirmButton.textContent = '确定';
    confirmButton.style.marginRight = '10px';
    confirmButton.onclick = () => {
        const input = textarea.value;
        document.body.removeChild(dialog);
        if (onConfirm) onConfirm(input);
    };

    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.onclick = () => {
        document.body.removeChild(dialog);
    };

    buttonContainer.appendChild(confirmButton);
    buttonContainer.appendChild(cancelButton);
    dialog.appendChild(buttonContainer);

    document.body.appendChild(dialog);
}

function readPlayerSpeech() {
    showDialog(
        "输入玩家发言",
        "请输入玩家发言（格式：X号 发言内容，每行一条，空行和#开头的行会被忽略）：",
        "playerSpeechInput",
        (speechInput) => {
            if (!speechInput) return;

            // 保存原始输入到 localStorage
            localStorage.setItem('playerSpeechInput', speechInput);

            const lines = speechInput.split('\n');
            const speechMap = {};
            let order = 0;

            lines.forEach((line, index) => {
                line = line.trim();
                if (!line || line.startsWith('#')) return; // 忽略空行和注释行

                const match = line.match(/^(\d+)[号:：]\s*(.+)$/);
                if (!match) {
                    alert(`第 ${index + 1} 行格式错误：${line}`);
                    throw new Error(`Invalid format on line ${index + 1}: ${line}`);
                }

                const playerId = parseInt(match[1], 10);
                if (isNaN(playerId) || playerId <= 0 || playerId > players.length) {
                    alert(`第 ${index + 1} 行玩家 ID 无效：${match[1]}`);
                    throw new Error(`Invalid player ID on line ${index + 1}: ${match[1]}`);
                }

                const speechContent = match[2].trim();

                if (!speechMap[playerId]) {
                    speechMap[playerId] = [];
                }
                order++;
                const speechRound = parseInt((order - 1) / players.length) + 1;
                const speechOrder = order % players.length === 0 ? players.length : order % players.length;
                speechMap[playerId].push({ order: `${speechRound}-${speechOrder}`, content: speechContent });
            });

            players.forEach(player => {
                player.speech = speechMap[player.id] || [];
            });

            renderPlayers();
        }
    );
}

function initGameState() {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
        const gameState = JSON.parse(savedState);
        words = gameState.words;
        players = gameState.players;
    } else {
        // 深拷贝
        players = JSON.parse(JSON.stringify(defaultPlayers));
    }
    renderPlayers();
}

// 页面加载时渲染玩家列表
window.onload = initGameState;
