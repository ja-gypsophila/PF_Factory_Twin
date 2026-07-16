const { WebSocketServer } = require('ws');

// ────────────────────────────────────────────────────────────
// 1. 기본 설정
// ────────────────────────────────────────────────────────────

const TICK_INTERVAL_MS = 1000;                 // 몇 ms마다 갱신할지 (3초 = 1틱)
const TICK_INTERVAL_SEC = TICK_INTERVAL_MS / 1000; // 초 단위(3) — 시간 누적 계산에 사용
const PORT = process.env.PORT || 8080;         // 배포 호스트(Render 등)가 주입하는 PORT 우선, 로컬은 8080

// 만들 설비 목록 
const MACHINE_SPECS = [
    { machineId: "M-001", name: "프레스기 1호기", type: "PRESS" },
    { machineId: "M-002", name: "용접기 1호기", type: "WELDER" },
    { machineId: "M-003", name: "사출성형기 1호기", type: "INJECTION" },
    { machineId: "M-004", name: "검사기 1호기", type: "INSPECTION" },
]


// 시뮬레이션 규칙을 한 곳에 모아둔 설정.
// "이 서버가 데이터를 어떻게 만들어내는가"를 여기만 보면 알 수 있다.
const SIM = {
    // 상태가 바뀔 때 각 상태가 뽑힐 확률 (나머지는 전부 RUNNING)
    downChance: 0.10,          // 고장(DOWN) 확률 10%
    idleChance: 0.15,          // 대기(IDLE) 확률 15% → 가동(RUNNING) 75% (가동률 ~87%)

    // 한 번 상태가 정해지면 몇 틱 동안 유지할지 (min, max)
    downHoldTicks: [3, 8],
    repairHoldTicks: [3, 6],
    idleHoldTicks: [2, 5],
    runHoldTicks: [5, 15],

    // 생산 관련 (사이클타임은 설비 종류별 TYPE_CYCLE_SEC에서 관리)
    performanceRange: [0.75, 1.0], // 성능 계수: 이상 속도의 75~100% (평균 ~87%, 변동 폭 넓힘)
    defectRate: 0.02,              // 불량률 10% (품질 ~90%, 목표에 붙임)

    // 온도 관련 (°C)
    startTemp: 25,             // 시작 온도
    minTemp: 20,               // 하한 (정지 중 여기까지만 식음)
    maxTemp: 45,               // 상한 (가동 중 여기까지만 오름)
    heatRange: [-0.1, 0.5],    // 가동 중 매 틱 온도 변화량 (평균 +0.2)
    coolRange: [0, 0.5],       // 정지 중 매 틱 하강량 (그만큼 빼줌)
};

// 설비 목표치 (서버에서 관리). 프론트는 이 값으로 현재값 대비 달성/미달을 판정한다.
const DEFAULT_TARGETS = {
    oee: 0.75,           // 목표 종합효율 (실측 평균 ~0.74 → 목표 언저리에서 달성/미달 교차)
    availability: 0.88,  // 목표 가동률 (실측 평균 ~0.87)
    performance: 0.90,   // 목표 성능 (실측 평균 ~0.87)
    quality: 0.98,       // 목표 품질 (실측 평균 ~0.98)
    tempWarning: 38,     // 온도 경고 임계치 (°C)
    tempCritical: 43,    // 온도 위험 임계치 (°C) — 상한 45 미만이라 도달 가능
    dailyCount: 5000,    // 설비당 하루 목표 생산량 (조업 12h 기준. 병목 사출기·하류 검사기는 미달, 상류는 달성)
};

// ────────────────────────────────────────────────────────────
// 조업 시간 + 라인 구성 (고정 병목)
//   조업: KST 08:00~19:59 (8시~19시, 12개 시간대 버킷)
//   그 외 시간은 설비 정지(IDLE) — 지표를 수집하지 않는다.
//   병목: 사출기의 사이클타임이 가장 길어 시간당 산출이 가장 낮다.
// ────────────────────────────────────────────────────────────
const OPERATING_HOURS = { start: 8, end: 19 }; // 19시 버킷(19:00~19:59)까지 수집
const LINE_ORDER = ["PRESS", "WELDER", "INJECTION", "INSPECTION"]; // 공정 순서 (앞 공정이 만든 만큼만 뒤 공정이 처리)
const BOTTLENECK_TYPE = "INJECTION"; // 사출기 = 고정 병목 (시간당 산출 최저)

// 설비 종류별 이상 사이클타임(초/개) — 사출기가 확실히 느려 병목이 된다.
// 시간당 산출 ≈ 3600 × 가동률(~0.86) × 성능(~0.87) / 사이클타임
//   → 프레스 ~480, 용접 ~465, 사출 ~375(병목), 검사 ~450이지만 재공품 부족으로 사출 수준에 묶임
const TYPE_CYCLE_SEC = {
    PRESS: [5.4, 5.9],
    WELDER: [5.6, 6.1],
    INJECTION: [6.9, 7.5],   // ← 병목 (최저 산출, 다른 설비와 겹치지 않게 확실히 느림)
    INSPECTION: [5.8, 6.3],
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

// 서울(KST) 기준 현재 "시" (0~23). Render는 UTC로 돌기 때문에 반드시 KST로 변환해서 판정한다.
function seoulHour(d = new Date()) {
    return Number(
        new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "numeric", hour12: false }).format(d)
    );
}

// 지금이 조업 시간(08:00~19:59 KST)인지
function isOperatingHours() {
    const h = seoulHour();
    return h >= OPERATING_HOURS.start && h <= OPERATING_HOURS.end;
}

// ────────────────────────────────────────────────────────────
// 3. WebSocket 서버 + 전송
// ────────────────────────────────────────────────────────────

// HTTP 서버에 WebSocket을 얹는다.
// - 배포 호스트(Render)의 포트 감지 / 헬스체크에 응답
// - keep-alive 핑용 /health 엔드포인트 제공 (무료 티어 잠들기 방지)
const http = require('http');
const httpServer = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok');
        return;
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Factory Twin WebSocket server');
});

const wss = new WebSocketServer({ server: httpServer });
httpServer.listen(PORT, () => {
    console.log(`서버 실행중: 포트 ${PORT}`);
});

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
function createMachine({ machineId, name, type }) {
    return {
        machineId,
        name,
        type,
        sensor: makeTypeSensors(type),
        targets: { ...DEFAULT_TARGETS },  // 목표치 복사본 (설비마다 따로 조정 가능하도록)
        status: 'RUNNING',                // 시작은 가동 중
        // hourProduction / isBottleneck 은 라인 생성 후 아래에서 주입
        statusHoldTicksLeft: randomInt(...SIM.runHoldTicks), // 현재 상태를 몇 틱 더 유지할지
        idealCycleTimeSec: randomFloat(...TYPE_CYCLE_SEC[type]), // 이상 사이클타임(종류별, 사출기=병목)
        unitProgress: 0,                  // 다음 1개 완성까지 진행률(0~1 누적)
        hourlyCounts: {},                 // 시간대별 실제 생산 실집계 { "8시": 132, "9시": 385, ... }
        plannedTimeSec: 0,                // 켜져 있던 총 시간
        runTimeSec: 0,                    // 실제 가동(RUNNING) 시간
        downCount: 0,                     // 고장 횟수
        downTimeSec: 0,                   // 수리시간
        totalCount: 0,                    // 총 생산 수
        goodCount: 0,                     // 양품 수
        defectCount: 0,                   // 불량 수
        temperature: SIM.startTemp,       // 현재 온도
    };
}

function makeTypeSensors(type) {
    switch (type) {
        case "PRESS": return { load: randomFloat(80, 120), spm: randomInt(30, 60) };
        case "WELDER": return { current: randomInt(150, 250), weldTemp: randomFloat(400, 600) };
        case "INJECTION": return { pressure: randomInt(800, 1200), moldTemp: randomFloat(180, 220) };
        case "INSPECTION": return { passRate: randomFloat(95, 99.9) };
        default: return {};
    }
}


// 설비 4대 생성
// const machines = MACHINE_IDS.map(createMachine);

const machines = MACHINE_SPECS.map(createMachine)
machines.forEach((m) => {
    m.isBottleneck = m.type === BOTTLENECK_TYPE;  // 병목 설비 여부

    // 라인 결합: 바로 앞 공정 설비 참조 (첫 공정 프레스는 null)
    // 뒤 공정은 앞 공정이 만든 것(재공품)보다 많이 생산할 수 없다 → 병목이 라인 전체를 지배
    const order = LINE_ORDER.indexOf(m.type);
    m.upstream = order > 0
        ? machines.find((x) => x.type === LINE_ORDER[order - 1]) ?? null
        : null;
});

// 서버가 조업 중간에 시작해도(재배포·재시작) 이미 지나간 시간대를 시뮬레이션으로 채워
// 차트·금일 지표가 비어 보이지 않게 한다. 현재 시간부터는 실제 생산을 집계한다. (하이브리드)
backfillPastHours();


// ────────────────────────────────────────────────────────────
// 5. 시뮬레이션 (매 틱마다 설비 상태를 진행시킴)
// ────────────────────────────────────────────────────────────

// 다음 상태와 유지 틱 수를 확률로 뽑는다.
function pickNextStatus(current) {
    // ── 강제 전이 (순서 고정) ──
    if (current === 'DOWN') {
        return { status: 'REPAIR', holdTicks: randomInt(...SIM.repairHoldTicks) };
    }
    if (current === 'REPAIR') {
        return { status: 'RUNNING', holdTicks: randomInt(...SIM.runHoldTicks) };
    }


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
        const next = pickNextStatus(machine.status);
        machine.status = next.status;
        machine.statusHoldTicksLeft = next.holdTicks;

        if (next.status === "DOWN") {
            machine.downCount += 1; // 새 고장 발생 시 1회 카운트
        }
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
    const hourKey = `${seoulHour()}시`; // 완성 시각이 속한 시간대 버킷
    while (machine.unitProgress >= 1) {
        // 라인 결합: 앞 공정이 만든 것(재공품)이 없으면 완성 불가 → 대기
        // (진행률은 1로 눌러둬서, 재공품이 생기는 순간 몰아서 터지지 않게 함)
        if (machine.upstream && machine.totalCount >= machine.upstream.totalCount) {
            machine.unitProgress = 1;
            break;
        }
        machine.unitProgress -= 1; // 나머지는 다음 제품으로 이월
        machine.totalCount += 1;
        machine.hourlyCounts[hourKey] = (machine.hourlyCounts[hourKey] ?? 0) + 1; // 시간대별 실집계
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
    } else if (machine.status === 'DOWN' || machine.status === "REPAIR") {
        machine.downTimeSec += TICK_INTERVAL_SEC; // 고장+정비 = 총 다운타임
    }

    updateTemperature(machine);                  // 온도 갱신
    machine.sensor = makeTypeSensors(machine.type);   // ← 추가: 매 틱 센서 갱신
}

//  최근 7일 가짜 생산량
const dailyProduction = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i)); // 6일 전 ~ 오늘
    return {
        date: date.toISOString().slice(0, 10),        // "2026-07-05"
        total: randomInt(19000, 23000),               // 그날 총 생산 (4대 합, 실집계 규모와 정렬)
        defect: randomInt(380, 460),                  // 그날 불량 (~2%)
    };
});

// ────────────────────────────────────────────────────────────
// 시간대 생산량: 실집계 → 차트 시리즈 변환 + 지나간 시간대 백필
// ────────────────────────────────────────────────────────────

// 설비의 시간대별 실집계(hourlyCounts)를 프론트 차트 형태로 변환한다.
// 조업 시작(8시)부터 "현재 시각"까지만 누적(우상향) 시리즈로 만든다.
// 반환: [{ hour: "8시", prod: 132 }, { hour: "9시", prod: 517 }, ...]
function buildHourSeries(machine) {
    const nowHour = seoulHour();
    const series = [];
    let cum = 0;
    for (let h = OPERATING_HOURS.start; h <= OPERATING_HOURS.end; h++) {
        if (h > nowHour) break; // 아직 오지 않은 시간대는 차트에 넣지 않음
        cum += machine.hourlyCounts[`${h}시`] ?? 0;
        series.push({ hour: `${h}시`, prod: cum });
    }
    return series;
}

// [백필] 지나간 1시간치를 시뮬레이션 수치로 채운다 (서버 재시작·조업 중간 기동 대비).
// 실제 tick 생산과 같은 공식(가동률×성능/사이클타임)을 쓰므로 실집계와 규모가 이어진다.
function backfillHour(machine, hourKey) {
    const planned = 3600;                                   // 그 시간대 계획시간
    const run = Math.round(3600 * randomFloat(0.80, 0.92)); // 실가동 시간 (가동률 ~86%)
    const perf = randomFloat(...SIM.performanceRange);      // 성능 계수
    let count = Math.floor((run * perf) / machine.idealCycleTimeSec); // 생산 개수

    // 라인 결합: 앞 공정 누적 산출을 넘을 수 없음 (실시간 produce와 같은 규칙)
    if (machine.upstream) {
        count = Math.max(0, Math.min(count, machine.upstream.totalCount - machine.totalCount));
    }
    const defects = Math.round(count * SIM.defectRate);

    machine.plannedTimeSec += planned;
    machine.runTimeSec += run;
    machine.totalCount += count;
    machine.defectCount += defects;
    machine.goodCount += count - defects;
    machine.hourlyCounts[hourKey] = (machine.hourlyCounts[hourKey] ?? 0) + count;

    // 시간당 절반 확률로 고장 1회 (MTBF/MTTR 산출용. 다운타임은 비가동 시간 안에서만)
    if (Math.random() < 0.5) {
        machine.downCount += 1;
        machine.downTimeSec += Math.min(randomInt(120, 420), planned - run);
    }
}

// [백필] 오늘 조업 시간 중 "이미 지나간" 시간대 전체를 채운다.
// (예: 15시에 서버가 켜지면 8~14시를 백필하고, 15시부터는 실집계)
// machines 배열은 공정 순서(LINE_ORDER)와 같아서, 같은 시간대 안에서
// 앞 공정이 먼저 채워진 뒤 뒤 공정이 그만큼만 처리한다.
function backfillPastHours() {
    const nowHour = seoulHour();
    for (let h = OPERATING_HOURS.start; h <= OPERATING_HOURS.end && h < nowHour; h++) {
        machines.forEach((m) => backfillHour(m, `${h}시`));
    }
}

// ────────────────────────────────────────────────────────────
// 6. 전송용 데이터 변환
// ────────────────────────────────────────────────────────────

// 내부 설비 객체에서 "프론트에 필요한 값만" 골라 깔끔한 형태로 변환한다.
// (statusHoldTicksLeft, unitProgress 같은 내부 계산용 값은 제외)
function serializeMachine(machine) {
    return {
        machineId: machine.machineId,
        name: machine.name,
        type: machine.type,
        isBottleneck: machine.isBottleneck, // 병목 설비 여부
        sensor: machine.sensor,
        targets: machine.targets,
        hourProduction: buildHourSeries(machine), // 시간대별 "실제" 생산 누적 (8시~현재)
        status: machine.status,
        temperature: Number(machine.temperature.toFixed(2)), // 숫자로 통일 (소수 2자리)
        metrics: {
            plannedTimeSec: Number(machine.plannedTimeSec.toFixed(1)),
            runTimeSec: Number(machine.runTimeSec.toFixed(1)),
            downCount: machine.downCount,
            downTimeSec: Number(machine.downTimeSec.toFixed(1)),
            idealCycleTimeSec: Number(machine.idealCycleTimeSec.toFixed(2)),
            totalCount: machine.totalCount,
            goodCount: machine.goodCount,
            defectCount: machine.defectCount,
        },
    };
}

// ────────────────────────────────────────────────────────────
// 7. 금일 데이터 일일 리셋 (자정, 한국시간 기준)
// ────────────────────────────────────────────────────────────

// 서울 기준 날짜 문자열 "YYYY-MM-DD" (Render는 UTC로 돌기 때문에 KST로 계산해야 진짜 자정에 리셋됨)
function seoulDateStr(d = new Date()) {
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

// 어제치 총계를 7일 이력(dailyProduction)에 반영하고, 가장 오래된 날 제거
function rolloverDaily(dayStr) {
    const total = machines.reduce((s, m) => s + m.totalCount, 0);
    const defect = machines.reduce((s, m) => s + m.defectCount, 0);
    dailyProduction.push({ date: dayStr, total, defect });
    if (dailyProduction.length > 7) dailyProduction.shift();
}

// 금일 누적 지표 초기화 (생산량·가동시간·고장 등 하루 단위 값)
function resetDaily() {
    machines.forEach((m) => {
        m.plannedTimeSec = 0;
        m.runTimeSec = 0;
        m.downCount = 0;
        m.downTimeSec = 0;
        m.totalCount = 0;
        m.goodCount = 0;
        m.defectCount = 0;
        m.unitProgress = 0;
        m.hourlyCounts = {};   // 시간대 실집계도 새 날로
    });
}

// ────────────────────────────────────────────────────────────
// 8. 메인 루프 (매 틱: 날짜 확인 → 전체 진행 → 전송)
// ────────────────────────────────────────────────────────────

let currentDay = seoulDateStr(); // 마지막으로 확인한 "오늘"

// 라인 최종 산출 = 마지막 공정(검사기)의 산출 → 대시보드 "시간대 생산량"에 사용
const inspectionMachine = machines.find((m) => m.type === "INSPECTION");

setInterval(() => {
    // ⓪ 날짜가 바뀌었으면 어제치를 이력에 넣고 금일 지표 리셋
    //    (틱마다 비교하므로, 자정에 서버가 잠들어 있었어도 깨어난 직후 따라잡아 리셋+백필)
    const today = seoulDateStr();
    if (today !== currentDay) {
        rolloverDaily(currentDay);
        resetDaily();
        backfillPastHours(); // 며칠 잠들었다 낮에 깨어난 경우: 오늘 지나간 시간대 채움
        currentDay = today;
        console.log(`날짜 변경 → ${today}, 금일 데이터 리셋`);
    }

    // ① 조업 시간(08~19시 KST)에만 생산·지표 누적. 그 외엔 설비 정지(IDLE)로 동결
    if (isOperatingHours()) {
        machines.forEach(tick); // 4대 전부 1초치 진행
    } else {
        machines.forEach((m) => {
            m.status = "IDLE";                       // 조업 종료 = 대기
            updateTemperature(m);                    // 온도만 자연 냉각
            m.sensor = makeTypeSensors(m.type);      // 센서 표시값 갱신
        });
    }

    broadcast({             // ② 결과를 모든 클라이언트에 전송 (24시간 계속)
        timestamp: new Date().toISOString(),
        machines: machines.map(serializeMachine),
        dailyProduction,
        lineHourProduction: buildHourSeries(inspectionMachine), // 라인 최종 산출(검사기) 실집계
    });
}, TICK_INTERVAL_MS);

// ────────────────────────────────────────────────────────────
// 9. 접속 로그
// ────────────────────────────────────────────────────────────

wss.on('connection', (socket) => {
    console.log(`클라이언트 연결됨 (현재 접속자 수: ${wss.clients.size}명)`);
    socket.on('close', () => {
        console.log('클라이언트 연결 종료');
    });
});
