const { WebSocketServer } = require('ws');

const TICK_INTERVAL_MS = 3000;
const TICK_INTERVAL_SEC = TICK_INTERVAL_MS / 1000;
const MACHINE_IDS = ['M-001', 'M-002', 'M-003', 'M-004'];

// 설비 목표치 (서버에서 관리). 클라이언트는 이 값으로 현재값 대비 달성/미달을 판정한다.
const DEFAULT_TARGETS = {
    oee: 0.80,           // 목표 종합효율 (실측 평균 ~0.82 → 평소 달성, 가끔 미달)
    availability: 0.88,  // 목표 가동률 (실측 평균 ~0.90)
    performance: 0.90,   // 목표 성능 (실측 평균 ~0.92)
    quality: 0.98,       // 목표 품질 (불량률 2% 이내, 실측 ~0.99)
    tempWarning: 38,     // 온도 경고 임계치 (°C)
    tempCritical: 43,    // 온도 위험 임계치 (°C) — 상한 45 미만이라 도달 가능
};

const wss = new WebSocketServer({ port: 8080 });
console.log(`서버 실행중: ws://localhost:${wss.address().port}`);

function broadcast(data) {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(message);
        }
    })
}

function randomInt(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
}

function pickNextStatus() {
    const roll = Math.random();
    if (roll < 0.08) return { status: 'DOWN', ticks: randomInt(3, 8) };
    if (roll < 0.2) return { status: 'IDLE', ticks: randomInt(2, 5) };
    return { status: 'RUNNING', ticks: randomInt(5, 15) };
}

const machines = MACHINE_IDS.map((machineId) => ({
    machineId,
    targets: { ...DEFAULT_TARGETS }, // 설비별 목표치 (필요 시 머신마다 다르게 조정 가능)
    status: 'RUNNING',
    statusTicksRemaining: randomInt(5, 15),
    idealCycleTimeSec: 2 + Math.random() * 2, // 머신별 고정 이상 사이클타임 (2~4초)
    unitProgress: 0, // 다음 한 개를 만들기까지의 진행률(0~1 누적)
    plannedTimeSec: 0,
    runTimeSec: 0,
    totalCount: 0,
    goodCount: 0,
    defectCount: 0,
    temperature: 25,
}));

function tick(machine) {
    machine.plannedTimeSec += TICK_INTERVAL_SEC;

    if (machine.statusTicksRemaining <= 0) {
        const next = pickNextStatus();
        machine.status = next.status;
        machine.statusTicksRemaining = next.ticks;
    }
    machine.statusTicksRemaining -= 1;

    if (machine.status === 'RUNNING') {
        machine.runTimeSec += TICK_INTERVAL_SEC;

        const performanceFactor = 0.85 + Math.random() * 0.15; // 이상 속도의 85~100%
        const actualCycleTimeSec = machine.idealCycleTimeSec / performanceFactor;
        machine.unitProgress += TICK_INTERVAL_SEC / actualCycleTimeSec;

        while (machine.unitProgress >= 1) {
            machine.unitProgress -= 1;
            machine.totalCount += 1;
            if (Math.random() < 0.01) { // 1% 불량률 (품질 ~99%, 목표 98% 평소 달성)
                machine.defectCount += 1;
            } else {
                machine.goodCount += 1;
            }
        }

        machine.temperature = Math.min(45, machine.temperature + (Math.random() * 0.6 - 0.1));
    } else {
        machine.temperature = Math.max(20, machine.temperature - Math.random() * 0.5);
    }
}

setInterval(() => {
    machines.forEach(tick);

    broadcast({
        timestamp: new Date().toISOString(),
        machines: machines.map((m) => ({
            machineId: m.machineId,
            targets: m.targets,
            status: m.status,
            temperature: m.temperature.toFixed(2),
            metrics: {
                plannedTimeSec: Number(m.plannedTimeSec.toFixed(1)),
                runTimeSec: Number(m.runTimeSec.toFixed(1)),
                idealCycleTimeSec: Number(m.idealCycleTimeSec.toFixed(2)),
                totalCount: m.totalCount,
                goodCount: m.goodCount,
                defectCount: m.defectCount,
            },
        })),
    });
}, TICK_INTERVAL_MS);

wss.on('connection', (socket) => {
    console.log(`클라이언트 연결됨 (현재 접속자 수: ${wss.clients.size}명)`);
    socket.on('close', () => {
        console.log('클라이언트 연결 종료');
    });
});
