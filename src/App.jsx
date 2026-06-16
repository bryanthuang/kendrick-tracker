import { useState, useEffect, useCallback } from "react";
import { dbGet, dbSet } from "./supabase.js";

const TRADE_KEY = "trade-tracker-v2";
const EXPENSE_KEY = "expense-tracker-v1";
const AGENT_KEY = "agent-tracker-v1";
const TRANSACTION_KEY = "transaction-contacts-v1";

// Read-only mode: no ?edit param = client view
const IS_EDIT = new URLSearchParams(window.location.search).has("edit");

const DEFAULT_CONTACTS = [
  { id: 1, name: "Steve Salviejo", company: "WFG National Title Insurance", role: "escrow", phone: "(415) 625-0409", mobile: "(415) 265-7561", email: "TeamSalviejo@wfgtitle.com", notes: "File #26-167162 · Fax: (415) 651-8599" },
];

const ORDER_ITEMS = [
  { id: 2001, name: "Delta Faryn 4in Bathroom Faucet — brushed nickel", qty: 2, unit: 99.00, total: 198.00, eta: "Jun 11", status: "delivered" },
  { id: 2002, name: "HUOKU Ceder 32.3in 6-Light Sputnik — matte black, gray glass", qty: 1, unit: 175.89, total: 175.89, eta: "Jun 13", status: "delivered" },
  { id: 2003, name: "Y'INSP Aura Radiance 12in 1-Light — matte black, ceramic dome + opal glass", qty: 1, unit: 109.00, total: 109.00, eta: "Jun 12", status: "delivered" },
  { id: 2004, name: "Delta Faryn Shower Faucet — brushed nickel, valve included", qty: 2, unit: 149.00, total: 298.00, eta: "Jun 11", status: "delivered" },
  { id: 2005, name: "Y'INSP 27.56in 5-Light Sputnik — matte black, white glass", qty: 1, unit: 185.00, total: 185.00, eta: "Jun 12", status: "delivered" },
  { id: 2006, name: "Relyblo 24x36in Mirror — matte black frame", qty: 2, unit: 60.00, total: 120.00, eta: "Jun 12", status: "delivered" },
  { id: 2007, name: "Eglo Maserlo 15.95in LED Flush Mount — silver/satin nickel", qty: 2, unit: 219.99, total: 439.98, eta: "Jun 16", status: "out_for_delivery" },
  { id: 2008, name: "Feit Electric T6 E12 LED Bulbs Soft White 4-pack", qty: 2, unit: 12.98, total: 25.96, eta: "Jun 10", status: "delivered" },
  { id: 2009, name: "Newhouse Lighting T4 G9 LED Bulbs 4-pack", qty: 1, unit: 18.97, total: 18.97, eta: "Jun 11", status: "delivered" },
  { id: 2010, name: "aiwen 17.71in 5-Light — matte black, globe glass", qty: 1, unit: 94.99, total: 94.99, eta: "Jun 12", status: "delivered" },
  { id: 2011, name: "Feit Electric T4 G9 LED Bulbs 3000K", qty: 6, unit: 9.98, total: 59.88, eta: "Jun 10", status: "delivered" },
  { id: 2012, name: "Delta Faryn Toilet Paper Holder — brushed nickel", qty: 2, unit: 23.98, total: 47.96, eta: "Jun 10", status: "delivered" },
  { id: 2013, name: "EcoSmart A19 Dimmable LED Bulbs 4-pack", qty: 1, unit: 10.98, total: 10.98, eta: "Jun 10", status: "delivered" },
  { id: 2014, name: "Glacier Bay 31x22in Cultured Marble Vanity Top — white", qty: 2, unit: 139.00, total: 278.00, eta: "Jun 10", status: "delivered" },
];

const DEFAULT_TRADES = [
  { id: 1, name: "Leyde the Landscaper", scope: "Cleanup and mulch", phone: "(669) 270-9538", date: "Sun 6/7", cost: "$2,600", status: "scheduled", done: false },
  { id: 2, name: "Target Painting", scope: "Full interior paint, cabinet paint, drywall repair", phone: "(408) 674-1126", date: "6/9 – ~6/16", cost: "$8,350", status: "scheduled", done: false },
  { id: 3, name: "Paul Kelly House Cleaning", scope: "Deep clean — after paint finishes", phone: "(415) 889-9915", date: "Thu 6/18", cost: "$650–750", status: "scheduled", done: false },
  { id: 4, name: "Alex Liu", scope: "Install all materials", phone: "(415) 279-2085", date: "Wed 6/17", cost: "TBD", status: "scheduled", done: false },
  { id: 5, name: "Brothers Movers", scope: "Haul-away", phone: "", date: "6/7+", cost: "$1,650", status: "scheduled", done: false },
  { id: 6, name: "HomeGuard Incorporated", scope: "WDO (Termite) + Home Inspection — 8:30am arrival", phone: "(855) 331-1900", date: "Thu 6/18", cost: "$1,250", status: "scheduled", done: false },
];

const DEFAULT_EXPENSES = [
  { id: 1, desc: "Target Painting — interior, cabinets, drywall", cat: "labor", amount: 8350, status: "confirmed" },
  { id: 2, desc: "Leyde the Landscaper — cleanup & mulch", cat: "labor", amount: 2600, status: "confirmed" },
  { id: 3, desc: "Brothers Movers — haul-away", cat: "labor", amount: 1650, status: "confirmed" },
  { id: 4, desc: "Paul Kelly House Cleaning", cat: "labor", amount: 700, status: "estimated" },
  { id: 5, desc: "Alex Liu — install all materials", cat: "labor", amount: 0, status: "estimated" },
  { id: 6, desc: "Materials — Home Depot order WN61059545", cat: "materials", amount: 2235.94, status: "paid" },
  { id: 7, desc: "HomeGuard — WDO + Home Inspection", cat: "other", amount: 1250, status: "confirmed" },
  { id: 8, desc: "Natural Hazard Disclosure (NHD)", cat: "other", amount: 79, status: "confirmed" },
];

const DEFAULT_AGENTS = [
  { id: 1, name: "Peter Nguyen", brokerage: "Keller Williams", phone: "(415) 748-9999", email: "", notes: "2 buyer clients interested", status: "interested" },
  { id: 2, name: "Bertha M. Gonzalez", brokerage: "Provence Realty", phone: "(408) 594-0371", email: "", notes: "Has buyer client interested in Kendrick area", status: "interested" },
  { id: 3, name: "Joeanna Basi", brokerage: "RE/MAX Executive", phone: "(209) 499-1160", email: "workwithjoeanna@gmail.com", notes: "Sold 1217 Bellingham ~$1.3M. Initiated disclosure package.", status: "active" },
  { id: 4, name: "Le Nguyen", brokerage: "Block Change", phone: "(408) 839-8944", email: "Le@blockchangere.com", notes: "Clients want to tour ~Jun 18. Requested disclosures.", status: "interested" },
  { id: 5, name: "Helen Nguyen", brokerage: "Coldwell Banker Realty", phone: "(408) 623-6577", email: "ha.nguyen@cbnorcal.com", notes: "CalRE #01256922", status: "interested" },
];

function parseCost(str) {
  if (!str || str === "TBD") return 0;
  const nums = str.replace(/[^0-9,.\-]/g, "").split(/[-–]/).map(s => parseFloat(s.replace(/,/g, ""))).filter(n => !isNaN(n));
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function fmt(n) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function initials(name) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const C = {
  bg: "#ffffff",
  bgSoft: "#f9fafb",
  bgPage: "#f3f4f6",
  border: "rgba(0,0,0,0.1)",
  borderMed: "rgba(0,0,0,0.18)",
  text: "#111827",
  textSub: "#6b7280",
  textHint: "#9ca3af",
  blue: "#3b82f6", blueLight: "#dbeafe", blueDark: "#1e40af",
  green: "#22c55e", greenLight: "#dcfce7", greenDark: "#166534",
  amber: "#f59e0b", amberLight: "#fef3c7", amberDark: "#92400e",
  purple: "#8b5cf6", purpleLight: "#ede9fe", purpleDark: "#5b21b6",
};

function MetricCard({ label, value, sub, accent }) {
  const accents = {
    blue: { bar: C.blue }, green: { bar: C.green },
    amber: { bar: C.amber }, purple: { bar: C.purple },
  };
  const a = accents[accent] || { bar: "#d1d5db" };
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: "1rem 1.1rem", borderTop: `3px solid ${a.bar}` }}>
      <div style={{ fontSize: 11, color: C.textSub, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: C.text, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.textHint, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Badge({ label, color = "gray" }) {
  const map = {
    blue: { bg: C.blueLight, color: C.blueDark },
    green: { bg: C.greenLight, color: C.greenDark },
    amber: { bg: C.amberLight, color: C.amberDark },
    purple: { bg: C.purpleLight, color: C.purpleDark },
    gray: { bg: C.bgSoft, color: C.textSub },
  };
  const s = map[color] || map.gray;
  return (
    <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 20, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function Avatar({ name, color = "blue" }) {
  const map = {
    blue: { bg: C.blueLight, color: C.blueDark },
    green: { bg: C.greenLight, color: C.greenDark },
    amber: { bg: C.amberLight, color: C.amberDark },
    purple: { bg: C.purpleLight, color: C.purpleDark },
  };
  const s = map[color] || map.blue;
  return (
    <div style={{ width: 38, height: 38, borderRadius: "50%", background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
      {initials(name)}
    </div>
  );
}

function Card({ children, faded, style: st = {} }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: "1rem 1.1rem", marginBottom: 10, opacity: faded ? 0.55 : 1, ...st }}>
      {children}
    </div>
  );
}

function SectionHeader({ label, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "1.25rem 0 .6rem" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: ".07em" }}>{label}</div>
      {IS_EDIT && action}
    </div>
  );
}

function Btn({ onClick, label, primary, small }) {
  return (
    <button onClick={onClick} style={{
      fontSize: small ? 12 : 13, padding: small ? "5px 12px" : "7px 16px",
      borderRadius: 8, cursor: "pointer", fontWeight: 500,
      border: primary ? "none" : `1px solid ${C.borderMed}`,
      background: primary ? C.text : "transparent",
      color: primary ? C.bg : C.text,
    }}>{label}</button>
  );
}

function IconBtn({ onClick, icon, danger }) {
  return (
    <button onClick={onClick} style={{
      background: "none", border: `1px solid ${C.border}`, borderRadius: 8,
      width: 30, height: 30, cursor: "pointer", fontSize: 14,
      color: danger ? "#ef4444" : C.textHint,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>{icon}</button>
  );
}

function Modal({ open, title, onClose, onSave, children }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: "1.25rem", color: C.text }}>{title}</h3>
        {children}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: "1.25rem", paddingTop: "1rem", borderTop: `1px solid ${C.border}` }}>
          <Btn onClick={onClose} label="Cancel" />
          <Btn onClick={onSave} label="Save" primary />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: ".875rem" }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

function parseTradeRange(dateStr) {
  if (!dateStr || dateStr === "TBD") return null;
  const nums = dateStr.match(/6\/(\d+)/g);
  if (!nums) return null;
  const days = nums.map(s => parseInt(s.split("/")[1]));
  if (days.length === 1) return [days[0], days[0]];
  return [days[0], days[1]];
}

function TradeCalendar({ trades }) {
  const DAYS = ["S","M","T","W","T","F","S"];
  const startDow = 1;
  const daysInMonth = 30;
  const tradeColors = [C.blue, C.purple, C.amber, C.green, C.blue, "#ef4444"];
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dayMap = {};
  trades.forEach((t, i) => {
    const range = parseTradeRange(t.date);
    if (!range) return;
    for (let d = range[0]; d <= Math.min(range[1], 30); d++) {
      if (!dayMap[d]) dayMap[d] = [];
      dayMap[d].push(i);
    }
  });

  const today = new Date();
  const todayDay = today.getMonth() === 5 && today.getFullYear() === 2026 ? today.getDate() : null;

  return (
    <Card>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>June 2026 schedule</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 8 }}>
        {DAYS.map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: C.textHint, paddingBottom: 4 }}>{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const tradeIdxs = dayMap[day] || [];
          const isToday = day === todayDay;
          return (
            <div key={i} style={{ textAlign: "center", borderRadius: 8, padding: "4px 2px", background: tradeIdxs.length > 0 ? tradeColors[tradeIdxs[0]] + "22" : "transparent", border: isToday ? `1.5px solid ${C.blue}` : "1.5px solid transparent" }}>
              <div style={{ fontSize: 11, fontWeight: isToday ? 600 : 400, color: isToday ? C.blueDark : tradeIdxs.length > 0 ? C.text : C.textSub }}>{day}</div>
              {tradeIdxs.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 1 }}>
                  {tradeIdxs.slice(0, 3).map(idx => (
                    <div key={idx} style={{ width: 4, height: 4, borderRadius: "50%", background: tradeColors[idx % tradeColors.length] }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
        {trades.filter(t => parseTradeRange(t.date)).map((t, i) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.textSub }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: tradeColors[i % tradeColors.length], flexShrink: 0 }} />
            {t.name}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Trades Tab ───────────────────────────────────────────────────────────────

function TradesTab({ trades, setTrades, save }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const openAdd = () => { setForm({ name: "", scope: "", phone: "", date: "", cost: "", status: "scheduled" }); setModal("add"); };
  const openEdit = (t) => { setForm({ ...t }); setModal(t.id); };
  const close = () => setModal(null);

  const saveIt = async () => {
    if (!form.name?.trim()) return;
    const updated = modal === "add"
      ? [...trades, { ...form, id: Date.now(), done: false }]
      : trades.map(t => t.id === modal ? { ...t, ...form, done: t.done } : t);
    setTrades(updated); await save(TRADE_KEY, updated); close();
  };

  const toggle = async (id) => {
    if (!IS_EDIT) return;
    const u = trades.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTrades(u); await save(TRADE_KEY, u);
  };

  const del = async (id) => {
    const u = trades.filter(t => t.id !== id);
    setTrades(u); await save(TRADE_KEY, u);
  };

  const total = trades.reduce((s, t) => s + parseCost(t.cost), 0);
  const done = trades.filter(t => t.done).length;
  const pct = trades.length > 0 ? Math.round(done / trades.length * 100) : 0;
  const avatarColors = ["blue", "purple", "amber", "green", "blue", "purple"];

  const statusColor = (status, isDone) => isDone ? "green" : status === "scheduled" ? "blue" : "amber";
  const statusLabel = (status, isDone) => isDone ? "Done" : status === "scheduled" ? "Scheduled" : "TBD";

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: "1.5rem" }}>
        <MetricCard label="Labor total" value={fmt(total)} accent="blue" />
        <MetricCard label="Progress" value={`${done} / ${trades.length}`} sub={`${pct}% complete`} accent="green" />
        <MetricCard label="List date" value="Jun 24–25" accent="amber" />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textSub, marginBottom: 6 }}>
          <span>Overall progress</span><span style={{ fontWeight: 500, color: C.text }}>{pct}%</span>
        </div>
        <div style={{ background: C.bgPage, borderRadius: 20, height: 8, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 20, background: `linear-gradient(90deg, ${C.blue}, ${C.green})`, width: `${pct}%`, transition: "width .4s ease" }} />
        </div>
      </div>

      <TradeCalendar trades={trades} />

      {modal && IS_EDIT && (
        <Modal open title={modal === "add" ? "Add trade" : "Edit trade"} onClose={close} onSave={saveIt}>
          {[["name","Contractor name"],["scope","Scope of work"],["phone","Phone"],["date","Date / window"],["cost","Cost"]].map(([f,lbl]) => (
            <Field key={f} label={lbl}><input value={form[f]||""} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} style={{width:"100%"}} /></Field>
          ))}
          <Field label="Status">
            <select value={form.status||"scheduled"} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={{width:"100%"}}>
              <option value="scheduled">Scheduled</option>
              <option value="pending">TBD / pending</option>
              <option value="done">Done</option>
            </select>
          </Field>
        </Modal>
      )}

      <SectionHeader label={`Trades · ${trades.length}`} action={<Btn onClick={openAdd} label="+ Add trade" small />} />

      {trades.map((t, i) => (
        <Card key={t.id} faded={t.done}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <Avatar name={t.name} color={avatarColors[i % avatarColors.length]} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{t.name}</div>
                  {t.scope && <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>{t.scope}</div>}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  <Badge label={statusLabel(t.status, t.done)} color={statusColor(t.status, t.done)} />
                  {IS_EDIT && <>
                    <IconBtn onClick={() => toggle(t.id)} icon={t.done ? "↩" : "✓"} />
                    <IconBtn onClick={() => openEdit(t)} icon="✎" />
                    <IconBtn onClick={() => del(t.id)} icon="✕" danger />
                  </>}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.textSub, alignItems: "center" }}>
                {t.phone && <span>📞 {t.phone}</span>}
                {t.date && <span>🗓 {t.date}</span>}
                {t.cost && t.cost !== "TBD" && <span style={{ fontSize: 12, fontWeight: 600, color: C.text, background: C.bgSoft, padding: "2px 8px", borderRadius: 6 }}>{t.cost}</span>}
                {t.cost === "TBD" && <span style={{ color: C.textHint, fontStyle: "italic" }}>Cost TBD</span>}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Materials Tab ────────────────────────────────────────────────────────────

function MaterialsTab() {
  const subtotal = ORDER_ITEMS.reduce((s, i) => s + i.total, 0);
  const orderTotal = 2235.94;
  const delivered = ORDER_ITEMS.filter(i => i.status === "delivered").length;
  const outForDelivery = ORDER_ITEMS.filter(i => i.status === "out_for_delivery").length;
  const shipped = ORDER_ITEMS.filter(i => i.status === "shipped").length;

  const statusConfig = {
    delivered:        { label: "Delivered",        color: C.greenDark,  bg: C.greenLight, icon: "✓" },
    out_for_delivery: { label: "Out for delivery", color: C.blueDark,   bg: C.blueLight,  icon: "🚚" },
    shipped:          { label: "Shipped",           color: C.amberDark,  bg: C.amberLight, icon: "📦" },
  };

  const etaGroups = {};
  ORDER_ITEMS.forEach(item => {
    if (!etaGroups[item.eta]) etaGroups[item.eta] = [];
    etaGroups[item.eta].push(item);
  });
  const sortedEtas = Object.keys(etaGroups).sort((a, b) => {
    const dayA = parseInt(a.replace(/[^0-9]/g, "").slice(-2));
    const dayB = parseInt(b.replace(/[^0-9]/g, "").slice(-2));
    return dayA - dayB;
  });

  const etaStatusLabel = (items) => {
    if (items.every(i => i.status === "delivered")) return { label: "Delivered", color: C.greenDark, bg: C.greenLight };
    if (items.some(i => i.status === "out_for_delivery")) return { label: "Out for delivery", color: C.blueDark, bg: C.blueLight };
    return { label: "Shipped", color: C.amberDark, bg: C.amberLight };
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: "1.5rem" }}>
        <MetricCard label="Order total" value={fmt(orderTotal)} sub="WN61059545" accent="green" />
        <MetricCard label="Delivered" value={`${delivered} / ${ORDER_ITEMS.length}`} sub="items received" accent="green" />
        <MetricCard label="Out for delivery" value={outForDelivery.toString()} sub="arriving today" accent="blue" />
        <MetricCard label="En route" value={shipped.toString()} sub="items shipped" accent="amber" />
      </div>

      <Card>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Delivery progress</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {ORDER_ITEMS.map(item => (
            <div key={item.id} style={{ flex: 1, height: 8, borderRadius: 4, background: item.status === "delivered" ? C.green : item.status === "out_for_delivery" ? C.blue : C.amberLight }} title={item.name} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
          {[["delivered","Delivered",C.green],["out_for_delivery","Out for delivery",C.blue],["shipped","Shipped",C.amber]].map(([s,lbl,col]) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 4, color: C.textSub }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: col }} />
              {lbl}
            </div>
          ))}
        </div>
      </Card>

      <SectionHeader label="Delivery schedule" />
      {sortedEtas.map(eta => {
        const items = etaGroups[eta];
        const sl = etaStatusLabel(items);
        return (
          <div key={eta} style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{eta}</div>
              <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 20, background: sl.bg, color: sl.color }}>{sl.label}</span>
            </div>
            {items.map(item => {
              const sc = statusConfig[item.status] || statusConfig.shipped;
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 6, opacity: item.status === "delivered" ? 0.65 : 1 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{sc.icon}</span>
                  <div style={{ flex: 1, fontSize: 13, color: item.status === "delivered" ? C.textSub : C.text, textDecoration: item.status === "delivered" ? "line-through" : "none" }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: C.textHint, whiteSpace: "nowrap" }}>×{item.qty}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text, minWidth: 64, textAlign: "right" }}>{fmt(item.total)}</div>
                </div>
              );
            })}
          </div>
        );
      })}

      <div style={{ background: C.bgSoft, border: `1px solid ${C.border}`, borderRadius: 12, padding: "1rem", marginTop: "1rem" }}>
        {[["Subtotal", fmt(subtotal)], ["Discount", "-$108.24"], ["Sales tax", "$203.28"]].map(([lbl, val]) => (
          <div key={lbl} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.textSub, marginBottom: 6 }}>
            <span>{lbl}</span><span style={{ color: lbl === "Discount" ? C.greenDark : C.text }}>{val}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 600, color: C.text, borderTop: `1px solid ${C.borderMed}`, paddingTop: 10, marginTop: 4 }}>
          <span>Order total</span><span>{fmt(orderTotal)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Expenses Tab ─────────────────────────────────────────────────────────────

function ExpensesTab({ expenses, setExpenses, save }) {
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});

  const openAdd = () => { setForm({ desc: "", amount: "", cat: "labor", status: "confirmed" }); setEditId(null); setModal(true); };
  const openEdit = (e) => { setForm({ desc: e.desc, amount: e.amount, cat: e.cat, status: e.status }); setEditId(e.id); setModal(true); };
  const close = () => setModal(false);

  const saveExp = async () => {
    if (!form.desc?.trim()) return;
    const amount = parseFloat(form.amount) || 0;
    const updated = editId
      ? expenses.map(e => e.id === editId ? { ...e, ...form, amount } : e)
      : [...expenses, { id: Date.now(), desc: form.desc, cat: form.cat, amount, status: form.status }];
    setExpenses(updated); await save(EXPENSE_KEY, updated); close();
  };

  const del = async (id) => {
    const u = expenses.filter(e => e.id !== id);
    setExpenses(u); await save(EXPENSE_KEY, u);
  };

  const labor = expenses.filter(e => e.cat === "labor").reduce((s, e) => s + e.amount, 0);
  const mats = expenses.filter(e => e.cat === "materials").reduce((s, e) => s + e.amount, 0);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const confirmed = expenses.filter(e => e.status === "confirmed" || e.status === "paid").reduce((s, e) => s + e.amount, 0);
  const lpct = total > 0 ? Math.round(labor / total * 100) : 0;
  const mpct = total > 0 ? Math.round(mats / total * 100) : 0;

  const catColor = { labor: "blue", materials: "green", other: "purple" };
  const statusColor = { confirmed: "blue", estimated: "amber", paid: "green" };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: "1.5rem" }}>
        <MetricCard label="Total spend" value={fmt(total)} accent="blue" />
        <MetricCard label="Labor" value={fmt(labor)} sub={`${lpct}% of total`} accent="purple" />
        <MetricCard label="Materials" value={fmt(mats)} sub={`${mpct}% of total`} accent="green" />
        <MetricCard label="Confirmed" value={fmt(confirmed)} sub={`${fmt(total - confirmed)} est.`} accent="amber" />
      </div>

      <Card>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>Spend breakdown</div>
        {[{ label: "Labor", pct: lpct, amount: labor, color: C.blue }, { label: "Materials", pct: mpct, amount: mats, color: C.green }].map(b => (
          <div key={b.label} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
              <span style={{ color: C.textSub }}>{b.label}</span>
              <span style={{ fontWeight: 500 }}>{fmt(b.amount)} <span style={{ color: C.textHint, fontWeight: 400 }}>({b.pct}%)</span></span>
            </div>
            <div style={{ background: C.bgPage, borderRadius: 20, height: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 20, background: b.color, width: `${b.pct}%` }} />
            </div>
          </div>
        ))}
      </Card>

      {IS_EDIT && modal && (
        <Modal open title={editId ? "Edit expense" : "Add expense"} onClose={close} onSave={saveExp}>
          <Field label="Description"><input value={form.desc||""} onChange={e=>setForm(p=>({...p,desc:e.target.value}))} style={{width:"100%"}} /></Field>
          <Field label="Amount ($)"><input type="number" step="0.01" value={form.amount||""} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} style={{width:"100%"}} /></Field>
          <Field label="Category">
            <select value={form.cat||"labor"} onChange={e=>setForm(p=>({...p,cat:e.target.value}))} style={{width:"100%"}}>
              <option value="labor">Labor</option>
              <option value="materials">Materials</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status||"confirmed"} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={{width:"100%"}}>
              <option value="confirmed">Confirmed</option>
              <option value="estimated">Estimated</option>
              <option value="paid">Paid</option>
            </select>
          </Field>
        </Modal>
      )}

      <SectionHeader label="All expenses" action={<Btn onClick={openAdd} label="+ Add" small />} />

      {[...expenses].sort((a, b) => b.amount - a.amount).map(e => (
        <Card key={e.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 4 }}>{e.desc}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Badge label={e.cat.charAt(0).toUpperCase()+e.cat.slice(1)} color={catColor[e.cat]||"gray"} />
                <Badge label={e.status.charAt(0).toUpperCase()+e.status.slice(1)} color={statusColor[e.status]||"gray"} />
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: e.amount > 0 ? C.text : C.textHint }}>
                {e.amount > 0 ? fmt(e.amount) : "TBD"}
              </div>
              {IS_EDIT && (
                <div style={{ display: "flex", gap: 4, marginTop: 6, justifyContent: "flex-end" }}>
                  <IconBtn onClick={() => openEdit(e)} icon="✎" />
                  <IconBtn onClick={() => del(e.id)} icon="✕" danger />
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}

      <div style={{ background: C.bgSoft, border: `1px solid ${C.borderMed}`, borderRadius: 12, padding: "1rem 1.1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Total</span>
        <span style={{ fontSize: 18, fontWeight: 600 }}>{fmt(total)}</span>
      </div>
    </div>
  );
}

// ─── Agents Tab ───────────────────────────────────────────────────────────────

function AgentsTab({ agents, setAgents, save }) {
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});

  const openAdd = () => { setForm({ name: "", brokerage: "", phone: "", email: "", notes: "", status: "interested" }); setEditId(null); setModal(true); };
  const openEdit = (a) => { setForm({ ...a }); setEditId(a.id); setModal(true); };
  const close = () => setModal(false);

  const saveAgent = async () => {
    if (!form.name?.trim()) return;
    const updated = editId
      ? agents.map(a => a.id === editId ? { ...a, ...form } : a)
      : [...agents, { id: Date.now(), ...form }];
    setAgents(updated); await save(AGENT_KEY, updated); close();
  };

  const del = async (id) => {
    const u = agents.filter(a => a.id !== id);
    setAgents(u); await save(AGENT_KEY, u);
  };

  const statusColor = { interested: "blue", active: "green", offer: "amber", closed: "gray" };
  const statusLabel = { interested: "Interested", active: "Active", offer: "Offer", closed: "Closed" };
  const avatarColors = ["blue", "purple", "green", "amber", "blue"];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: "1.5rem" }}>
        <MetricCard label="Tracking" value={agents.length.toString()} accent="blue" />
        <MetricCard label="Active" value={agents.filter(a => a.status === "active").length.toString()} accent="green" />
        <MetricCard label="Interested" value={agents.filter(a => a.status === "interested").length.toString()} accent="purple" />
      </div>

      {IS_EDIT && modal && (
        <Modal open title={editId ? "Edit agent" : "Add agent"} onClose={close} onSave={saveAgent}>
          {[["name","Full name"],["brokerage","Brokerage"],["phone","Phone"],["email","Email"],["notes","Notes"]].map(([f,lbl]) => (
            <Field key={f} label={lbl}><input value={form[f]||""} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} style={{width:"100%"}} /></Field>
          ))}
          <Field label="Status">
            <select value={form.status||"interested"} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={{width:"100%"}}>
              <option value="interested">Interested</option>
              <option value="active">Active</option>
              <option value="offer">Offer submitted</option>
              <option value="closed">Closed</option>
            </select>
          </Field>
        </Modal>
      )}

      <SectionHeader label={`Agents · ${agents.length}`} action={<Btn onClick={openAdd} label="+ Add agent" small />} />

      {agents.map((a, i) => (
        <Card key={a.id}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <Avatar name={a.name} color={avatarColors[i % avatarColors.length]} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>{a.brokerage}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  <Badge label={statusLabel[a.status]||a.status} color={statusColor[a.status]||"gray"} />
                  {IS_EDIT && <>
                    <IconBtn onClick={() => openEdit(a)} icon="✎" />
                    <IconBtn onClick={() => del(a.id)} icon="✕" danger />
                  </>}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.textSub }}>
                {a.phone && <span>📞 {a.phone}</span>}
                {a.email && <span>✉ {a.email}</span>}
                {a.notes && <span style={{ color: C.textHint, fontStyle: "italic" }}>{a.notes}</span>}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Transaction Tab ──────────────────────────────────────────────────────────

function TransactionTab({ contacts, setContacts, save }) {
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});

  const roleConfig = {
    escrow:    { label: "Escrow",     color: "purple" },
    title:     { label: "Title",      color: "blue"   },
    lender:    { label: "Lender",     color: "green"  },
    inspector: { label: "Inspector",  color: "amber"  },
    seller:    { label: "Seller",     color: "green"  },
    other:     { label: "Other",      color: "gray"   },
  };

  const openAdd = () => { setForm({ name:"",company:"",role:"escrow",phone:"",mobile:"",email:"",notes:"" }); setEditId(null); setModal(true); };
  const openEdit = (c) => { setForm({...c}); setEditId(c.id); setModal(true); };
  const close = () => setModal(false);

  const saveContact = async () => {
    if (!form.name?.trim()) return;
    const updated = editId
      ? contacts.map(c => c.id === editId ? { ...c, ...form } : c)
      : [...contacts, { id: Date.now(), ...form }];
    setContacts(updated); await save(TRANSACTION_KEY, updated); close();
  };

  const del = async (id) => {
    const u = contacts.filter(c => c.id !== id);
    setContacts(u); await save(TRANSACTION_KEY, u);
  };

  const avatarColors = ["purple","blue","green","amber"];

  return (
    <div>
      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: ".875rem 1rem", marginBottom: "1.5rem", display: "flex", gap: 10 }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#991b1b", marginBottom: 3 }}>Wire Fraud Alert</div>
          <div style={{ fontSize: 12, color: "#b91c1c" }}>Never trust wiring instructions sent via email. Always call your escrow officer at a verified number before wiring any funds.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: "1.5rem" }}>
        <MetricCard label="File number" value="26-167162" sub="WFG National Title" accent="purple" />
        <MetricCard label="Contacts" value={contacts.length.toString()} sub="transaction parties" accent="blue" />
        <MetricCard label="Seller" value="Castor Lai" sub="& Alicia" accent="amber" />
      </div>

      {IS_EDIT && modal && (
        <Modal open title={editId ? "Edit contact" : "Add contact"} onClose={close} onSave={saveContact}>
          {[["name","Full name"],["company","Company"],["phone","Phone"],["mobile","Mobile"],["email","Email"],["notes","Notes"]].map(([f,lbl]) => (
            <Field key={f} label={lbl}><input value={form[f]||""} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} style={{width:"100%"}} /></Field>
          ))}
          <Field label="Role">
            <select value={form.role||"escrow"} onChange={e=>setForm(p=>({...p,role:e.target.value}))} style={{width:"100%"}}>
              <option value="escrow">Escrow</option>
              <option value="title">Title</option>
              <option value="lender">Lender</option>
              <option value="inspector">Inspector</option>
              <option value="seller">Seller</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </Modal>
      )}

      <SectionHeader label={`Transaction contacts · ${contacts.length}`} action={<Btn onClick={openAdd} label="+ Add contact" small />} />

      {contacts.map((c, i) => {
        const rc = roleConfig[c.role] || roleConfig.other;
        return (
          <Card key={c.id}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <Avatar name={c.name} color={avatarColors[i % avatarColors.length]} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>{c.company}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    <Badge label={rc.label} color={rc.color} />
                    {IS_EDIT && <>
                      <IconBtn onClick={() => openEdit(c)} icon="✎" />
                      <IconBtn onClick={() => del(c.id)} icon="✕" danger />
                    </>}
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.textSub }}>
                  {c.phone && <span>📞 {c.phone}</span>}
                  {c.mobile && <span>📱 {c.mobile}</span>}
                  {c.email && <span>✉ {c.email}</span>}
                  {c.notes && <span style={{ color: C.textHint, fontStyle: "italic" }}>{c.notes}</span>}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: "trades",      label: "Trades",      icon: "🔨" },
  { key: "materials",   label: "Materials",   icon: "📦" },
  { key: "expenses",    label: "Expenses",    icon: "💰" },
  { key: "agents",      label: "Agents",      icon: "👥" },
  { key: "transaction", label: "Transaction", icon: "🏦" },
];

export default function App() {
  const [tab, setTab] = useState("trades");
  const [trades, setTrades] = useState(DEFAULT_TRADES);
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES);
  const [agents, setAgents] = useState(DEFAULT_AGENTS);
  const [contacts, setContacts] = useState(DEFAULT_CONTACTS);
  const [status, setStatus] = useState("Loading...");

  const saveData = useCallback(async (key, value) => {
    try {
      await dbSet(key, value);
      setStatus("Saved ✓");
      setTimeout(() => setStatus(""), 2000);
    } catch (e) { setStatus(`Save failed: ${e.message}`); }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const tr = await dbGet(TRADE_KEY);
        if (tr) {
          const raw = Array.isArray(tr) ? tr : (tr.trades || DEFAULT_TRADES);
          const synced = raw.map(t => {
            if (t.id === 3) return { ...t, date: "Thu 6/18", status: "scheduled" };
            if (t.id === 4) return { ...t, date: "Wed 6/17", status: "scheduled" };
            return t;
          });
          if (!synced.find(t => t.id === 6)) synced.push({ id: 6, name: "HomeGuard Incorporated", scope: "WDO (Termite) + Home Inspection — 8:30am arrival", phone: "(855) 331-1900", date: "Thu 6/18", cost: "$1,250", status: "scheduled", done: false });
          else { const hg = synced.find(t => t.id === 6); if (hg) hg.date = "Thu 6/18"; }
          setTrades(synced);
        }

        const ex = await dbGet(EXPENSE_KEY);
        if (ex) {
          const arr = Array.isArray(ex) ? ex : DEFAULT_EXPENSES;
          const mapped = arr.map(e => {
            if (e.cat === "materials") return { ...e, amount: 2235.94, status: "paid", desc: "Materials — Home Depot order WN61059545" };
            if (e.desc?.includes("Brothers Movers")) return { ...e, amount: 1650, status: "confirmed" };
            if (e.desc?.includes("Alex Liu")) return { ...e, desc: "Alex Liu — install all materials", status: "estimated" };
            if (e.desc?.includes("Target Painting")) return { ...e, amount: 8350 };
            return e;
          });
          if (!mapped.find(e => e.id === 7)) mapped.push({ id: 7, desc: "HomeGuard — WDO + Home Inspection", cat: "other", amount: 1250, status: "confirmed" });
          if (!mapped.find(e => e.id === 8)) mapped.push({ id: 8, desc: "Natural Hazard Disclosure (NHD)", cat: "other", amount: 79, status: "confirmed" });
          setExpenses(mapped);
        }

        const ag = await dbGet(AGENT_KEY);
        if (ag) {
          const arr = Array.isArray(ag) ? ag : DEFAULT_AGENTS;
          if (!arr.find(a => a.id === 4)) arr.push({ id: 4, name: "Le Nguyen", brokerage: "Block Change", phone: "(408) 839-8944", email: "Le@blockchangere.com", notes: "Clients want to tour ~Jun 18. Requested disclosures.", status: "interested" });
          if (!arr.find(a => a.id === 5)) arr.push({ id: 5, name: "Helen Nguyen", brokerage: "Coldwell Banker Realty", phone: "(408) 623-6577", email: "ha.nguyen@cbnorcal.com", notes: "CalRE #01256922", status: "interested" });
          setAgents(arr);
        }

        const tx = await dbGet(TRANSACTION_KEY);
        if (tx) {
          const arr = Array.isArray(tx) ? tx : DEFAULT_CONTACTS;
          if (!arr.find(c => c.id === 1)) arr.unshift({ id: 1, name: "Steve Salviejo", company: "WFG National Title Insurance", role: "escrow", phone: "(415) 625-0409", mobile: "(415) 265-7561", email: "TeamSalviejo@wfgtitle.com", notes: "File #26-167162 · Fax: (415) 651-8599" });
          setContacts(arr);
        }

        setStatus(IS_EDIT ? "Edit mode" : "");
        setTimeout(() => setStatus(""), 2000);
      } catch (e) { setStatus(""); }
    }
    load();
  }, []);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "1.5rem 2rem", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: C.textHint, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>
          2669 Kendrick Circle · Stonegate West, San Jose
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: C.text, margin: 0 }}>Listing prep tracker</h1>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {IS_EDIT && <span style={{ fontSize: 11, background: C.greenLight, color: C.greenDark, padding: "3px 10px", borderRadius: 20, fontWeight: 500 }}>✎ Edit mode</span>}
            {status && <span style={{ fontSize: 12, color: C.textHint, fontStyle: "italic" }}>{status}</span>}
          </div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, background: C.blueLight, borderRadius: 20, padding: "4px 12px" }}>
          <span style={{ fontSize: 12, color: C.blueDark }}>🗓 Target list date: Jun 24–25, 2026</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            fontSize: 13, padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontWeight: 500,
            border: tab === t.key ? "none" : `1px solid ${C.border}`,
            background: tab === t.key ? C.text : C.bg,
            color: tab === t.key ? C.bg : C.textSub,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {tab === "trades"      && <TradesTab trades={trades} setTrades={setTrades} save={saveData} />}
      {tab === "materials"   && <MaterialsTab />}
      {tab === "expenses"    && <ExpensesTab expenses={expenses} setExpenses={setExpenses} save={saveData} />}
      {tab === "agents"      && <AgentsTab agents={agents} setAgents={setAgents} save={saveData} />}
      {tab === "transaction" && <TransactionTab contacts={contacts} setContacts={setContacts} save={saveData} />}
    </div>
  );
}
