// ==========================================
// CalcX Pro - 50-in-1 Calculator Hub Engine
// ==========================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --- Main Calculator Engine ---
class Calculator {
  constructor() {
    this.expression = '';
    this.currentInput = '0';
    this.memory = 0;
    this.isAngleDeg = true;
    this.history = JSON.parse(localStorage.getItem('calc_history') || '[]');
    this.isEvaluated = false;
  }
  appendNumber(digit) {
    if (this.isEvaluated) { this.currentInput = digit === '.' ? '0.' : digit; this.expression = ''; this.isEvaluated = false; return; }
    if (digit === '.') {
      const parts = this.currentInput.split(/[\+\-\*\/\%]/);
      if (parts[parts.length - 1].includes('.')) return;
      if (this.currentInput === '' || this.currentInput === '0') { this.currentInput = '0.'; return; }
    }
    if (this.currentInput === '0' && digit !== '.') this.currentInput = digit;
    else this.currentInput += digit;
  }
  appendOperator(op) {
    if (this.isEvaluated) { this.expression = this.currentInput + ' ' + op + ' '; this.currentInput = ''; this.isEvaluated = false; return; }
    if (this.currentInput === '' && this.expression !== '') { this.expression = this.expression.trimEnd().slice(0, -1) + op + ' '; return; }
    this.expression += (this.currentInput || '0') + ' ' + op + ' ';
    this.currentInput = '';
  }
  appendFunction(fnName) {
    let val = parseFloat(this.currentInput || '0');
    let res = 0;
    switch (fnName) {
      case 'sin': res = this.isAngleDeg ? Math.sin(val * Math.PI / 180) : Math.sin(val); break;
      case 'cos': res = this.isAngleDeg ? Math.cos(val * Math.PI / 180) : Math.cos(val); break;
      case 'tan': res = this.isAngleDeg ? Math.tan(val * Math.PI / 180) : Math.tan(val); break;
      case 'log': res = Math.log10(val); break;
      case 'ln': res = Math.log(val); break;
      case 'sqrt': res = Math.sqrt(val); break;
      case 'sqr': res = Math.pow(val, 2); break;
      case 'pi': this.currentInput = Math.PI.toString(); return;
      case 'e': this.currentInput = Math.E.toString(); return;
      case 'pow': this.appendOperator('^'); return;
    }
    if (typeof res === 'number') res = Number(res.toFixed(10));
    this.currentInput = res.toString();
    this.isEvaluated = true;
  }
  backspace() {
    if (this.isEvaluated) { this.clearAll(); return; }
    if (this.currentInput.length > 0) {
      this.currentInput = this.currentInput.slice(0, -1);
      if (this.currentInput === '' || this.currentInput === '-') this.currentInput = '0';
    }
  }
  toggleSign() {
    if (this.currentInput !== '0' && this.currentInput !== '') {
      this.currentInput = this.currentInput.startsWith('-') ? this.currentInput.slice(1) : '-' + this.currentInput;
    }
  }
  clearAll() { this.expression = ''; this.currentInput = '0'; this.isEvaluated = false; }
  evaluate() {
    let fullExpr = this.expression + (this.currentInput || '');
    if (!fullExpr.trim()) return;
    try {
      let evalExpr = fullExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\^/g, '**');
      if (/[^0-9\+\-\*\/\%\.\(\)\s\*\*]/.test(evalExpr)) throw new Error('Invalid');
      let result = eval(evalExpr);
      if (typeof result === 'number' && !isNaN(result)) {
        result = Number(result.toFixed(10));
        this.history.unshift({ expr: fullExpr, result: result.toString() });
        if (this.history.length > 30) this.history.pop();
        localStorage.setItem('calc_history', JSON.stringify(this.history));
        this.expression = fullExpr + ' =';
        this.currentInput = result.toString();
        this.isEvaluated = true;
      } else { this.currentInput = 'Error'; }
    } catch { this.currentInput = 'Error'; }
  }
  memoryClear() { this.memory = 0; showToast('Memory Cleared'); }
  memoryRead() { this.currentInput = this.memory.toString(); this.isEvaluated = true; showToast(`Recalled ${this.memory}`); }
  memoryAdd() { this.memory += parseFloat(this.currentInput || 0); showToast(`Memory (${this.memory})`); }
  memorySub() { this.memory -= parseFloat(this.currentInput || 0); showToast(`Memory (${this.memory})`); }
  memorySet() { this.memory = parseFloat(this.currentInput || 0); showToast(`Stored ${this.memory}`); }
}

const UNIT_DATA = {
  length: { units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 }, labels: { m: 'Meter (m)', km: 'Kilometer (km)', cm: 'Centimeter (cm)', mm: 'Millimeter (mm)', mi: 'Mile (mi)', yd: 'Yard (yd)', ft: 'Foot (ft)', in: 'Inch (in)' } },
  weight: { units: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495, ton: 1000 }, labels: { kg: 'Kilogram (kg)', g: 'Gram (g)', mg: 'Milligram (mg)', lb: 'Pound (lb)', oz: 'Ounce (oz)', ton: 'Metric Ton (t)' } },
  temperature: { units: { c: 'Celsius', f: 'Fahrenheit', k: 'Kelvin' }, labels: { c: 'Celsius (°C)', f: 'Fahrenheit (°F)', k: 'Kelvin (K)' } },
  speed: { units: { 'm/s': 1, 'km/h': 0.277778, mph: 0.44704, knot: 0.514444 }, labels: { 'm/s': 'Meters/sec (m/s)', 'km/h': 'Kilometers/hour (km/h)', mph: 'Miles/hour (mph)', knot: 'Knot (kn)' } },
  area: { units: { m2: 1, km2: 1000000, ft2: 0.092903, acre: 4046.86, hectare: 10000 }, labels: { m2: 'Square Meter (m²)', km2: 'Square Km (km²)', ft2: 'Square Foot (ft²)', acre: 'Acre', hectare: 'Hectare' } }
};

document.addEventListener('DOMContentLoaded', () => {
  const calc = new Calculator();
  const exprDisplay = document.getElementById('expression-display');
  const resultDisplay = document.getElementById('result-display');
  const sciPanel = document.getElementById('scientific-panel');
  const historyDrawer = document.getElementById('history-drawer');
  const historyList = document.getElementById('history-list');
  const memoryIndicator = document.getElementById('memory-indicator');
  const angleToggleBtn = document.getElementById('angle-unit-toggle');
  const themeToggleBtn = document.getElementById('toggle-theme-btn');
  const modeToggleBtn = document.getElementById('toggle-mode-btn');
  const viewTitle = document.getElementById('view-title');
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle-btn');
  const sidebarSearch = document.getElementById('sidebar-search');

  // --- Real-time Sidebar Search ---
  if (sidebarSearch) {
    sidebarSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? 'flex' : 'none';
      });
    });
  }

  // --- Sidebar Mobile Overlay ---
  let sidebarOverlay = null;
  function openMobileSidebar() {
    if (!sidebarOverlay) {
      sidebarOverlay = document.createElement('div');
      sidebarOverlay.className = 'sidebar-overlay';
      document.body.appendChild(sidebarOverlay);
      sidebarOverlay.addEventListener('click', closeMobileSidebar);
    }
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
  }
  function closeMobileSidebar() {
    sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
  }
  if (sidebarToggle) sidebarToggle.addEventListener('click', openMobileSidebar);

  // --- Navigation & View Switcher ---
  const navItems = document.querySelectorAll('.nav-item');
  const toolViews = document.querySelectorAll('.tool-view');

  function switchView(targetView) {
    navItems.forEach(n => n.classList.remove('active'));
    toolViews.forEach(v => v.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-view="${targetView}"]`);
    const activeView = document.getElementById(`view-${targetView}`);
    if (activeNav && activeView) {
      activeNav.classList.add('active');
      activeView.classList.add('active');
      viewTitle.textContent = activeNav.querySelector('.nav-label').textContent;
      localStorage.setItem('calc_last_tool', targetView);
      if (targetView === 'calc') {
        modeToggleBtn.classList.remove('hidden');
        document.getElementById('toggle-history-btn').classList.remove('hidden');
      } else {
        modeToggleBtn.classList.add('hidden');
        document.getElementById('toggle-history-btn').classList.add('hidden');
      }
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      switchView(item.getAttribute('data-view'));
      closeMobileSidebar();
    });
  });
  switchView(localStorage.getItem('calc_last_tool') || 'calc');

  // --- Main Calculator UI ---
  function updateCalcDisplay() {
    exprDisplay.textContent = calc.expression;
    resultDisplay.textContent = calc.currentInput || '0';
    if (calc.memory !== 0) memoryIndicator.classList.remove('hidden');
    else memoryIndicator.classList.add('hidden');
  }

  document.querySelector('#view-calc .keypad-container').addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;
    const val = target.getAttribute('data-val');
    const action = target.getAttribute('data-action');
    if (val !== null && !action) calc.appendNumber(val);
    else if (action === 'operator') calc.appendOperator(val);
    else if (action === 'equals') calc.evaluate();
    else if (action === 'clear') calc.clearAll();
    else if (action === 'backspace') calc.backspace();
    else if (action === 'negate') calc.toggleSign();
    else if (action === 'percent') { calc.currentInput = (parseFloat(calc.currentInput || 0) / 100).toString(); calc.isEvaluated = true; }
    else if (action && ['sin','cos','tan','log','ln','sqrt','sqr','pow','pi','e'].includes(action)) calc.appendFunction(action);
    else if (action === 'mc') calc.memoryClear();
    else if (action === 'mr') calc.memoryRead();
    else if (action === 'm-add') calc.memoryAdd();
    else if (action === 'm-sub') calc.memorySub();
    else if (action === 'ms') calc.memorySet();
    updateCalcDisplay();
  });

  modeToggleBtn.addEventListener('click', () => sciPanel.classList.toggle('hidden'));
  themeToggleBtn.addEventListener('click', () => {
    const nextTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', nextTheme);
    showToast(`Switched to ${nextTheme.toUpperCase()} theme`);
  });

  // --- Helper Calculators Setup ---

  // Percentage
  const pctX = document.getElementById('pct-x'), pctY = document.getElementById('pct-y'), pctRes = document.getElementById('pct-res');
  function calcPct() { if (pctX && pctY) pctRes.textContent = `$${(((parseFloat(pctX.value)||0)*(parseFloat(pctY.value)||0))/100).toFixed(2)}`; }
  [pctX, pctY].forEach(el => el && el.addEventListener('input', calcPct)); calcPct();

  // Average
  const avgInput = document.getElementById('avg-input'), avgMean = document.getElementById('avg-mean'), avgCount = document.getElementById('avg-count'), avgSum = document.getElementById('avg-sum'), avgMedian = document.getElementById('avg-median');
  function calcAvg() {
    if (!avgInput) return;
    const nums = avgInput.value.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    if (nums.length === 0) return;
    const sum = nums.reduce((a,b)=>a+b,0);
    nums.sort((a,b)=>a-b);
    const mid = Math.floor(nums.length/2);
    const med = nums.length % 2 !== 0 ? nums[mid] : (nums[mid-1] + nums[mid])/2;
    avgMean.textContent = (sum/nums.length).toFixed(2);
    avgCount.textContent = nums.length;
    avgSum.textContent = sum;
    avgMedian.textContent = med;
  }
  if (avgInput) avgInput.addEventListener('input', calcAvg); calcAvg();

  // Ratio
  const ra = document.getElementById('ratio-a'), rb = document.getElementById('ratio-b'), rc = document.getElementById('ratio-c'), rdRes = document.getElementById('ratio-res');
  function calcRatio() {
    if (ra && rb && rc && parseFloat(ra.value) !== 0) {
      rdRes.textContent = ((parseFloat(rb.value)*parseFloat(rc.value))/parseFloat(ra.value)).toFixed(2);
    }
  }
  [ra, rb, rc].forEach(el => el && el.addEventListener('input', calcRatio)); calcRatio();

  // Fraction
  const fn1 = document.getElementById('frac-n1'), fd1 = document.getElementById('frac-d1'), fop = document.getElementById('frac-op'), fn2 = document.getElementById('frac-n2'), fd2 = document.getElementById('frac-d2'), fRes = document.getElementById('frac-res');
  function calcFrac() {
    if (!fn1) return;
    const n1 = parseFloat(fn1.value)||0, d1 = parseFloat(fd1.value)||1, n2 = parseFloat(fn2.value)||0, d2 = parseFloat(fd2.value)||1, op = fop.value;
    let num = 0, den = d1*d2;
    if (op === '+') num = n1*d2 + n2*d1;
    else if (op === '-') num = n1*d2 - n2*d1;
    else if (op === '*') { num = n1*n2; den = d1*d2; }
    else if (op === '/') { num = n1*d2; den = d1*n2; }
    fRes.textContent = `${num}/${den} (${(num/den).toFixed(2)})`;
  }
  [fn1, fd1, fop, fn2, fd2].forEach(el => el && el.addEventListener('change', calcFrac)); calcFrac();

  // LCM & HCF
  const lh1 = document.getElementById('lh-num1'), lh2 = document.getElementById('lh-num2'), lcmR = document.getElementById('lcm-res'), hcfR = document.getElementById('hcf-res');
  function gcd(a,b) { return b === 0 ? a : gcd(b, a%b); }
  function calcLH() {
    if (!lh1) return;
    const a = Math.abs(parseInt(lh1.value)||1), b = Math.abs(parseInt(lh2.value)||1);
    const g = gcd(a,b);
    hcfR.textContent = g;
    lcmR.textContent = (a*b)/g;
  }
  [lh1, lh2].forEach(el => el && el.addEventListener('input', calcLH)); calcLH();

  // Prime
  const pNum = document.getElementById('prime-num'), pRes = document.getElementById('prime-res');
  function calcPrime() {
    if (!pNum) return;
    const n = parseInt(pNum.value)||0;
    if (n < 2) { pRes.textContent = `${n} is NOT prime`; return; }
    let isP = true;
    for (let i = 2; i <= Math.sqrt(n); i++) { if (n % i === 0) { isP = false; break; } }
    pRes.textContent = isP ? `${n} is a PRIME number` : `${n} is a COMPOSITE number`;
  }
  if (pNum) pNum.addEventListener('input', calcPrime); calcPrime();

  // RNG
  const rMin = document.getElementById('rng-min'), rMax = document.getElementById('rng-max'), rBtn = document.getElementById('rng-generate-btn'), rRes = document.getElementById('rng-res');
  if (rBtn) rBtn.addEventListener('click', () => {
    const min = parseInt(rMin.value)||0, max = parseInt(rMax.value)||100;
    rRes.textContent = Math.floor(Math.random()*(max-min+1))+min;
  });

  // Mortgage
  const mp = document.getElementById('mort-price'), md = document.getElementById('mort-down'), mr = document.getElementById('mort-rate'), my = document.getElementById('mort-years'), mEmi = document.getElementById('mort-emi');
  function calcMort() {
    if (!mp) return;
    const P = (parseFloat(mp.value)||0) - (parseFloat(md.value)||0);
    const r = (parseFloat(mr.value)||0)/12/100, n = (parseFloat(my.value)||0)*12;
    if (P > 0 && r > 0 && n > 0) {
      const emi = (P * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1);
      mEmi.textContent = `$${emi.toFixed(2)}`;
    }
  }
  [mp, md, mr, my].forEach(el => el && el.addEventListener('input', calcMort)); calcMort();

  // Compound Interest
  const cip = document.getElementById('ci-principal'), cir = document.getElementById('ci-rate'), ciy = document.getElementById('ci-years'), ciFut = document.getElementById('ci-future'), ciInt = document.getElementById('ci-interest');
  function calcCI() {
    if (!cip) return;
    const P = parseFloat(cip.value)||0, r = (parseFloat(cir.value)||0)/100, t = parseFloat(ciy.value)||0;
    const A = P * Math.pow(1 + r, t);
    ciFut.textContent = `$${A.toFixed(2)}`;
    ciInt.textContent = `$${(A-P).toFixed(2)}`;
  }
  [cip, cir, ciy].forEach(el => el && el.addEventListener('input', calcCI)); calcCI();

  // Simple Interest
  const sip = document.getElementById('si-principal'), sir = document.getElementById('si-rate'), siy = document.getElementById('si-years'), siRes = document.getElementById('si-res');
  function calcSI() { if (sip) siRes.textContent = `$${(((parseFloat(sip.value)||0)*(parseFloat(sir.value)||0)*(parseFloat(siy.value)||0))/100).toFixed(2)}`; }
  [sip, sir, siy].forEach(el => el && el.addEventListener('input', calcSI)); calcSI();

  // Savings
  const sm = document.getElementById('sav-monthly'), sr = document.getElementById('sav-rate'), sy = document.getElementById('sav-years'), sTot = document.getElementById('sav-total');
  function calcSav() {
    if (!sm) return;
    const PMT = parseFloat(sm.value)||0, r = (parseFloat(sr.value)||0)/12/100, n = (parseFloat(sy.value)||0)*12;
    const FV = PMT * ((Math.pow(1+r, n) - 1) / r);
    sTot.textContent = `$${FV.toFixed(2)}`;
  }
  [sm, sr, sy].forEach(el => el && el.addEventListener('input', calcSav)); calcSav();

  // Investment CAGR
  const ii = document.getElementById('inv-init'), ifin = document.getElementById('inv-final'), iy = document.getElementById('inv-years'), icagr = document.getElementById('inv-cagr');
  function calcCAGR() {
    if (!ii) return;
    const start = parseFloat(ii.value)||1, end = parseFloat(ifin.value)||1, t = parseFloat(iy.value)||1;
    const cagr = (Math.pow(end/start, 1/t) - 1) * 100;
    icagr.textContent = `${cagr.toFixed(2)}%`;
  }
  [ii, ifin, iy].forEach(el => el && el.addEventListener('input', calcCAGR)); calcCAGR();

  // Inflation
  const infA = document.getElementById('inf-amount'), infR = document.getElementById('inf-rate'), infY = document.getElementById('inf-years'), infRes = document.getElementById('inf-res');
  function calcInf() {
    if (!infA) return;
    const P = parseFloat(infA.value)||0, r = (parseFloat(infR.value)||0)/100, t = parseFloat(infY.value)||0;
    infRes.textContent = `$${(P * Math.pow(1+r, t)).toFixed(2)}`;
  }
  [infA, infR, infY].forEach(el => el && el.addEventListener('input', calcInf)); calcInf();

  // Unit Converter Setup
  const uCat = document.getElementById('unit-category'), uFrom = document.getElementById('unit-from'), uTo = document.getElementById('unit-to'), uVal = document.getElementById('unit-val'), uRes = document.getElementById('unit-result');
  function popUnits() {
    if (!uCat) return;
    const cat = uCat.value, keys = Object.keys(UNIT_DATA[cat].labels);
    uFrom.innerHTML = keys.map(k=>`<option value="${k}">${UNIT_DATA[cat].labels[k]}</option>`).join('');
    uTo.innerHTML = keys.map(k=>`<option value="${k}">${UNIT_DATA[cat].labels[k]}</option>`).join('');
    if (keys.length > 1) uTo.selectedIndex = 1;
    calcUnit();
  }
  function calcUnit() {
    if (!uVal) return;
    const cat = uCat.value, val = parseFloat(uVal.value)||0, from = uFrom.value, to = uTo.value;
    let res = (val * UNIT_DATA[cat].units[from]) / UNIT_DATA[cat].units[to];
    uRes.textContent = `${Number(res.toFixed(6))} ${to}`;
  }
  if (uCat) { uCat.addEventListener('change', popUnits); uFrom.addEventListener('change', calcUnit); uTo.addEventListener('change', calcUnit); uVal.addEventListener('input', calcUnit); popUnits(); }

  // Currency Converter Setup
  const currAmt = document.getElementById('curr-amount'), currF = document.getElementById('curr-from'), currT = document.getElementById('curr-to'), currRes = document.getElementById('curr-result');
  let rates = { USD: 1, EUR: 0.92, GBP: 0.78, INR: 83.2, PKR: 278.5, CAD: 1.36 };
  async function fetchCurr() {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data && data.rates) rates = data.rates;
    } catch {}
    if (currF) {
      const keys = Object.keys(rates).sort();
      currF.innerHTML = keys.map(k=>`<option value="${k}">${k}</option>`).join('');
      currT.innerHTML = keys.map(k=>`<option value="${k}">${k}</option>`).join('');
      currF.value = 'USD'; currT.value = 'EUR';
      calcCurr();
    }
  }
  function calcCurr() {
    if (!currAmt) return;
    const val = parseFloat(currAmt.value)||0, fromR = rates[currF.value]||1, toR = rates[currT.value]||1;
    currRes.textContent = `${((val/fromR)*toR).toFixed(2)} ${currT.value}`;
  }
  if (currAmt) { currAmt.addEventListener('input', calcCurr); currF.addEventListener('change', calcCurr); currT.addEventListener('change', calcCurr); fetchCurr(); }

  updateCalcDisplay();
});
