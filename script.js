// ==========================================
// CalcX Pro - SaaS Multi-Calculator Engine
// ==========================================

// --- Toast Notification Engine ---
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
    if (this.isEvaluated) {
      this.currentInput = digit === '.' ? '0.' : digit;
      this.expression = '';
      this.isEvaluated = false;
      return;
    }
    if (digit === '.') {
      const parts = this.currentInput.split(/[\+\-\*\/\%]/);
      const lastPart = parts[parts.length - 1];
      if (lastPart.includes('.')) return;
      if (this.currentInput === '' || this.currentInput === '0') { this.currentInput = '0.'; return; }
    }
    if (this.currentInput === '0' && digit !== '.') this.currentInput = digit;
    else this.currentInput += digit;
  }

  appendOperator(op) {
    if (this.isEvaluated) {
      this.expression = this.currentInput + ' ' + op + ' ';
      this.currentInput = '';
      this.isEvaluated = false;
      return;
    }
    if (this.currentInput === '' && this.expression !== '') {
      this.expression = this.expression.trimEnd().slice(0, -1) + op + ' ';
      return;
    }
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
      case 'fact': res = this.factorial(val); break;
      case 'inv': res = val !== 0 ? 1 / val : 'Error'; break;
      case 'abs': res = Math.abs(val); break;
      case 'pi': this.currentInput = Math.PI.toString(); return;
      case 'e': this.currentInput = Math.E.toString(); return;
      case 'pow': this.appendOperator('^'); return;
      case 'open-paren': this.currentInput += '('; return;
      case 'close-paren': this.currentInput += ')'; return;
    }
    if (typeof res === 'number') res = Number(res.toFixed(10));
    this.currentInput = res.toString();
    this.isEvaluated = true;
  }

  factorial(n) {
    if (n < 0) return 'Error';
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= Math.min(n, 170); i++) result *= i;
    return result;
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
      this.currentInput = this.currentInput.startsWith('-')
        ? this.currentInput.slice(1)
        : '-' + this.currentInput;
    }
  }

  clearAll() { this.expression = ''; this.currentInput = '0'; this.isEvaluated = false; }

  evaluate() {
    let fullExpr = this.expression + (this.currentInput || '');
    if (!fullExpr.trim()) return;
    try {
      let evalExpr = fullExpr
        .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\^/g, '**');
      if (/[^0-9\+\-\*\/\%\.\(\)\s\*\*]/.test(evalExpr)) throw new Error('Invalid Input');
      let result = eval(evalExpr);
      if (typeof result === 'number' && !isNaN(result)) {
        result = Number(result.toFixed(10));
        this.history.unshift({ expr: fullExpr, result: result.toString() });
        if (this.history.length > 30) this.history.pop();
        localStorage.setItem('calc_history', JSON.stringify(this.history));
        this.expression = fullExpr + ' =';
        this.currentInput = result.toString();
        this.isEvaluated = true;
      } else {
        this.currentInput = 'Error';
        showToast('Invalid Math Operation', 'error');
      }
    } catch (e) {
      this.currentInput = 'Error';
      showToast('Syntax Error in Expression', 'error');
    }
  }

  memoryClear() { this.memory = 0; showToast('Memory Cleared'); }
  memoryRead() { this.currentInput = this.memory.toString(); this.isEvaluated = true; showToast(`Recalled ${this.memory}`); }
  memoryAdd() { this.memory += parseFloat(this.currentInput || 0); showToast(`Added to Memory (${this.memory})`); }
  memorySub() { this.memory -= parseFloat(this.currentInput || 0); showToast(`Subtracted from Memory (${this.memory})`); }
  memorySet() { this.memory = parseFloat(this.currentInput || 0); showToast(`Stored in Memory (${this.memory})`); }
}

// --- Unit Converter Data ---
const UNIT_DATA = {
  length: {
    units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 },
    labels: { m: 'Meter (m)', km: 'Kilometer (km)', cm: 'Centimeter (cm)', mm: 'Millimeter (mm)', mi: 'Mile (mi)', yd: 'Yard (yd)', ft: 'Foot (ft)', in: 'Inch (in)' }
  },
  weight: {
    units: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495, ton: 1000 },
    labels: { kg: 'Kilogram (kg)', g: 'Gram (g)', mg: 'Milligram (mg)', lb: 'Pound (lb)', oz: 'Ounce (oz)', ton: 'Metric Ton (t)' }
  },
  temperature: {
    units: { c: 'Celsius', f: 'Fahrenheit', k: 'Kelvin' },
    labels: { c: 'Celsius (°C)', f: 'Fahrenheit (°F)', k: 'Kelvin (K)' }
  },
  speed: {
    units: { 'm/s': 1, 'km/h': 0.277778, mph: 0.44704, knot: 0.514444 },
    labels: { 'm/s': 'Meters/sec (m/s)', 'km/h': 'Kilometers/hour (km/h)', mph: 'Miles/hour (mph)', knot: 'Knot (kn)' }
  },
  area: {
    units: { m2: 1, km2: 1000000, ft2: 0.092903, acre: 4046.86, hectare: 10000 },
    labels: { m2: 'Square Meter (m²)', km2: 'Square Km (km²)', ft2: 'Square Foot (ft²)', acre: 'Acre', hectare: 'Hectare' }
  }
};

// ==========================================
// Main DOM Controller
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const calc = new Calculator();

  // --- DOM References ---
  const exprDisplay    = document.getElementById('expression-display');
  const resultDisplay  = document.getElementById('result-display');
  const sciPanel       = document.getElementById('scientific-panel');
  const historyDrawer  = document.getElementById('history-drawer');
  const historyList    = document.getElementById('history-list');
  const memoryIndicator= document.getElementById('memory-indicator');
  const angleToggleBtn = document.getElementById('angle-unit-toggle');
  const themeToggleBtn = document.getElementById('toggle-theme-btn');
  const modeToggleBtn  = document.getElementById('toggle-mode-btn');
  const viewTitle      = document.getElementById('view-title');
  const sidebar        = document.getElementById('sidebar');
  const sidebarToggle  = document.getElementById('sidebar-toggle-btn');

  // --- Tool title map ---
  const titleMap = {
    calc:     'Standard & Scientific Calculator',
    unit:     'Unit Converter',
    currency: 'Currency Converter',
    bmi:      'BMI Calculator',
    age:      'Age Calculator',
    date:     'Date Difference',
    loan:     'Loan / EMI Calculator',
    tip:      'Tip Calculator',
    discount: 'Discount Calculator'
  };

  // --- Sidebar toggle (mobile) ---
  let sidebarOverlay = null;

  function createOverlay() {
    if (sidebarOverlay) return;
    sidebarOverlay = document.createElement('div');
    sidebarOverlay.classList.add('sidebar-overlay');
    document.body.appendChild(sidebarOverlay);
    sidebarOverlay.addEventListener('click', closeMobileSidebar);
  }

  function openMobileSidebar() {
    createOverlay();
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      if (sidebar.classList.contains('open')) closeMobileSidebar();
      else openMobileSidebar();
    });
  }

  // --- View Switching ---
  const navItems    = document.querySelectorAll('.nav-item');
  const subNavItems = document.querySelectorAll('.sub-nav-item');
  const toolViews   = document.querySelectorAll('.tool-view');

  function switchView(targetView, unitCategory = null) {
    navItems.forEach(n => n.classList.remove('active'));
    subNavItems.forEach(n => n.classList.remove('active'));
    toolViews.forEach(v => v.classList.remove('active'));

    const activeNav  = document.querySelector(`.nav-item[data-view="${targetView}"]`);
    const activeView = document.getElementById(`view-${targetView}`);

    if (activeNav && activeView) {
      activeNav.classList.add('active');
      activeView.classList.add('active');
      viewTitle.textContent = titleMap[targetView] || 'CalcX Pro';
      localStorage.setItem('calc_last_tool', targetView);

      if (targetView === 'unit' && unitCategory) {
        const subNav = document.querySelector(`.sub-nav-item[data-unit-cat="${unitCategory}"]`);
        if (subNav) subNav.classList.add('active');
        if (unitCategorySelect) {
          unitCategorySelect.value = unitCategory;
          populateUnitDropdowns();
        }
      }

      // Show/hide SCI & History buttons (only relevant for calculator)
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
      closeMobileSidebar(); // close on mobile after pick
    });
  });

  subNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetView = item.getAttribute('data-view');
      const unitCat    = item.getAttribute('data-unit-cat');
      switchView(targetView, unitCat);
      closeMobileSidebar();
    });
  });

  // Restore last selected tool
  switchView(localStorage.getItem('calc_last_tool') || 'calc');

  // --- Calculator Display ---
  function updateCalcDisplay() {
    exprDisplay.textContent = calc.expression;
    resultDisplay.textContent = calc.currentInput || '0';
    if (calc.memory !== 0) memoryIndicator.classList.remove('hidden');
    else memoryIndicator.classList.add('hidden');
    if (calc.currentInput.length > 12) resultDisplay.style.fontSize = '1.75rem';
    else if (calc.currentInput.length > 8) resultDisplay.style.fontSize = '2.1rem';
    else resultDisplay.style.fontSize = '2.5rem';
  }

  function renderHistory() {
    if (calc.history.length === 0) {
      historyList.innerHTML = '<div class="empty-history">No history recorded yet</div>';
      return;
    }
    historyList.innerHTML = calc.history.map(item => `
      <div class="history-item" data-res="${item.result}">
        <span class="history-expr">${item.expr}</span>
        <span class="history-res">${item.result}</span>
      </div>
    `).join('');
    document.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        calc.currentInput = item.getAttribute('data-res');
        calc.isEvaluated = true;
        updateCalcDisplay();
        historyDrawer.classList.add('hidden');
      });
    });
  }

  // Keypad listener
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
    else if (action && ['sin','cos','tan','log','ln','sqrt','sqr','pow','pi','e','fact','inv','abs','open-paren','close-paren'].includes(action)) calc.appendFunction(action);
    else if (action === 'mc') calc.memoryClear();
    else if (action === 'mr') calc.memoryRead();
    else if (action === 'm-add') calc.memoryAdd();
    else if (action === 'm-sub') calc.memorySub();
    else if (action === 'ms') calc.memorySet();
    updateCalcDisplay();
  });

  modeToggleBtn.addEventListener('click', () => sciPanel.classList.toggle('hidden'));

  document.getElementById('toggle-history-btn').addEventListener('click', () => {
    renderHistory();
    historyDrawer.classList.remove('hidden');
  });
  document.getElementById('close-history-btn').addEventListener('click', () => historyDrawer.classList.add('hidden'));
  document.getElementById('clear-history-btn').addEventListener('click', () => {
    calc.history = [];
    localStorage.removeItem('calc_history');
    renderHistory();
    showToast('Calculation History Cleared');
  });

  themeToggleBtn.addEventListener('click', () => {
    const newTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    themeToggleBtn.querySelector('.theme-icon').textContent = newTheme === 'dark' ? '🌙' : '☀️';
    showToast(`Switched to ${newTheme.toUpperCase()} theme`);
  });

  angleToggleBtn.addEventListener('click', () => {
    calc.isAngleDeg = !calc.isAngleDeg;
    angleToggleBtn.textContent = calc.isAngleDeg ? 'DEG' : 'RAD';
    showToast(`Angle unit: ${calc.isAngleDeg ? 'Degrees' : 'Radians'}`);
  });

  // Keyboard support (when not typing in an input)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
    if (document.getElementById('view-calc').classList.contains('active')) {
      if (e.key >= '0' && e.key <= '9') calc.appendNumber(e.key);
      else if (e.key === '.') calc.appendNumber('.');
      else if (e.key === '+') calc.appendOperator('+');
      else if (e.key === '-') calc.appendOperator('-');
      else if (e.key === '*') calc.appendOperator('*');
      else if (e.key === '/') { e.preventDefault(); calc.appendOperator('/'); }
      else if (e.key === '%') calc.currentInput = (parseFloat(calc.currentInput || 0) / 100).toString();
      else if (e.key === 'Enter' || e.key === '=') calc.evaluate();
      else if (e.key === 'Backspace') calc.backspace();
      else if (e.key === 'Escape') calc.clearAll();
      else if (e.key === '(') calc.appendFunction('open-paren');
      else if (e.key === ')') calc.appendFunction('close-paren');
      updateCalcDisplay();
    }
  });

  // --- 1. Unit Converter ---
  const unitCategorySelect = document.getElementById('unit-category');
  const unitFromSelect = document.getElementById('unit-from');
  const unitToSelect   = document.getElementById('unit-to');
  const unitValInput   = document.getElementById('unit-val');
  const unitResultBox  = document.getElementById('unit-result');
  const unitSwapBtn    = document.getElementById('unit-swap-btn');

  function populateUnitDropdowns() {
    const cat = unitCategorySelect.value;
    const catData = UNIT_DATA[cat];
    const keys = Object.keys(catData.labels);
    unitFromSelect.innerHTML = keys.map(k => `<option value="${k}">${catData.labels[k]}</option>`).join('');
    unitToSelect.innerHTML   = keys.map(k => `<option value="${k}">${catData.labels[k]}</option>`).join('');
    if (keys.length > 1) unitToSelect.selectedIndex = 1;
    calculateUnit();
  }

  function calculateUnit() {
    const cat  = unitCategorySelect.value;
    const val  = parseFloat(unitValInput.value) || 0;
    const from = unitFromSelect.value;
    const to   = unitToSelect.value;
    let res = 0;
    if (cat === 'temperature') {
      if (from === to) res = val;
      else if (from === 'c' && to === 'f') res = (val * 9/5) + 32;
      else if (from === 'c' && to === 'k') res = val + 273.15;
      else if (from === 'f' && to === 'c') res = (val - 32) * 5/9;
      else if (from === 'f' && to === 'k') res = (val - 32) * 5/9 + 273.15;
      else if (from === 'k' && to === 'c') res = val - 273.15;
      else if (from === 'k' && to === 'f') res = (val - 273.15) * 9/5 + 32;
    } else {
      res = (val * UNIT_DATA[cat].units[from]) / UNIT_DATA[cat].units[to];
    }
    unitResultBox.textContent = `${Number(res.toFixed(6))} ${to}`;
  }

  unitCategorySelect.addEventListener('change', populateUnitDropdowns);
  unitFromSelect.addEventListener('change', calculateUnit);
  unitToSelect.addEventListener('change', calculateUnit);
  unitValInput.addEventListener('input', calculateUnit);
  unitSwapBtn.addEventListener('click', () => {
    [unitFromSelect.value, unitToSelect.value] = [unitToSelect.value, unitFromSelect.value];
    calculateUnit();
  });
  populateUnitDropdowns();

  // --- 2. Currency Converter ---
  const currAmount = document.getElementById('curr-amount');
  const currFrom   = document.getElementById('curr-from');
  const currTo     = document.getElementById('curr-to');
  const currResult = document.getElementById('curr-result');
  const currStatus = document.getElementById('curr-status');
  const currSwapBtn= document.getElementById('curr-swap-btn');

  let exchangeRates = { USD: 1, EUR: 0.92, GBP: 0.78, INR: 83.2, PKR: 278.5, CAD: 1.36, AUD: 1.52, JPY: 155.4, AED: 3.67, SAR: 3.75 };

  async function fetchRates() {
    try {
      const res  = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data && data.rates) {
        exchangeRates = data.rates;
        currStatus.textContent = `1 USD = ${data.rates['EUR']} EUR | Updated UTC`;
        showToast('Live Exchange Rates Loaded', 'success');
      }
    } catch {
      currStatus.textContent = 'Using cached offline exchange rates';
      showToast('Offline exchange rates loaded', 'info');
    }
    populateCurrencyDropdowns();
  }

  function populateCurrencyDropdowns() {
    const currencies = Object.keys(exchangeRates).sort();
    currFrom.innerHTML = currencies.map(c => `<option value="${c}">${c}</option>`).join('');
    currTo.innerHTML   = currencies.map(c => `<option value="${c}">${c}</option>`).join('');
    currFrom.value = 'USD';
    currTo.value   = 'PKR';
    calculateCurrency();
  }

  function calculateCurrency() {
    const amt      = parseFloat(currAmount.value) || 0;
    const fromRate = exchangeRates[currFrom.value] || 1;
    const toRate   = exchangeRates[currTo.value]   || 1;
    const res = (amt / fromRate) * toRate;
    currResult.textContent = `${res.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currTo.value}`;
  }

  currAmount.addEventListener('input', calculateCurrency);
  currFrom.addEventListener('change', calculateCurrency);
  currTo.addEventListener('change', calculateCurrency);
  currSwapBtn.addEventListener('click', () => {
    [currFrom.value, currTo.value] = [currTo.value, currFrom.value];
    calculateCurrency();
  });
  fetchRates();

  // --- 3. BMI Calculator ---
  const bmiUnitMetric    = document.getElementById('bmi-unit-metric');
  const bmiUnitImperial  = document.getElementById('bmi-unit-imperial');
  const bmiMetricInputs  = document.getElementById('bmi-metric-inputs');
  const bmiImperialInputs= document.getElementById('bmi-imperial-inputs');
  const bmiHeightCm = document.getElementById('bmi-height-cm');
  const bmiWeightKg = document.getElementById('bmi-weight-kg');
  const bmiHeightFt = document.getElementById('bmi-height-ft');
  const bmiHeightIn = document.getElementById('bmi-height-in');
  const bmiWeightLb = document.getElementById('bmi-weight-lb');
  const bmiScore    = document.getElementById('bmi-score');
  const bmiCategory = document.getElementById('bmi-category');
  const bmiHealthyRange = document.getElementById('bmi-healthy-range');
  let isMetric = true;

  bmiUnitMetric.addEventListener('click', () => {
    isMetric = true;
    bmiUnitMetric.classList.add('active'); bmiUnitImperial.classList.remove('active');
    bmiMetricInputs.classList.remove('hidden'); bmiImperialInputs.classList.add('hidden');
    calculateBMI();
  });
  bmiUnitImperial.addEventListener('click', () => {
    isMetric = false;
    bmiUnitImperial.classList.add('active'); bmiUnitMetric.classList.remove('active');
    bmiImperialInputs.classList.remove('hidden'); bmiMetricInputs.classList.add('hidden');
    calculateBMI();
  });

  function calculateBMI() {
    let hMeters = 0, wKg = 0;
    if (isMetric) {
      hMeters = (parseFloat(bmiHeightCm.value) || 0) / 100;
      wKg = parseFloat(bmiWeightKg.value) || 0;
    } else {
      const totalInches = ((parseFloat(bmiHeightFt.value) || 0) * 12) + (parseFloat(bmiHeightIn.value) || 0);
      hMeters = totalInches * 0.0254;
      wKg = (parseFloat(bmiWeightLb.value) || 0) * 0.453592;
    }
    if (hMeters > 0 && wKg > 0) {
      const bmi = wKg / (hMeters * hMeters);
      bmiScore.textContent = bmi.toFixed(1);
      bmiHealthyRange.textContent = `Healthy Weight Range: ${(18.5*(hMeters*hMeters)).toFixed(1)} kg – ${(24.9*(hMeters*hMeters)).toFixed(1)} kg`;
      if (bmi < 18.5) { bmiCategory.textContent = 'Underweight'; bmiCategory.style.background = 'rgba(56,189,248,0.2)'; bmiCategory.style.color = '#38bdf8'; }
      else if (bmi < 25) { bmiCategory.textContent = 'Normal Weight'; bmiCategory.style.background = 'rgba(52,211,153,0.2)'; bmiCategory.style.color = '#34d399'; }
      else if (bmi < 30) { bmiCategory.textContent = 'Overweight'; bmiCategory.style.background = 'rgba(251,191,36,0.2)'; bmiCategory.style.color = '#fbbf24'; }
      else { bmiCategory.textContent = 'Obese'; bmiCategory.style.background = 'rgba(248,113,113,0.2)'; bmiCategory.style.color = '#f87171'; }
    } else { bmiScore.textContent = '--'; bmiCategory.textContent = 'Invalid Input'; }
  }
  [bmiHeightCm, bmiWeightKg, bmiHeightFt, bmiHeightIn, bmiWeightLb].forEach(i => i.addEventListener('input', calculateBMI));
  calculateBMI();

  // --- 4. Age Calculator ---
  const ageDob      = document.getElementById('age-dob');
  const agePrimary  = document.getElementById('age-primary');
  const ageMonths   = document.getElementById('age-months');
  const ageWeeks    = document.getElementById('age-weeks');
  const ageDays     = document.getElementById('age-days');
  const ageNextBday = document.getElementById('age-next-bday');
  ageDob.value = '2000-01-01';

  function calculateAge() {
    if (!ageDob.value) return;
    const birth = new Date(ageDob.value + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    if (birth > today) { agePrimary.textContent = 'DOB cannot be in future'; showToast('Date of birth cannot be in the future', 'error'); return; }
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();
    if (days < 0) { months--; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    agePrimary.textContent = `${years} Years, ${months} Months, ${days} Days`;
    const totalTime  = today - birth;
    const totalDays  = Math.floor(totalTime / 86400000);
    ageMonths.textContent = ((years*12)+months).toLocaleString();
    ageWeeks.textContent  = Math.floor(totalDays/7).toLocaleString();
    ageDays.textContent   = totalDays.toLocaleString();
    let nextBday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBday < today) nextBday.setFullYear(today.getFullYear()+1);
    const bdayDiff = Math.ceil((nextBday - today) / 86400000);
    ageNextBday.innerHTML = `🎉 Next Birthday in: <span>${Math.floor(bdayDiff/30.4375)} Months, ${Math.round(bdayDiff%30.4375)} Days</span> (${bdayDiff} Days)`;
  }
  ageDob.addEventListener('change', calculateAge);
  calculateAge();

  // --- 5. Date Difference ---
  const dateStart  = document.getElementById('date-start');
  const dateEnd    = document.getElementById('date-end');
  const datePrimary= document.getElementById('date-primary');
  const dateYears  = document.getElementById('date-years');
  const dateMonths = document.getElementById('date-months');
  const dateWeeks  = document.getElementById('date-weeks');
  const dateDays   = document.getElementById('date-days');
  const dateHours  = document.getElementById('date-hours');
  const dateMins   = document.getElementById('date-mins');
  const todayStr = new Date().toISOString().split('T')[0];
  dateStart.value = todayStr; dateEnd.value = todayStr;

  function calculateDateDiff() {
    if (!dateStart.value || !dateEnd.value) return;
    const d1 = new Date(dateStart.value + 'T00:00:00');
    const d2 = new Date(dateEnd.value   + 'T00:00:00');
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.floor(diffTime / 86400000);
    let start = d1 < d2 ? d1 : d2, end = d1 < d2 ? d2 : d1;
    let y = end.getFullYear() - start.getFullYear();
    let m = end.getMonth() - start.getMonth();
    if (m < 0) { y--; m += 12; }
    datePrimary.textContent = `${diffDays.toLocaleString()} Total Days Difference`;
    dateYears.textContent  = y;
    dateMonths.textContent = m;
    dateWeeks.textContent  = Math.floor(diffDays/7).toLocaleString();
    dateDays.textContent   = diffDays.toLocaleString();
    dateHours.textContent  = (diffDays*24).toLocaleString();
    dateMins.textContent   = (diffDays*1440).toLocaleString();
  }
  dateStart.addEventListener('change', calculateDateDiff);
  dateEnd.addEventListener('change', calculateDateDiff);
  calculateDateDiff();

  // --- 6. Loan / EMI ---
  const loanAmount = document.getElementById('loan-amount');
  const loanRate   = document.getElementById('loan-rate');
  const loanTenure = document.getElementById('loan-tenure');
  const loanEmi    = document.getElementById('loan-emi');
  const loanInterest= document.getElementById('loan-interest');
  const loanTotal  = document.getElementById('loan-total');

  function calculateLoan() {
    const P = parseFloat(loanAmount.value) || 0;
    const r = (parseFloat(loanRate.value) || 0) / 12 / 100;
    const n = (parseFloat(loanTenure.value) || 0) * 12;
    if (P > 0 && r > 0 && n > 0) {
      const emi = (P * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1);
      const total = emi * n;
      loanEmi.textContent      = `$${emi.toFixed(2)}`;
      loanInterest.textContent = `$${(total-P).toFixed(2)}`;
      loanTotal.textContent    = `$${total.toFixed(2)}`;
    }
  }
  loanAmount.addEventListener('input', calculateLoan);
  loanRate.addEventListener('input', calculateLoan);
  loanTenure.addEventListener('input', calculateLoan);
  calculateLoan();

  // --- 7. Tip Calculator ---
  const tipBill    = document.getElementById('tip-bill');
  const tipPercent = document.getElementById('tip-percent');
  const tipPeople  = document.getElementById('tip-people');
  const tipPerPerson   = document.getElementById('tip-per-person');
  const tipTotalAmount = document.getElementById('tip-total-amount');
  const tipTotalBill   = document.getElementById('tip-total-bill');

  function calculateTip() {
    const bill   = parseFloat(tipBill.value)    || 0;
    const pct    = parseFloat(tipPercent.value)  || 0;
    const people = parseInt(tipPeople.value)     || 1;
    const totalTip  = (bill * pct) / 100;
    const grandTotal = bill + totalTip;
    tipPerPerson.textContent   = `$${(grandTotal/people).toFixed(2)}`;
    tipTotalAmount.textContent = `$${totalTip.toFixed(2)}`;
    tipTotalBill.textContent   = `$${grandTotal.toFixed(2)}`;
  }
  tipBill.addEventListener('input', calculateTip);
  tipPercent.addEventListener('input', calculateTip);
  tipPeople.addEventListener('input', calculateTip);
  calculateTip();

  // --- 8. Discount Calculator ---
  const discPrice   = document.getElementById('disc-price');
  const discPercent = document.getElementById('disc-percent');
  const discFinal   = document.getElementById('disc-final');
  const discSaved   = document.getElementById('disc-saved');

  function calculateDiscount() {
    const price = parseFloat(discPrice.value)   || 0;
    const pct   = parseFloat(discPercent.value) || 0;
    const saved = (price * pct) / 100;
    discFinal.textContent = `$${(price-saved).toFixed(2)}`;
    discSaved.textContent = `$${saved.toFixed(2)}`;
  }
  discPrice.addEventListener('input', calculateDiscount);
  discPercent.addEventListener('input', calculateDiscount);
  calculateDiscount();

  // Initial render
  updateCalcDisplay();
});
