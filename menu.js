// =============== MENU.JS ===============
// Contains all menu and UI related functions

function startGame(scene) {
    if (gameStarted) return;
    gameStarted = true;
    try {
        if (menuContainer) menuContainer.destroy();
    } catch (e) {}
    spawnWave(scene);
}

async function loadScoreboard(scene, textObj) {
    if (!textObj) return;
    textObj.setText('Loading...');

    // Helper: normalize an entry to { name, score, wave, date, source }
    const normalize = (s, source) => {
        if (!s) return null;
        if (Array.isArray(s)) {
            return {
                name: String(s[0] || 'Anon'),
                score: Number(s[1] || 0) || 0,
                wave: null,
                date: null,
                source
            };
        }
        if (typeof s === 'object') {
            return {
                name: String(s.name || s.player || 'Anon'),
                score: Number(s.score ?? s.points ?? 0) || 0,
                wave: s.wave ?? null,
                date: s.date ?? null,
                source
            };
        }
        // primitive
        return { name: String(s), score: 0, wave: null, date: null, source };
    };

    let serverList = [];
    try {
        const res = await fetch('/scores');
        if (res && res.ok) {
            let data = await res.json();
            if (!Array.isArray(data)) {
                if (data && Array.isArray(data.scores)) data = data.scores;
                else data = [];
            }
            serverList = data.map(s => normalize(s, 'server')).filter(Boolean);
        }
    } catch (err) {
        console.warn('Failed to fetch server scores:', err);
        serverList = [];
    }

    // Load local scores saved when submit failed
    let localList = [];
    try {
        const key = 'base_defender_local_scores_v1';
        const raw = localStorage.getItem(key);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                localList = parsed.map(s => normalize(s, 'local')).filter(Boolean);
            }
        }
    } catch (err) {
        console.warn('Failed to read local scores:', err);
    }

    const combined = serverList.concat(localList);
    if (combined.length === 0) {
        textObj.setText('No scores yet');
        return;
    }

    // sort by score desc
    combined.sort((a, b) => (b.score || 0) - (a.score || 0));

    const lines = combined.slice(0, 10).map((s, i) => {
        const wavePart = s.wave ? ` (W${s.wave})` : '';
        const src =
            s.source === 'local' &&
            !serverList.find(ss => ss.name === s.name && ss.score === s.score)
                ? ' [local]'
                : '';
        return `${i + 1}. ${s.name} — ${s.score}${wavePart}${src}`;
    });

    textObj.setText(lines.join('\n'));
}

function showGameOverPrompt(scene, meta) {
    if (typeof document === 'undefined') {
        location.reload();
        return;
    }

    if (window.__gd_prompt_shown) return;
    window.__gd_prompt_shown = true;

    const score = (meta && meta.score) || 0;
    const waves = (meta && meta.wave) || 0;

    const overlay = document.createElement('div');
    overlay.id = 'gd-gameover-overlay';
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(0,0,0,0.75)';
    overlay.style.zIndex = 10000;

    const box = document.createElement('div');
    box.style.background = '#111';
    box.style.color = '#fff';
    box.style.padding = '20px';
    box.style.borderRadius = '8px';
    box.style.minWidth = '320px';
    box.style.textAlign = 'center';

    const title = document.createElement('h2');
    title.innerText = 'Game Over';
    title.style.marginTop = '0';

    const info = document.createElement('p');
    info.innerText = `Score: ${score}   Wave: ${waves}`;

    const label = document.createElement('label');
    label.innerText = 'Enter name for scoreboard:';
    label.style.display = 'block';
    label.style.margin = '12px 0 6px 0';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Your name';
    input.style.width = '90%';
    input.style.padding = '8px';
    input.style.borderRadius = '4px';
    input.style.border = '1px solid #333';

    const btnRow = document.createElement('div');
    btnRow.style.marginTop = '14px';
    btnRow.style.display = 'flex';
    btnRow.style.justifyContent = 'center';
    btnRow.style.gap = '10px';

    const submitBtn = document.createElement('button');
    submitBtn.innerText = 'Submit';
    submitBtn.style.padding = '8px 14px';
    submitBtn.style.cursor = 'pointer';

    const skipBtn = document.createElement('button');
    skipBtn.innerText = 'Skip';
    skipBtn.style.padding = '8px 14px';
    skipBtn.style.cursor = 'pointer';

    const status = document.createElement('div');
    status.style.marginTop = '10px';
    status.style.fontSize = '14px';

    btnRow.appendChild(submitBtn);
    btnRow.appendChild(skipBtn);

    box.appendChild(title);
    box.appendChild(info);
    box.appendChild(label);
    box.appendChild(input);
    box.appendChild(btnRow);
    box.appendChild(status);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    function cleanupAndReload() {
        try {
            document.body.removeChild(overlay);
        } catch (e) {}
        window.__gd_prompt_shown = false;
        location.reload();
    }

    skipBtn.addEventListener('click', () => {
        cleanupAndReload();
    });

    submitBtn.addEventListener('click', async () => {
        const name = (input.value || 'Anon').trim().substring(0, 32);
        status.innerText = 'Saving...';
        submitBtn.disabled = true;
        skipBtn.disabled = true;
        try {
            await submitScore({ name, score, wave: waves });
            status.innerText = 'Saved! Returning to menu...';
            setTimeout(cleanupAndReload, 900);
        } catch (e) {
            status.innerText = 'Failed to save remotely — saved locally.';
            setTimeout(cleanupAndReload, 900);
        }
    });

    input.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') submitBtn.click();
    });
}

async function submitScore(payload) {
    try {
        const res = await fetch('/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Network response not ok');
        return await res.json();
    } catch (e) {
        try {
            const key = 'base_defender_local_scores_v1';
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.push({
                name: payload.name,
                score: payload.score,
                wave: payload.wave,
                date: new Date().toISOString()
            });
            localStorage.setItem(key, JSON.stringify(existing));
        } catch (err) {
            console.warn('Failed to save locally', err);
        }
        throw e;
    }
}

function createPauseMenuUI(scene) {
    const pauseContainer = scene.add.container(0, 0).setDepth(200);
    const pauseBg = scene.add
        .rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0.6)
        .setOrigin(0);
    const pauseTitle = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 - 100, 'PAUSED', {
            fontSize: '44px',
            fill: '#fff'
        })
        .setOrigin(0.5);

    // Resume button
    const resumeBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 - 10, 'Resume Game', {
            fontSize: '28px',
            fill: '#0f0',
            backgroundColor: '#222'
        })
        .setOrigin(0.5)
        .setPadding(10)
        .setInteractive({ useHandCursor: true });

    // Controls button
    const controlsBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 50, 'Controls', {
            fontSize: '28px',
            fill: '#0ff',
            backgroundColor: '#222'
        })
        .setOrigin(0.5)
        .setPadding(10)
        .setInteractive({ useHandCursor: true });

    // Exit button
    const exitBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 110, 'Exit to Menu', {
            fontSize: '28px',
            fill: '#ff0',
            backgroundColor: '#222'
        })
        .setOrigin(0.5)
        .setPadding(10)
        .setInteractive({ useHandCursor: true });

    // Controls panel (hidden by default)
    const controlsPanel = scene.add.container(0, 0).setVisible(false);
    const panelBg = scene.add
        .rectangle(
            scene.scale.width / 2 - 260,
            scene.scale.height / 2 - 120,
            520,
            260,
            0x111111,
            0.95
        )
        .setOrigin(0);
    const controlsTitle = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 - 80, 'Controls', {
            fontSize: '36px',
            fill: '#fff'
        })
        .setOrigin(0.5);
    const controlsText = scene.add
        .text(
            scene.scale.width / 2,
            scene.scale.height / 2 - 20,
            'Move: WASD or Arrow keys\nShoot: SPACE\nMelee: E\nPause: ESC',
            { fontSize: '20px', fill: '#ddd', align: 'center' }
        )
        .setOrigin(0.5);
    const backBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 80, 'Back', {
            fontSize: '22px',
            fill: '#fff',
            backgroundColor: '#333'
        })
        .setOrigin(0.5)
        .setPadding(8)
        .setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
        controlsPanel.setVisible(false);
        resumeBtn.setVisible(true);
        controlsBtn.setVisible(true);
        exitBtn.setVisible(true);
    });
    controlsPanel.add([panelBg, controlsTitle, controlsText, backBtn]);

    // Resume button handler
    resumeBtn.on('pointerdown', () => {
        gamePaused = false;
        pauseContainer.setVisible(false);
    });

    // Controls button handler
    controlsBtn.on('pointerdown', () => {
        controlsPanel.setVisible(true);
        resumeBtn.setVisible(false);
        controlsBtn.setVisible(false);
        exitBtn.setVisible(false);
    });

    // Exit button handler
    exitBtn.on('pointerdown', () => {
        gamePaused = false;
        gameStarted = false;
        pauseContainer.setVisible(false);
        try {
            if (menuContainer) menuContainer.setVisible(true);
        } catch (e) {}
        location.reload();
    });

    pauseContainer.add([pauseBg, pauseTitle, resumeBtn, controlsBtn, exitBtn, controlsPanel]);
    return pauseContainer;
}

function createMenuUI(scene) {
    const menuContainer = scene.add.container(0, 0).setDepth(200);
    const menuBg = scene.add
        .rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0.6)
        .setOrigin(0);
    const title = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 - 80, 'Base Defender', {
            fontSize: '48px',
            fill: '#fff'
        })
        .setOrigin(0.5);

    // Main menu buttons
    const startBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 10, 'Start Game', {
            fontSize: '28px',
            fill: '#0f0',
            backgroundColor: '#222'
        })
        .setOrigin(0.5)
        .setPadding(10)
        .setInteractive({ useHandCursor: true });

    const controlsBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 70, 'Controls', {
            fontSize: '28px',
            fill: '#0ff',
            backgroundColor: '#222'
        })
        .setOrigin(0.5)
        .setPadding(10)
        .setInteractive({ useHandCursor: true });

    const scoreboardBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 130, 'Scoreboard', {
            fontSize: '28px',
            fill: '#ff0',
            backgroundColor: '#222'
        })
        .setOrigin(0.5)
        .setPadding(10)
        .setInteractive({ useHandCursor: true });

    // Controls panel (hidden by default)
    const controlsPanel = scene.add.container(0, 0).setVisible(false);
    const panelBg = scene.add
        .rectangle(
            scene.scale.width / 2 - 260,
            scene.scale.height / 2 - 120,
            520,
            260,
            0x111111,
            0.95
        )
        .setOrigin(0);
    const controlsTitle = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 - 80, 'Controls', {
            fontSize: '36px',
            fill: '#fff'
        })
        .setOrigin(0.5);
    const controlsText = scene.add
        .text(
            scene.scale.width / 2,
            scene.scale.height / 2 - 20,
            'Move: WASD or Arrow keys\nShoot: SPACE\nMelee: E\nStart: ENTER or click Start Game',
            { fontSize: '20px', fill: '#ddd', align: 'center' }
        )
        .setOrigin(0.5);
    const backBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 80, 'Back', {
            fontSize: '22px',
            fill: '#fff',
            backgroundColor: '#333'
        })
        .setOrigin(0.5)
        .setPadding(8)
        .setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
        controlsPanel.setVisible(false);
        startBtn.setVisible(true);
        controlsBtn.setVisible(true);
    });
    controlsPanel.add([panelBg, controlsTitle, controlsText, backBtn]);

    // Scoreboard panel (hidden by default)
    const scoreboardPanel = scene.add.container(0, 0).setVisible(false);
    const sbBg = scene.add
        .rectangle(
            scene.scale.width / 2 - 260,
            scene.scale.height / 2 - 140,
            520,
            300,
            0x0b0b0b,
            0.95
        )
        .setOrigin(0);
    const sbTitle = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 - 100, 'Scoreboard', {
            fontSize: '36px',
            fill: '#fff'
        })
        .setOrigin(0.5);
    const scoresText = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 - 40, 'Loading...', {
            fontSize: '20px',
            fill: '#ddd',
            align: 'center'
        })
        .setOrigin(0.5);
    const sbRefresh = scene.add
        .text(scene.scale.width / 2 - 60, scene.scale.height / 2 + 100, 'Refresh', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#333'
        })
        .setOrigin(0.5)
        .setPadding(8)
        .setInteractive({ useHandCursor: true });
    const sbBack = scene.add
        .text(scene.scale.width / 2 + 60, scene.scale.height / 2 + 100, 'Back', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#333'
        })
        .setOrigin(0.5)
        .setPadding(8)
        .setInteractive({ useHandCursor: true });
    sbBack.on('pointerdown', () => {
        scoreboardPanel.setVisible(false);
        startBtn.setVisible(true);
        controlsBtn.setVisible(true);
        scoreboardBtn.setVisible(true);
    });
    sbRefresh.on('pointerdown', () => loadScoreboard(scene, scoresText));
    scoreboardPanel.add([sbBg, sbTitle, scoresText, sbRefresh, sbBack]);

    // Wire up main menu actions
    startBtn.on('pointerdown', () => startGame(scene));
    scene.input.keyboard.on('keydown-ENTER', () => startGame(scene));
    controlsBtn.on('pointerdown', () => {
        // show controls and hide main buttons
        controlsPanel.setVisible(true);
        startBtn.setVisible(false);
        controlsBtn.setVisible(false);
        scoreboardBtn.setVisible(false);
    });

    scoreboardBtn.on('pointerdown', () => {
        // show scoreboard and hide main buttons
        scoreboardPanel.setVisible(true);
        startBtn.setVisible(false);
        controlsBtn.setVisible(false);
        scoreboardBtn.setVisible(false);
        loadScoreboard(scene, scoresText);
    });

    menuContainer.add([menuBg, title, startBtn, controlsBtn, scoreboardBtn, controlsPanel, scoreboardPanel]);
    return menuContainer;
}
