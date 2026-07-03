const { WebSocketServer } = require('ws');

// ────────────────────────────────────────────────────────────
// 1. 기본 설정
// ────────────────────────────────────────────────────────────

const TICK_INTERVAL_MS = 3000;                 // 몇 ms마다 갱신할지 (3초 = 1틱)
const TICK_INTERVAL_SEC = TICK_INTERVAL_MS / 1000; // 초 단위(3) — 시간 누적 계산에 사용
const PORT = 8080;                             // WebSocket 서버 포트

const MACHINE_IDS = ['M-001', 'M-002', 'M-003', 'M-004']; // 만들 설비 목록

// 시뮬레이션 규칙을 한 곳에 모아둔 설정.
// "이 서버가 데이터를 어떻게 만들어내는가"를 여기만 보면 알 수 있다.
const SIM = {
    // 상태가 바뀔 때 각 상태가 뽑힐 확률 (나머지는 전부 RUNNING)
    downChance: 0.08,          // 고장(DOWN) 확률 8%
    idleChance: 0.12,          // 대기(IDLE) 확률 12% → 가동(RUNNING) 80%

    // 한 번 상태가 정해지면 몇 틱 동안 유지할지 (min, max)
    downHoldTicks: [3, 8],
    idleHoldTicks: [2, 5],
    runHoldTicks: [5, 15],

    // 생산 관련
    cycleTimeSecRange: [2, 4],     // 이상적으로 1개 만드는 시간(초). 기계마다 고정
    performanceRange: [0.85, 1.0], // 성능 계수: 이상 속도의 85~100%로 랜덤 변동
    defectRate: 0.01,              // 불량률 1%

    // 온도 관련 (°C)
    startTemp: 25,             // 시작 온도
    minTemp: 20,               // 하한 (정지 중 여기까지만 식음)
    maxTemp: 45,               // 상한 (가동 중 여기까지만 오름)
    heatRange: [-0.1, 0.5],    // 가동 중 매 틱 온도 변화량 (평균 +0.2)
    coolRange: [0, 0.5],       // 정지 중 매 틱 하강량 (그만큼 빼줌)
};

// 설비 목표치 (서버에서 관리). 프론트는 이 값으로 현재값 대비 달성/미달을 판정한다.
const DEFAULT_TARGETS = {
    oee: 0.80,           // 목표 종합효율 (실측 평균 ~0.82 → 평소 달성, 가끔 미달)
    availability: 0.88,  // 목표 가동률 (실측 평균 ~0.90)
    performance: 0.90,   // 목표 성능 (실측 평균 ~0.92)
    quality: 0.98,       // 목표 품질 (불량률 2% 이내, 실측 ~0.99)
    tempWarning: 38,     // 온도 경고 임계치 (°C)
    tempCritical: 43,    // 온도 위험 임계치 (°C) — 상한 45 미만이라 도달 가능
};

// ────────────────────────────────────────────────────────────
// 2. 도우미 함수
// ────────────────────────────────────────────────────────────

// min~max 사이 "정수" 랜덤 (양쪽 끝 포함)
function randomInt(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
}

// min~max 사이 "실수" 랜덤
function randomFloat(min, max) {
    return min + Math.random() * (max - min);
}

// ────────────────────────────────────────────────────────────
// 3. WebSocket 서버 + 전송
// ────────────────────────────────────────────────────────────

const wss = new WebSocketServer({ port: PORT });
console.log(`서버 실행중: ws://localhost:${wss.address().port}`);

// 접속 중인 모든 클라이언트(브라우저)에게 같은 데이터를 뿌린다.
function broadcast(data) {
    const message = JSON.stringify(data); // 전송은 문자열로만 가능 → 객체를 문자열로
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) { // 연결이 살아있는 클라이언트에게만
            client.send(message);
        }
    });
}

// ────────────────────────────────────────────────────────────
// 4. 설비 상태 만들기
// ────────────────────────────────────────────────────────────

// 설비 한 대의 "초기 상태" 객체를 만든다.
function createMachine(machineId) {
    return {
        machineId,
        targets: { ...DEFAULT_TARGETS },  // 목표치 복사본 (설비마다 따로 조정 가능하도록)
        status: 'RUNNING',                // 시작은 가동 중
        statusHoldTicksLeft: randomInt(...SIM.runHoldTicks), // 현재 상태를 몇 틱 더 유지할지
        idealCycleTimeSec: randomFloat(...SIM.cycleTimeSecRange), // 이상 사이클타임(고정)
        unitProgress: 0,                  // 다음 1개 완성까지 진행률(0~1 누적)
        plannedTimeSec: 0,                // 켜져 있던 총 시간
        runTimeSec: 0,                    // 실제 가동(RUNNING) 시간
        totalCount: 0,                    // 총 생산 수
        goodCount: 0,                     // 양품 수
        defectCount: 0,                   // 불량 수
        temperature: SIM.startTemp,       // 현재 온도
    };
}

// 설비 4대 생성
const machines = MACHINE_IDS.map(createMachine);

// ────────────────────────────────────────────────────────────
// 5. 시뮬레이션 (매 틱마다 설비 상태를 진행시킴)
// ────────────────────────────────────────────────────────────

// 다음 상태와 유지 틱 수를 확률로 뽑는다.
function pickNextStatus() {
    const roll = Math.random();
    if (roll < SIM.downChance) {
        return { status: 'DOWN', holdTicks: randomInt(...SIM.downHoldTicks) };
    }
    if (roll < SIM.downChance + SIM.idleChance) {
        return { status: 'IDLE', holdTicks: randomInt(...SIM.idleHoldTicks) };
    }
    return { status: 'RUNNING', holdTicks: randomInt(...SIM.runHoldTicks) };
}

// (1) 상태 전환: 유지 시간이 끝났으면 새 상태를 뽑고, 이번 틱을 소모한다.
function advanceStatus(machine) {
    if (machine.statusHoldTicksLeft <= 0) {
        const next = pickNextStatus();
        machine.status = next.status;
        machine.statusHoldTicksLeft = next.holdTicks;
    }
    machine.statusHoldTicksLeft -= 1;
}

// (2) 생산: 가동 중일 때만 제품을 만들고 양품/불량을 판정한다.
function produce(machine) {
    machine.runTimeSec += TICK_INTERVAL_SEC;

    // 성능 계수만큼 실제 속도가 이상 속도보다 느려진다 → 실제 사이클타임이 길어짐
    const performanceFactor = randomFloat(...SIM.performanceRange);
    const actualCycleTimeSec = machine.idealCycleTimeSec / performanceFactor;

    // 이번 틱(3초) 동안 진행한 만큼 진행률을 누적
    machine.unitProgress += TICK_INTERVAL_SEC / actualCycleTimeSec;

    // 진행률이 1을 넘을 때마다 제품 1개 완성 (한 틱에 여러 개 나올 수 있어 while)
    while (machine.unitProgress >= 1) {
        machine.unitProgress -= 1; // 나머지는 다음 제품으로 이월
        machine.totalCount += 1;
        if (Math.random() < SIM.defectRate) {
            machine.defectCount += 1; // 불량
        } else {
            machine.goodCount += 1;   // 양품
        }
    }
}

// (3) 온도: 가동 중이면 오르고(상한까지), 아니면 식는다(하한까지).
function updateTemperature(machine) {
    if (machine.status === 'RUNNING') {
        const heated = machine.temperature + randomFloat(...SIM.heatRange);
        machine.temperature = Math.min(SIM.maxTemp, heated);
    } else {
        const cooled = machine.temperature - randomFloat(...SIM.coolRange);
        machine.temperature = Math.max(SIM.minTemp, cooled);
    }
}

// 설비 한 대의 3초치 변화를 계산 (위 3단계를 순서대로 실행)
function tick(machine) {
    machine.plannedTimeSec += TICK_INTERVAL_SEC; // 켜져 있는 시간은 무조건 증가
    advanceStatus(machine);                      // 상태 전환
    if (machine.status === 'RUNNING') {
        produce(machine);                        // 생산 (가동 중에만)
    }
    updateTemperature(machine);                  // 온도 갱신
}

// ────────────────────────────────────────────────────────────
// 6. 전송용 데이터 변환
// ────────────────────────────────────────────────────────────

// 내부 설비 객체에서 "프론트에 필요한 값만" 골라 깔끔한 형태로 변환한다.
// (statusHoldTicksLeft, unitProgress 같은 내부 계산용 값은 제외)
function serializeMachine(machine) {
    return {
        machineId: machine.machineId,
        targets: machine.targets,
        status: machine.status,
        temperature: Number(machine.temperature.toFixed(2)), // 숫자로 통일 (소수 2자리)
        metrics: {
            plannedTimeSec: Number(machine.plannedTimeSec.toFixed(1)),
            runTimeSec: Number(machine.runTimeSec.toFixed(1)),
            idealCycleTimeSec: Number(machine.idealCycleTimeSec.toFixed(2)),
            totalCount: machine.totalCount,
            goodCount: machine.goodCount,
            defectCount: machine.defectCount,
        },
    };
}

// ────────────────────────────────────────────────────────────
// 7. 메인 루프 (매 틱: 전체 진행 → 전송)
// ────────────────────────────────────────────────────────────

setInterval(() => {
    machines.forEach(tick); // ① 4대 전부 3초치 진행

    broadcast({             // ② 결과를 모든 클라이언트에 전송
        timestamp: new Date().toISOString(),
        machines: machines.map(serializeMachine),
    });
}, TICK_INTERVAL_MS);

// ────────────────────────────────────────────────────────────
// 8. 접속 로그
// ────────────────────────────────────────────────────────────

wss.on('connection', (socket) => {
    console.log(`클라이언트 연결됨 (현재 접속자 수: ${wss.clients.size}명)`);
    socket.on('close', () => {
        console.log('클라이언트 연결 종료');
    });
});
