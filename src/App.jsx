import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#050A14", card: "#0D1526", input: "#080F1E", border: "#1A2A4A",
  blue: "#1E6FD9", blueL: "#2E8AFF", green: "#00C48C", orange: "#F97316",
  white: "#F1F5FB", gray: "#6B7A99", grayL: "#9BA8BF", red: "#EF4444",
};

const BLOCKS = [
  {
    id: "trend", step: 1, label: "Dirección de Tendencia", desc: "Cómo filtra la dirección del mercado", color: "#2E8AFF", icon: "📈",
    options: [
      { id: "ema50", label: "EMA 50", desc: "Media móvil de largo plazo como soporte/resistencia dinámica", params: [{ id: "len", label: "Período", default: 50, min: 10, max: 200 }] },
      { id: "supertrend", label: "Supertrend", desc: "Banda ATR dinámica que define tendencia alcista o bajista", params: [{ id: "atr", label: "ATR Período", default: 10, min: 5, max: 30 }, { id: "factor", label: "Factor", default: 3.0, min: 1.0, max: 5.0, step: 0.1 }] },
      { id: "vwap", label: "VWAP", desc: "Precio promedio ponderado por volumen. Referencia institucional intradía", params: [] },
      { id: "adx", label: "ADX", desc: "Mide la fuerza de tendencia. Opera solo cuando hay dirección clara", params: [{ id: "len", label: "Período ADX", default: 14, min: 7, max: 30 }, { id: "threshold", label: "Umbral mínimo", default: 25, min: 15, max: 50 }] },
    ],
  },
  {
    id: "entry", step: 2, label: "Señal de Entrada", desc: "Qué genera la señal de compra/venta", color: "#00C48C", icon: "⚡",
    options: [
      { id: "ema_cross", label: "Cruce de EMAs", desc: "EMA rápida cruza EMA lenta. Captura inicio de movimiento", params: [{ id: "fast", label: "EMA Rápida", default: 9, min: 3, max: 50 }, { id: "slow", label: "EMA Lenta", default: 21, min: 10, max: 100 }] },
      { id: "rsi", label: "RSI Extremos", desc: "Entra cuando RSI sale de sobrecompra o sobreventa", params: [{ id: "len", label: "Período", default: 14, min: 5, max: 30 }, { id: "ob", label: "Sobrecompra", default: 70, min: 60, max: 85 }, { id: "os", label: "Sobreventa", default: 30, min: 15, max: 40 }] },
      { id: "macd", label: "MACD Crossover", desc: "Cruce MACD con señal para capturar momentum", params: [{ id: "fast", label: "Rápido", default: 12, min: 5, max: 30 }, { id: "slow", label: "Lento", default: 26, min: 15, max: 60 }, { id: "sig", label: "Señal", default: 9, min: 3, max: 20 }] },
      { id: "bollinger", label: "Bollinger Breakout", desc: "Precio rompe banda superior o inferior con fuerza", params: [{ id: "len", label: "Período", default: 20, min: 10, max: 50 }, { id: "mult", label: "Multiplicador", default: 2.0, min: 1.0, max: 3.5, step: 0.1 }] },
    ],
  },
  {
    id: "confirm", step: 3, label: "Confirmación", desc: "Qué filtra las señales falsas", color: "#F97316", icon: "🔍",
    options: [
      { id: "volume", label: "Filtro de Volumen", desc: "Opera solo si volumen supera el promedio. Elimina movimientos débiles", params: [{ id: "mult", label: "Multiplicador vol.", default: 1.5, min: 1.0, max: 3.0, step: 0.1 }] },
      { id: "structure", label: "Estructura de Mercado", desc: "Confirma HH/HL alcista o LL/LH bajista antes de entrar", params: [{ id: "pivot", label: "Longitud pivote", default: 5, min: 2, max: 20 }] },
      { id: "rsi_filter", label: "RSI como Filtro", desc: "Solo entra si RSI está en zona neutral-favorable", params: [{ id: "min", label: "RSI mínimo long", default: 45, min: 30, max: 60 }, { id: "max", label: "RSI máximo short", default: 55, min: 40, max: 70 }] },
      { id: "none", label: "Sin confirmación", desc: "Señal de entrada actúa directa con el filtro de tendencia", params: [] },
    ],
  },
  {
    id: "session", step: 4, label: "Sesión de Trading", desc: "En qué horario opera el algoritmo", color: "#A78BFA", icon: "🕐",
    options: [
      { id: "ny", label: "Nueva York", desc: "09:30 – 16:00 EST. Alta liquidez en acciones y futuros", params: [] },
      { id: "london", label: "Londres", desc: "03:00 – 11:00 EST. Sesión más volátil del forex", params: [] },
      { id: "asia", label: "Asia", desc: "20:00 – 04:00 EST. Ideal para cripto y pares JPY/AUD", params: [] },
      { id: "all", label: "24/7 Sin filtro", desc: "Opera en cualquier horario. Solo para cripto", params: [] },
    ],
  },
  {
    id: "risk", step: 5, label: "Gestión de Riesgo", desc: "Define SL y TPs", color: "#EF4444", icon: "🛡️",
    options: [
      { id: "risk_config", label: "Configurar Niveles", desc: "Define SL, TP1, TP2 y TP3 en porcentaje", params: [
        { id: "sl", label: "Stop Loss %", default: 1.5, min: 0.3, max: 5.0, step: 0.1 },
        { id: "tp1", label: "TP1 %", default: 2.0, min: 0.5, max: 10.0, step: 0.1 },
        { id: "tp2", label: "TP2 %", default: 4.0, min: 1.0, max: 20.0, step: 0.1 },
        { id: "tp3", label: "TP3 %", default: 7.0, min: 1.0, max: 30.0, step: 0.1 },
      ]},
    ],
  },
];

const ASSETS = ["BTCUSDT","ETHUSDT","EURUSD","GBPUSD","NQ1!","ES1!","XAUUSD","SPY","Otro"];
const TIMEFRAMES = ["1m","3m","5m","15m","30m","1h","4h","1D"];
const SESSION_MAP = { ny:"0930-1600 EST", london:"0300-1100 EST", asia:"2000-0400 EST", all:"sin restriccion horaria" };

const SCORE_DATA = {
  trend:   { ema50:{ trend:80, risk:40, compat:85 }, supertrend:{ trend:90, risk:65, compat:90 }, vwap:{ trend:75, risk:35, compat:80 }, adx:{ trend:95, risk:30, compat:88 } },
  entry:   { ema_cross:{ trend:85, risk:50, compat:85 }, rsi:{ trend:60, risk:70, compat:75 }, macd:{ trend:80, risk:60, compat:80 }, bollinger:{ trend:65, risk:75, compat:70 } },
  confirm: { volume:{ trend:70, risk:20, compat:90 }, structure:{ trend:85, risk:15, compat:88 }, rsi_filter:{ trend:65, risk:25, compat:82 }, none:{ trend:50, risk:40, compat:60 } },
};

function calcScore(selections) {
  const t = SCORE_DATA.trend[selections.trend] || { trend:70, risk:50, compat:75 };
  const e = SCORE_DATA.entry[selections.entry] || { trend:70, risk:50, compat:75 };
  const c = SCORE_DATA.confirm[selections.confirm] || { trend:70, risk:50, compat:75 };
  const trend = Math.round((t.trend + e.trend + c.trend) / 3);
  const risk = Math.round((t.risk + e.risk + c.risk) / 3);
  const compat = Math.round((t.compat + e.compat + c.compat) / 3);
  const overall = Math.round(trend * 0.4 + (100 - risk) * 0.2 + compat * 0.4);
  const profile = risk < 40 ? "Conservadora" : risk < 60 ? "Moderada" : "Agresiva";
  const profileColor = risk < 40 ? C.green : risk < 60 ? C.orange : C.red;
  return { trend, risk, compat, overall, profile, profileColor };
}

function apiCall(apiKey, system, userMsg, maxTokens) {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens || 1000,
      system: system,
      messages: [{ role: "user", content: userMsg }]
    })
  }).then(function(r) { return r.json(); });
}

function EquityChart({ data }) {
  const canvasRef = useRef(null);
  useEffect(function() {
    if (!canvasRef.current || !data || data.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const min = Math.min.apply(null, data);
    const max = Math.max.apply(null, data);
    const range = max - min || 1;
    const pad = 30;
    function px(i) { return pad + (i / (data.length - 1)) * (W - pad * 2); }
    function py(v) { return H - pad - ((v - min) / range) * (H - pad * 2); }
    ctx.strokeStyle = "#1A2A4A";
    ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var y = pad + (g / 4) * (H - pad * 2);
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
    }
    var grad = ctx.createLinearGradient(0, pad, 0, H - pad);
    grad.addColorStop(0, "rgba(0,196,140,0.3)");
    grad.addColorStop(1, "rgba(0,196,140,0.0)");
    ctx.beginPath();
    ctx.moveTo(px(0), H - pad);
    for (var i = 0; i < data.length; i++) ctx.lineTo(px(i), py(data[i]));
    ctx.lineTo(px(data.length - 1), H - pad);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px(0), py(data[0]));
    for (var j = 1; j < data.length; j++) ctx.lineTo(px(j), py(data[j]));
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = C.grayL;
    ctx.font = "10px Inter,sans-serif";
    ctx.fillText("$" + Math.round(min), 2, H - pad + 4);
    ctx.fillText("$" + Math.round(max), 2, pad + 4);
  }, [data]);
  return <canvas ref={canvasRef} width={560} height={180} style={{ width:"100%", height:180, borderRadius:8 }} />;
}

function ScoreGauge({ value, label, color }) {
  const r = 28, circ = 2 * Math.PI * r;
  const filled = (value / 100) * circ;
  return (
    <div style={{ textAlign:"center" }}>
      <svg width={72} height={72} viewBox="0 0 72 72">
        <circle cx={36} cy={36} r={r} fill="none" stroke={C.border} strokeWidth={5} />
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={circ - filled}
          strokeLinecap="round" transform="rotate(-90 36 36)"
          style={{ transition:"stroke-dashoffset 1s ease" }} />
        <text x={36} y={41} textAnchor="middle" fill={color} fontSize={15} fontWeight={900}>{value}</text>
      </svg>
      <div style={{ color:C.grayL, fontSize:10, fontWeight:700, marginTop:2, letterSpacing:1 }}>{label}</div>
    </div>
  );
}

function Logo() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ width:38, height:38, borderRadius:9, background:"linear-gradient(135deg,#1E6FD9,#00C48C)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"#fff", fontSize:15, boxShadow:"0 0 20px #1E6FD955" }}>FT</div>
      <div>
        <div style={{ color:C.white, fontWeight:900, fontSize:16, letterSpacing:2 }}>CÓDIGO PROFIT</div>
        <div style={{ color:C.gray, fontSize:9, letterSpacing:3, textTransform:"uppercase" }}>by Fyntrum · Algorithm Builder</div>
      </div>
    </div>
  );
}

function FlowPreview({ selections, params }) {
  const steps = BLOCKS.map(function(b) {
    var opt = b.options.find(function(o) { return o.id === selections[b.id]; });
    return { step:b.step, label:b.label, color:b.color, icon:b.icon, selected:opt ? opt.label : null };
  });
  var rp = params.risk && params.risk.risk_config ? params.risk.risk_config : null;
  return (
    <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:"18px 20px", marginBottom:20 }}>
      <div style={{ color:C.grayL, fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:16 }}>Vista Previa del Algoritmo</div>
      <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:0 }}>
        {steps.map(function(s, i) {
          return (
            <div key={s.step} style={{ display:"flex", alignItems:"center" }}>
              <div style={{ background:s.selected ? s.color+"18" : C.input, border:"1px solid "+(s.selected ? s.color : C.border), borderRadius:10, padding:"10px 14px", textAlign:"center", minWidth:95 }}>
                <div style={{ fontSize:16 }}>{s.icon}</div>
                <div style={{ color:s.selected ? s.color : C.gray, fontSize:9, fontWeight:700, marginTop:3 }}>{s.selected || "Por definir"}</div>
                <div style={{ color:C.gray, fontSize:8, marginTop:1 }}>{s.label}</div>
              </div>
              {i < steps.length - 1 && <div style={{ color:C.border, fontSize:16, padding:"0 3px" }}>→</div>}
            </div>
          );
        })}
      </div>
      {rp && (
        <div style={{ marginTop:14, display:"flex", gap:10, flexWrap:"wrap" }}>
          {[{l:"SL",v:rp.sl+"%",c:C.red},{l:"TP1",v:rp.tp1+"%",c:"#86efac"},{l:"TP2",v:rp.tp2+"%",c:C.green},{l:"TP3",v:rp.tp3+"%",c:"#00ff9d"}].map(function(x) {
            return (
              <div key={x.l} style={{ background:x.c+"15", border:"1px solid "+x.c+"44", borderRadius:8, padding:"5px 14px", textAlign:"center" }}>
                <div style={{ color:x.c, fontWeight:900, fontSize:15 }}>{x.v}</div>
                <div style={{ color:C.gray, fontSize:9, fontWeight:700 }}>{x.l}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BlockStep({ block, selection, blockParams, onSelect, onParam }) {
  return (
    <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:"18px 20px", marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <div style={{ width:28, height:28, borderRadius:7, background:block.color+"22", border:"1px solid "+block.color+"66", display:"flex", alignItems:"center", justifyContent:"center", color:block.color, fontWeight:900, fontSize:13 }}>{block.step}</div>
        <div>
          <div style={{ color:C.white, fontWeight:800, fontSize:14 }}>{block.icon} {block.label}</div>
          <div style={{ color:C.gray, fontSize:11 }}>{block.desc}</div>
        </div>
        {selection && <div style={{ marginLeft:"auto", background:block.color+"18", border:"1px solid "+block.color+"44", borderRadius:20, padding:"3px 12px", color:block.color, fontSize:11, fontWeight:700 }}>✓ Listo</div>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))", gap:10 }}>
        {block.options.map(function(opt) {
          var isSel = selection === opt.id;
          return (
            <div key={opt.id} onClick={function() { onSelect(block.id, opt.id); }} style={{ background:isSel ? block.color+"15" : C.input, border:"2px solid "+(isSel ? block.color : C.border), borderRadius:10, padding:"12px 14px", cursor:"pointer", transition:"all 0.15s", boxShadow:isSel ? "0 0 14px "+block.color+"30" : "none" }}>
              <div style={{ fontWeight:700, fontSize:13, color:isSel ? block.color : C.white, marginBottom:4 }}>{opt.label}</div>
              <div style={{ fontSize:11, color:C.gray, lineHeight:1.5 }}>{opt.desc}</div>
              {isSel && opt.params.length > 0 && (
                <div style={{ marginTop:12, borderTop:"1px solid "+block.color+"33", paddingTop:12, display:"flex", flexDirection:"column", gap:8 }}>
                  {opt.params.map(function(p) {
                    var val = blockParams && blockParams[opt.id] && blockParams[opt.id][p.id] !== undefined ? blockParams[opt.id][p.id] : p.default;
                    return (
                      <div key={p.id}>
                        <label style={{ color:C.grayL, fontSize:10, fontWeight:700, letterSpacing:1, display:"block", marginBottom:4 }}>{p.label.toUpperCase()}</label>
                        <input type="number" min={p.min} max={p.max} step={p.step||1} value={val}
                          onChange={function(e) { onParam(block.id, opt.id, p.id, parseFloat(e.target.value)); }}
                          onClick={function(e) { e.stopPropagation(); }}
                          style={{ width:"100%", background:C.bg, border:"1px solid "+block.color+"44", borderRadius:6, padding:"7px 10px", color:C.white, fontSize:13, outline:"none", boxSizing:"border-box" }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoryPanel({ history, onLoad, onClear }) {
  if (!history || history.length === 0) return null;
  return (
    <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:"16px 20px", marginBottom:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ color:C.white, fontWeight:800, fontSize:13 }}>📂 Mis Algoritmos Guardados</div>
        <button onClick={onClear} style={{ background:"transparent", border:"none", color:C.gray, cursor:"pointer", fontSize:11 }}>Limpiar historial</button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {history.map(function(item, i) {
          return (
            <div key={i} style={{ background:C.input, border:"1px solid "+C.border, borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ color:C.white, fontWeight:700, fontSize:13 }}>{item.name}</div>
                <div style={{ color:C.gray, fontSize:11, marginTop:2 }}>{item.summary} · {item.date}</div>
              </div>
              <button onClick={function() { onLoad(item); }} style={{ background:C.blue+"22", border:"1px solid "+C.blue+"44", borderRadius:7, padding:"6px 14px", color:C.blueL, cursor:"pointer", fontSize:12, fontWeight:700 }}>Cargar</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [asset, setAsset] = useState("BTCUSDT");
  const [customAsset, setCustomAsset] = useState("");
  const [timeframe, setTimeframe] = useState("15m");
  const [algoName, setAlgoName] = useState("");
  const [selections, setSelections] = useState({});
  const [params, setParams] = useState({});
  const [customRules, setCustomRules] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [result, setResult] = useState("");
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("code");
  const [score, setScore] = useState(null);
  const [equityData, setEquityData] = useState(null);
  const [history, setHistory] = useState([]);
  const [scoreLoading, setScoreLoading] = useState(false);

  useEffect(function() {
    try {
      var saved = localStorage.getItem("cp_history");
      if (saved) setHistory(JSON.parse(saved));
    } catch(e) {}
  }, []);

  var allSelected = BLOCKS.every(function(b) { return selections[b.id]; });
  var completedCount = BLOCKS.filter(function(b) { return selections[b.id]; }).length;

  useEffect(function() {
    if (completedCount >= 3 && selections.trend && selections.entry && selections.confirm) {
      setScore(calcScore(selections));
    } else {
      setScore(null);
    }
  }, [selections]);

  function setSelection(blockId, optId) {
    setSelections(function(prev) { return Object.assign({}, prev, { [blockId]: optId }); });
  }

  function setParam(blockId, optId, paramId, val) {
    setParams(function(prev) {
      var b = prev[blockId] || {};
      var o = b[optId] || {};
      return Object.assign({}, prev, { [blockId]: Object.assign({}, b, { [optId]: Object.assign({}, o, { [paramId]: val }) }) });
    });
  }

  function getParam(blockId, optId, paramId, def) {
    return params[blockId] && params[blockId][optId] && params[blockId][optId][paramId] !== undefined ? params[blockId][optId][paramId] : def;
  }

  function addRule() { setCustomRules(function(prev) { return [...prev, ""]; }); }
  function updateRule(i, val) { setCustomRules(function(prev) { return prev.map(function(r, idx) { return idx === i ? val : r; }); }); }
  function removeRule(i) { setCustomRules(function(prev) { return prev.filter(function(_, idx) { return idx !== i; }); }); }

  function buildPromptCore() {
    var finalAsset = asset === "Otro" ? customAsset : asset;
    var trendOpt = BLOCKS[0].options.find(function(o) { return o.id === selections.trend; });
    var entryOpt = BLOCKS[1].options.find(function(o) { return o.id === selections.entry; });
    var confirmOpt = BLOCKS[2].options.find(function(o) { return o.id === selections.confirm; });
    var sessionOpt = BLOCKS[3].options.find(function(o) { return o.id === selections.session; });
    var riskP = params.risk && params.risk.risk_config ? params.risk.risk_config : {};
    var sl = riskP.sl !== undefined ? riskP.sl : 1.5;
    var tp1 = riskP.tp1 !== undefined ? riskP.tp1 : 2.0;
    var tp2 = riskP.tp2 !== undefined ? riskP.tp2 : 4.0;
    var tp3 = riskP.tp3 !== undefined ? riskP.tp3 : 7.0;
    var trendParams = trendOpt ? trendOpt.params.map(function(p) { return p.label+": "+getParam("trend",selections.trend,p.id,p.default); }).join(", ") : "";
    var entryParams = entryOpt ? entryOpt.params.map(function(p) { return p.label+": "+getParam("entry",selections.entry,p.id,p.default); }).join(", ") : "";
    var confirmParams = confirmOpt ? confirmOpt.params.map(function(p) { return p.label+": "+getParam("confirm",selections.confirm,p.id,p.default); }).join(", ") : "";
    var activeRules = customRules.filter(function(r) { return r.trim().length > 0; });
    var rulesStr = activeRules.length > 0 ? "\nREGLAS PERSONALIZADAS:\n" + activeRules.map(function(r,i) { return (i+1)+". "+r; }).join("\n") + "\n" : "";
    return {
      trend: trendOpt ? trendOpt.label : "", trendParams: trendParams,
      entry: entryOpt ? entryOpt.label : "", entryParams: entryParams,
      confirm: confirmOpt ? confirmOpt.label : "", confirmParams: confirmParams,
      session: SESSION_MAP[selections.session] || "", sessionLabel: sessionOpt ? sessionOpt.label : "",
      sl: sl, tp1: tp1, tp2: tp2, tp3: tp3,
      asset: finalAsset, timeframe: timeframe, rulesStr: rulesStr,
      name: algoName || "Mi Algoritmo"
    };
  }

  function buildPinePrompt(d) {
    return "Construye un algoritmo de trading en Pine Script v6 para TradingView.\n\n"
      + "NOMBRE: " + d.name + "\n"
      + "TENDENCIA: " + d.trend + (d.trendParams ? " | " + d.trendParams : "") + "\n"
      + "ENTRADA: " + d.entry + (d.entryParams ? " | " + d.entryParams : "") + "\n"
      + "CONFIRMACION: " + d.confirm + (d.confirmParams ? " | " + d.confirmParams : "") + "\n"
      + "SESION: " + d.session + "\n"
      + "SL: " + d.sl + "% | TP1: " + d.tp1 + "% | TP2: " + d.tp2 + "% | TP3: " + d.tp3 + "%\n"
      + "ACTIVO: " + d.asset + " | TF: " + d.timeframe + "\n"
      + d.rulesStr
      + "\nREGLAS TECNICAS:\n"
      + "- NO repintado: solo close[1], high[1] etc (barras cerradas confirmadas)\n"
      + "- Nuevo dia (ta.change(time('D'))!=0): cerrar posicion, borrar labels y lines del dia anterior\n"
      + "- Guardar labels en var label[] y lines en var line[], borrar con array al cambio de dia\n"
      + "- label.new() para entradas: long=label.style_label_up verde #00C48C, short=label.style_label_down naranja #F97316\n"
      + "- line.new(x1,y1,x2,y2,extend=extend.right) para SL/TPs. NO line.extend() separado\n"
      + "- SL rojo #EF4444, TP1 #86efac, TP2 #00C48C, TP3 #00ff9d\n"
      + "- En TP1 mover SL a breakeven. En TP2 cerrar 50%\n"
      + "- strategy.entry() y strategy.exit() para posiciones\n"
      + "- alertcondition para cada evento\n"
      + "- Titulo del script = '" + d.name + "'\n"
      + "- Incluir en comentario la fecha de creacion: " + new Date().toLocaleDateString();
  }

  function buildExplainPrompt(d) {
    return "Explica en español, de forma clara y emocionante para un trader principiante, como funciona este algoritmo de trading que acaban de construir:\n\n"
      + "NOMBRE: " + d.name + "\n"
      + "FILTRO DE TENDENCIA: " + d.trend + "\n"
      + "SEÑAL DE ENTRADA: " + d.entry + "\n"
      + "CONFIRMACION: " + d.confirm + "\n"
      + "SESION: " + d.sessionLabel + "\n"
      + "RIESGO: SL " + d.sl + "% / TP1 " + d.tp1 + "% / TP2 " + d.tp2 + "% / TP3 " + d.tp3 + "%\n"
      + "ACTIVO: " + d.asset + " en " + d.timeframe + "\n\n"
      + "Explica: 1) Como identifica la tendencia 2) Cuando entra exactamente 3) Como confirma la señal 4) Como gestiona el riesgo 5) En que mercados y momentos funciona mejor\n"
      + "Usa emojis, lenguaje motivador y terminos de trading reales. Maximo 250 palabras. Hazlo inspirador.";
  }

  function buildEquityPrompt(d, scoreData) {
    return "Genera datos de una curva de equity simulada para este algoritmo de trading. "
      + "Estrategia: " + d.trend + " + " + d.entry + " + " + d.confirm + ". "
      + "Perfil de riesgo: " + (scoreData ? scoreData.profile : "Moderada") + ". "
      + "SL: " + d.sl + "% TP promedio: " + ((d.tp1+d.tp2+d.tp3)/3).toFixed(1) + "%.\n\n"
      + "Responde UNICAMENTE con un array JSON de 60 numeros que representen la curva de equity comenzando en 10000 USD. "
      + "La curva debe ser realista con drawdowns, rachas ganadoras y perdedoras, y una tendencia acorde al perfil. "
      + "Sin texto, sin markdown, solo el array. Ejemplo: [10000,10150,10080,...]";
  }

  function saveToHistory(name, summary, code) {
    var item = { name: name, summary: summary, code: code, date: new Date().toLocaleDateString() };
    var newHistory = [item, ...history].slice(0, 3);
    setHistory(newHistory);
    try { localStorage.setItem("cp_history", JSON.stringify(newHistory)); } catch(e) {}
  }

  function loadFromHistory(item) {
    setResult(item.code);
    setAlgoName(item.name);
    setActiveTab("code");
  }

  async function generate() {
    if (!apiKey.trim()) { setError("Ingresa tu API Key de Anthropic."); return; }
    if (!allSelected) { setError("Completa todos los bloques antes de generar."); return; }
    setLoading(true); setError(""); setResult(""); setEquityData(null); setExplanation("");
    try {
      var d = buildPromptCore();
      var data = await apiCall(apiKey,
        "Eres un experto en Pine Script v6 para TradingView. Generas UNICAMENTE codigo Pine Script v6 puro. Sin texto, sin explicaciones, sin markdown, sin backticks. Sintaxis v6: line.new() con extend=extend.right como parametro. NUNCA line.extend() separado. Primera linea EXACTAMENTE: //@version=6",
        buildPinePrompt(d), 4000);
      if (data.error) throw new Error(data.error.message);
      var raw = data.content ? data.content.map(function(b) { return b.text || ""; }).join("") : "";
      raw = raw.replace(/```[\w]*/g, "").replace(/```/g, "");
      if (!raw.trimStart().startsWith("//@version")) raw = "//@version=6\n" + raw.trimStart();
      var idx = raw.indexOf("//@version=6");
      var idx2 = raw.indexOf("//@version=6", idx + 5);
      if (idx2 > 0) raw = raw.slice(0, idx2);
      var lb = raw.lastIndexOf("}");
      if (lb > 100) raw = raw.slice(0, lb + 1);
      raw = raw.trim();
      setResult(raw);
      setActiveTab("code");
      var summary = d.trend + " + " + d.entry + " + " + d.confirm + " | " + d.asset;
      saveToHistory(d.name, summary, raw);
      if (score) {
        var eqData = await apiCall(apiKey, "Eres un generador de datos JSON. Responde SOLO con un array JSON de numeros. Sin texto.", buildEquityPrompt(d, score), 500);
        if (!eqData.error) {
          var eqText = eqData.content ? eqData.content.map(function(b) { return b.text||""; }).join("") : "";
          eqText = eqText.replace(/```[\w]*/g,"").replace(/```/g,"").trim();
          try { setEquityData(JSON.parse(eqText)); } catch(e) {}
        }
      }
    } catch(e) { setError("Error: " + e.message); }
    setLoading(false);
  }

  async function explain() {
    if (!apiKey.trim()) { setError("Ingresa tu API Key de Anthropic."); return; }
    if (!allSelected) { setError("Completa todos los bloques antes de explicar."); return; }
    setLoadingExplain(true); setError(""); setExplanation(""); setActiveTab("explain");
    try {
      var d = buildPromptCore();
      var data = await apiCall(apiKey, "Eres un experto en trading que explica estrategias de forma clara, inspiradora y accesible para principiantes.", buildExplainPrompt(d), 600);
      if (data.error) throw new Error(data.error.message);
      var text = data.content ? data.content.map(function(b) { return b.text||""; }).join("") : "";
      setExplanation(text);
    } catch(e) { setError("Error: " + e.message); }
    setLoadingExplain(false);
  }

  function copy() { navigator.clipboard.writeText(result); setCopied(true); setTimeout(function() { setCopied(false); }, 2000); }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.white, fontFamily:"'Inter',system-ui,sans-serif", paddingBottom:80 }}>
      <div style={{ background:C.card, borderBottom:"1px solid "+C.border, padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <Logo />
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ display:"flex", gap:5 }}>
            {BLOCKS.map(function(b) { return <div key={b.id} style={{ width:26, height:4, borderRadius:2, background:selections[b.id] ? b.color : C.border, transition:"background 0.3s" }} />; })}
          </div>
          <span style={{ color:C.gray, fontSize:12 }}>{completedCount}/{BLOCKS.length}</span>
        </div>
      </div>

      <div style={{ maxWidth:920, margin:"0 auto", padding:"28px 18px" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"inline-block", background:C.blue+"18", border:"1px solid "+C.blue+"44", borderRadius:20, padding:"4px 16px", color:C.blueL, fontSize:11, fontWeight:700, letterSpacing:2, marginBottom:12 }}>CÓDIGO PROFIT · Workshop Exclusivo</div>
          <h1 style={{ fontSize:"clamp(22px,4vw,34px)", fontWeight:900, margin:"0 0 8px", background:"linear-gradient(120deg,"+C.white+","+C.blueL+")", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Construye el Algoritmo que Opera por Ti</h1>
          <p style={{ color:C.gray, fontSize:13, maxWidth:480, margin:"0 auto" }}>Selecciona un componente en cada bloque. La IA genera el Pine Script v6 listo para TradingView.</p>
        </div>

        <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:"16px 20px", marginBottom:18 }}>
          <div style={{ color:C.orange, fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>🔑 API Key de Anthropic</div>
          <div style={{ display:"flex", gap:8 }}>
            <input type={showKey ? "text" : "password"} placeholder="sk-ant-api03-..." value={apiKey} onChange={function(e) { setApiKey(e.target.value); }}
              style={{ flex:1, background:C.input, border:"1px solid "+(apiKey ? C.green : C.border), borderRadius:8, padding:"9px 13px", color:C.white, fontSize:13, outline:"none", fontFamily:"monospace" }} />
            <button onClick={function() { setShowKey(!showKey); }} style={{ background:C.input, border:"1px solid "+C.border, borderRadius:8, padding:"9px 14px", color:C.gray, cursor:"pointer", fontSize:12 }}>{showKey ? "Ocultar" : "Ver"}</button>
          </div>
          <p style={{ color:C.gray, fontSize:11, marginTop:6 }}>Tu API Key no se almacena. Obtenla en console.anthropic.com</p>
        </div>

        <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:"16px 20px", marginBottom:18 }}>
          <div style={{ color:C.grayL, fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>📊 Activo, Timeframe y Nombre</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:12 }}>
            <div>
              <label style={{ color:C.gray, fontSize:11, display:"block", marginBottom:6 }}>ACTIVO</label>
              <select value={asset} onChange={function(e) { setAsset(e.target.value); }} style={{ width:"100%", background:C.input, border:"1px solid "+C.border, borderRadius:8, padding:"9px 12px", color:C.white, fontSize:13, outline:"none" }}>
                {ASSETS.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
              </select>
              {asset === "Otro" && <input value={customAsset} onChange={function(e) { setCustomAsset(e.target.value); }} placeholder="Escribe el ticker..." style={{ width:"100%", marginTop:8, background:C.input, border:"1px solid "+C.border, borderRadius:8, padding:"9px 12px", color:C.white, fontSize:13, outline:"none", boxSizing:"border-box" }} />}
            </div>
            <div>
              <label style={{ color:C.gray, fontSize:11, display:"block", marginBottom:6 }}>TIMEFRAME</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {TIMEFRAMES.map(function(tf) { return <button key={tf} onClick={function() { setTimeframe(tf); }} style={{ padding:"6px 11px", borderRadius:6, fontSize:12, fontWeight:700, cursor:"pointer", border:"1px solid "+(timeframe===tf ? C.blue : C.border), background:timeframe===tf ? C.blue+"22" : C.input, color:timeframe===tf ? C.blueL : C.gray }}>{tf}</button>; })}
              </div>
            </div>
          </div>
          <div>
            <label style={{ color:C.gray, fontSize:11, display:"block", marginBottom:6 }}>NOMBRE DE TU ALGORITMO</label>
            <input value={algoName} onChange={function(e) { setAlgoName(e.target.value); }} placeholder="Ej: Phantom Trend, Alpha Hunter, Mi Estrategia..." style={{ width:"100%", background:C.input, border:"1px solid "+(algoName ? C.blueL+"55" : C.border), borderRadius:8, padding:"9px 13px", color:C.white, fontSize:13, outline:"none", boxSizing:"border-box" }} />
          </div>
        </div>

        <HistoryPanel history={history} onLoad={loadFromHistory} onClear={function() { setHistory([]); localStorage.removeItem("cp_history"); }} />
        <FlowPreview selections={selections} params={params} />
        {BLOCKS.map(function(block) { return <BlockStep key={block.id} block={block} selection={selections[block.id]} blockParams={params[block.id]} onSelect={setSelection} onParam={setParam} />; })}

        {score && (
          <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:"18px 20px", marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div>
                <div style={{ color:C.white, fontWeight:900, fontSize:15 }}>⚡ Score de tu Estrategia</div>
                <div style={{ color:C.gray, fontSize:11, marginTop:2 }}>Análisis automático de tu combinación de bloques</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:32, fontWeight:900, color:score.overall >= 75 ? C.green : score.overall >= 55 ? C.orange : C.red, lineHeight:1 }}>{score.overall}</div>
                <div style={{ color:C.gray, fontSize:10, fontWeight:700 }}>SCORE TOTAL</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:20, justifyContent:"center", flexWrap:"wrap", marginBottom:14 }}>
              <ScoreGauge value={score.trend} label="TENDENCIA" color={C.blueL} />
              <ScoreGauge value={100 - score.risk} label="BAJO RIESGO" color={C.green} />
              <ScoreGauge value={score.compat} label="COMPATIBILIDAD" color="#A78BFA" />
            </div>
            <div style={{ background:score.profileColor+"15", border:"1px solid "+score.profileColor+"44", borderRadius:8, padding:"8px 14px", textAlign:"center" }}>
              <span style={{ color:score.profileColor, fontWeight:800, fontSize:13 }}>Estrategia {score.profile}</span>
              <span style={{ color:C.gray, fontSize:12, marginLeft:8 }}>Score {score.overall}/100</span>
            </div>
          </div>
        )}

        <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:"18px 20px", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
            <div>
              <div style={{ color:C.white, fontWeight:800, fontSize:14 }}>✏️ Condiciones Personalizadas</div>
              <div style={{ color:C.gray, fontSize:11, marginTop:2 }}>Agrega reglas en lenguaje natural. La IA las incorpora al código.</div>
            </div>
            <button onClick={addRule} style={{ background:C.blueL+"18", border:"1px solid "+C.blueL+"44", borderRadius:8, padding:"6px 14px", color:C.blueL, cursor:"pointer", fontSize:12, fontWeight:700 }}>+ Agregar</button>
          </div>
          <div style={{ background:C.input, borderRadius:8, padding:"8px 12px", marginBottom:12, border:"1px solid "+C.border }}>
            <div style={{ color:C.gray, fontSize:10, fontWeight:700, letterSpacing:1, marginBottom:4 }}>EJEMPLOS — click para agregar</div>
            {["Solo operar si precio está por encima de EMA 200","No entrar si ATR es menor a 0.5%","Confirmación de vela envolvente antes de entrar","Máximo 2 trades por día"].map(function(ex, i) {
              return <div key={i} onClick={function() { var empty = customRules.findIndex(function(r) { return r.trim()===""; }); if (empty >= 0) updateRule(empty, ex); else setCustomRules(function(prev) { return [...prev, ex]; }); }} style={{ color:C.blueL, fontSize:11, cursor:"pointer", padding:"2px 0", opacity:0.85, lineHeight:1.6 }}>↗ {ex}</div>;
            })}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {customRules.map(function(rule, i) {
              return (
                <div key={i} style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <div style={{ width:22, height:22, borderRadius:6, background:C.blueL+"18", border:"1px solid "+C.blueL+"33", display:"flex", alignItems:"center", justifyContent:"center", color:C.blueL, fontSize:10, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                  <input value={rule} onChange={function(e) { updateRule(i, e.target.value); }} placeholder="Ej: Solo operar si el volumen es 2x el promedio..." style={{ flex:1, background:C.input, border:"1px solid "+(rule.trim() ? C.blueL+"55" : C.border), borderRadius:8, padding:"9px 12px", color:C.white, fontSize:13, outline:"none" }} />
                  {customRules.length > 1 && <button onClick={function() { removeRule(i); }} style={{ background:C.red+"15", border:"1px solid "+C.red+"33", borderRadius:6, padding:"6px 10px", color:C.red, cursor:"pointer", fontSize:12, flexShrink:0 }}>✕</button>}
                </div>
              );
            })}
          </div>
        </div>

        {error && <div style={{ background:C.red+"15", border:"1px solid "+C.red+"44", borderRadius:10, padding:"12px 16px", marginBottom:16, color:C.red, fontSize:13 }}>{error}</div>}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:0 }}>
          <button onClick={explain} disabled={loadingExplain || !allSelected} style={{ padding:"15px", borderRadius:12, fontSize:14, fontWeight:800, cursor:(!allSelected||loadingExplain) ? "not-allowed" : "pointer", border:"1px solid "+(allSelected ? C.orange+"66" : C.border), background:allSelected ? C.orange+"15" : C.card, color:allSelected ? C.orange : C.gray, transition:"all 0.3s" }}>
            {loadingExplain ? "⏳ Analizando..." : "🧠 Explícame mi Algoritmo"}
          </button>
          <button onClick={generate} disabled={loading || !allSelected} style={{ padding:"15px", borderRadius:12, fontSize:14, fontWeight:900, cursor:(!allSelected||loading) ? "not-allowed" : "pointer", border:"none", background:allSelected && !loading ? "linear-gradient(135deg,"+C.blue+","+C.blueL+")" : C.card, color:allSelected && !loading ? "#fff" : C.gray, boxShadow:allSelected && !loading ? "0 4px 24px "+C.blue+"44" : "none", transition:"all 0.3s" }}>
            {loading ? "⏳ Generando Pine Script..." : "⚡ GENERAR MI ALGORITMO"}
          </button>
        </div>
        {!allSelected && <div style={{ textAlign:"center", color:C.gray, fontSize:12, marginTop:10 }}>Completa los {BLOCKS.length - completedCount} bloques restantes para continuar</div>}

        {(result || explanation) && (
          <div style={{ background:C.card, border:"1px solid "+C.green+"44", borderRadius:12, padding:"18px 20px", marginTop:24 }}>
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              {[{id:"code",label:"📄 Pine Script"},{id:"explain",label:"🧠 Explicación"},{id:"equity",label:"📈 Backtesting"}].map(function(tab) {
                var active = activeTab === tab.id;
                var hasContent = tab.id==="code" ? !!result : tab.id==="explain" ? !!explanation : !!equityData;
                return (
                  <button key={tab.id} onClick={function() { setActiveTab(tab.id); }} style={{ padding:"7px 16px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", border:"1px solid "+(active ? C.green : C.border), background:active ? C.green+"22" : C.input, color:active ? C.green : hasContent ? C.grayL : C.gray, opacity:hasContent||active ? 1 : 0.5 }}>{tab.label}</button>
                );
              })}
              {result && (
                <button onClick={copy} style={{ marginLeft:"auto", background:copied ? C.green+"22" : C.input, border:"1px solid "+(copied ? C.green : C.border), borderRadius:8, padding:"7px 16px", color:copied ? C.green : C.white, cursor:"pointer", fontSize:12, fontWeight:700 }}>{copied ? "✓ Copiado" : "Copiar código"}</button>
              )}
            </div>

            {activeTab === "code" && result && (
              <pre style={{ background:C.input, borderRadius:10, padding:16, color:"#a8d8a8", fontSize:11.5, overflowX:"auto", lineHeight:1.65, maxHeight:460, overflowY:"auto", border:"1px solid "+C.border, margin:0 }}>{result}</pre>
            )}
            {activeTab === "explain" && explanation && (
              <div style={{ background:C.input, borderRadius:10, padding:18, color:C.white, fontSize:14, lineHeight:1.8, border:"1px solid "+C.border, whiteSpace:"pre-wrap" }}>{explanation}</div>
            )}
            {activeTab === "equity" && (
              <div>
                {equityData ? (
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                      <div style={{ color:C.grayL, fontSize:11, fontWeight:700, letterSpacing:1 }}>CURVA DE EQUITY SIMULADA · Basada en lógica de tu estrategia</div>
                      <div style={{ color:C.green, fontWeight:900, fontSize:14 }}>
                        +{((equityData[equityData.length-1]/equityData[0]-1)*100).toFixed(1)}%
                      </div>
                    </div>
                    <EquityChart data={equityData} />
                    <div style={{ display:"flex", gap:14, marginTop:12, flexWrap:"wrap" }}>
                      {[
                        {l:"Capital Inicial", v:"$"+equityData[0].toFixed(0)},
                        {l:"Capital Final", v:"$"+equityData[equityData.length-1].toFixed(0), c:C.green},
                        {l:"Max Drawdown", v:"-"+(((Math.min.apply(null,equityData)-equityData[0])/equityData[0])*100).toFixed(1)+"%", c:C.red},
                        {l:"Rendimiento", v:((equityData[equityData.length-1]/equityData[0]-1)*100).toFixed(1)+"%", c:C.green},
                      ].map(function(s) {
                        return <div key={s.l} style={{ background:C.input, borderRadius:8, padding:"8px 14px" }}><div style={{ color:s.c||C.white, fontWeight:800, fontSize:15 }}>{s.v}</div><div style={{ color:C.gray, fontSize:10, marginTop:2 }}>{s.l}</div></div>;
                      })}
                    </div>
                    <div style={{ background:C.orange+"12", border:"1px solid "+C.orange+"33", borderRadius:8, padding:"8px 14px", marginTop:12 }}>
                      <span style={{ color:C.orange, fontSize:11, fontWeight:600 }}>⚠️ Simulación ilustrativa basada en la lógica de la estrategia. No representa resultados reales ni garantiza rendimientos futuros.</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign:"center", color:C.gray, padding:"30px 0", fontSize:13 }}>Genera el algoritmo primero para ver la curva de equity simulada</div>
                )}
              </div>
            )}

            {activeTab === "code" && result && (
              <div style={{ marginTop:12, background:C.blue+"12", border:"1px solid "+C.blue+"33", borderRadius:8, padding:"10px 14px" }}>
                <p style={{ color:C.blueL, fontSize:12, margin:0, fontWeight:600 }}>📋 TradingView → Pine Editor → Pegar código → Agregar al gráfico</p>
              </div>
            )}

            <div style={{ marginTop:16, background:"linear-gradient(135deg,"+C.blue+"22,"+C.green+"14)", border:"1px solid "+C.blue+"55", borderRadius:12, padding:"18px 20px" }}>
              <div style={{ marginBottom:12 }}>
                <div style={{ color:C.white, fontWeight:900, fontSize:15, marginBottom:4 }}>¿Quieres el FT01 y MBS?</div>
                <div style={{ color:C.grayL, fontSize:12, lineHeight:1.6 }}>El algoritmo institucional de Fyntrum + operativa en vivo diaria · canal de señales · comunidad · portafolio gestionado</div>
              </div>
              <a href="https://www.fyntrum.lat/checkout?checkoutId=ca727402-8a76-4753-90ab-c5026b7fa809" target="_blank" rel="noopener noreferrer" style={{ display:"inline-block", background:"linear-gradient(135deg,"+C.blue+","+C.green+")", borderRadius:9, padding:"11px 28px", color:"#fff", fontWeight:900, fontSize:13, textDecoration:"none", boxShadow:"0 4px 20px "+C.blue+"55", letterSpacing:0.5 }}>Acceder a la Membresía Trimestral →</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
