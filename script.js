// Calculator State Engine
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
      // Avoid multiple decimals in the current operand
      const parts = this.currentInput.split(/[\+\-\*\/\%]/);
      const lastPart = parts[parts.length - 1];
      if (lastPart.includes('.')) return;
      if (this.currentInput === '' || this.currentInput === '0') {
        this.currentInput = '0.';
        return;
      }
    }

    if (this.currentInput === '0' && digit !== '.') {
      this.currentInput = digit;
    } else {
      this.currentInput += digit;
    }
  }

  appendOperator(op) {
    if (this.isEvaluated) {
      this.expression = this.currentInput + ' ' + op + ' ';
      this.currentInput = '';
      this.isEvaluated = false;
      return;
    }

    if (this.currentInput === '' && this.expression !== '') {
      // Replace last operator if user presses another operator
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
      case 'sin':
        res = this.isAngleDeg ? Math.sin(val * Math.PI / 180) : Math.sin(val);
        break;
      case 'cos':
        res = this.isAngleDeg ? Math.cos(val * Math.PI / 180) : Math.cos(val);
        break;
      case 'tan':
        res = this.isAngleDeg ? Math.tan(val * Math.PI / 180) : Math.tan(val);
        break;
      case 'log':
        res = Math.log10(val);
        break;
      case 'ln':
        res = Math.log(val);
        break;
      case 'sqrt':
        res = Math.sqrt(val);
        break;
      case 'sqr':
        res = Math.pow(val, 2);
        break;
      case 'fact':
        res = this.factorial(val);
        break;
      case 'inv':
        res = val !== 0 ? 1 / val : 'Error';
        break;
      case 'abs':
        res = Math.abs(val);
        break;
      case 'pi':
        this.currentInput = Math.PI.toString();
        return;
      case 'e':
        this.currentInput = Math.E.toString();
        return;
      case 'pow':
        this.appendOperator('^');
        return;
      case 'open-paren':
        this.currentInput += '(';
        return;
      case 'close-paren':
        this.currentInput += ')';
        return;
    }

    if (typeof res === 'number') {
      // Round floating point inaccuracies
      res = Number(res.toFixed(10));
    }
    this.currentInput = res.toString();
    this.isEvaluated = true;
  }

  factorial(n) {
    if (n < 0) return 'Error';
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= Math.min(n, 170); i++) {
      result *= i;
    }
    return result;
  }

  backspace() {
    if (this.isEvaluated) {
      this.clearAll();
      return;
    }
    if (this.currentInput.length > 0) {
      this.currentInput = this.currentInput.slice(0, -1);
      if (this.currentInput === '' || this.currentInput === '-') {
        this.currentInput = '0';
      }
    }
  }

  toggleSign() {
    if (this.currentInput !== '0' && this.currentInput !== '') {
      if (this.currentInput.startsWith('-')) {
        this.currentInput = this.currentInput.slice(1);
      } else {
        this.currentInput = '-' + this.currentInput;
      }
    }
  }

  clearAll() {
    this.expression = '';
    this.currentInput = '0';
    this.isEvaluated = false;
  }

  evaluate() {
    let fullExpr = this.expression + (this.currentInput || '');
    if (!fullExpr.trim()) return;

    try {
      // Format expression for JS eval
      let evalExpr = fullExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/\^/g, '**');

      // Security check for allowed characters
      if (/[^0-9\+\-\*\/\%\.\(\)\s\*\*]/.test(evalExpr)) {
        throw new Error('Invalid Input');
      }

      let result = eval(evalExpr);

      if (typeof result === 'number' && !isNaN(result)) {
        result = Number(result.toFixed(10));
        
        // Push to history
        this.history.unshift({ expr: fullExpr, result: result.toString() });
        if (this.history.length > 30) this.history.pop();
        localStorage.setItem('calc_history', JSON.stringify(this.history));

        this.expression = fullExpr + ' =';
        this.currentInput = result.toString();
        this.isEvaluated = true;
      } else {
        this.currentInput = 'Error';
      }
    } catch (e) {
      this.currentInput = 'Error';
    }
  }

  // Memory functions
  memoryClear() { this.memory = 0; }
  memoryRead() { this.currentInput = this.memory.toString(); this.isEvaluated = true; }
  memoryAdd() { this.memory += parseFloat(this.currentInput || 0); }
  memorySub() { this.memory -= parseFloat(this.currentInput || 0); }
  memorySet() { this.memory = parseFloat(this.currentInput || 0); }
}

// UI Controller & Event Handlers
document.addEventListener('DOMContentLoaded', () => {
  const calc = new Calculator();

  // Elements
  const exprDisplay = document.getElementById('expression-display');
  const resultDisplay = document.getElementById('result-display');
  const sciPanel = document.getElementById('scientific-panel');
  const historyDrawer = document.getElementById('history-drawer');
  const historyList = document.getElementById('history-list');
  const memoryIndicator = document.getElementById('memory-indicator');
  const angleToggleBtn = document.getElementById('angle-unit-toggle');
  const themeToggleBtn = document.getElementById('toggle-theme-btn');
  const modeToggleBtn = document.getElementById('toggle-mode-btn');

  function updateDisplay() {
    exprDisplay.textContent = calc.expression;
    resultDisplay.textContent = calc.currentInput || '0';
    
    // Memory indicator
    if (calc.memory !== 0) {
      memoryIndicator.classList.remove('hidden');
    } else {
      memoryIndicator.classList.add('hidden');
    }

    // Adjust font size dynamically if input is long
    if (calc.currentInput.length > 12) {
      resultDisplay.style.fontSize = '1.75rem';
    } else if (calc.currentInput.length > 8) {
      resultDisplay.style.fontSize = '2.1rem';
    } else {
      resultDisplay.style.fontSize = '2.5rem';
    }
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
        updateDisplay();
        historyDrawer.classList.add('hidden');
      });
    });
  }

  // Keypad Click Delegation
  document.querySelector('.keypad-container').addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    const val = target.getAttribute('data-val');
    const action = target.getAttribute('data-action');

    if (val !== null && !action) {
      calc.appendNumber(val);
    } else if (action === 'operator') {
      calc.appendOperator(val);
    } else if (action === 'equals') {
      calc.evaluate();
    } else if (action === 'clear') {
      calc.clearAll();
    } else if (action === 'backspace') {
      calc.backspace();
    } else if (action === 'negate') {
      calc.toggleSign();
    } else if (action === 'percent') {
      calc.currentInput = (parseFloat(calc.currentInput || 0) / 100).toString();
      calc.isEvaluated = true;
    } else if (action && ['sin','cos','tan','log','ln','sqrt','sqr','pow','pi','e','fact','inv','abs','open-paren','close-paren'].includes(action)) {
      calc.appendFunction(action);
    } else if (action === 'mc') { calc.memoryClear(); }
    else if (action === 'mr') { calc.memoryRead(); }
    else if (action === 'm-add') { calc.memoryAdd(); }
    else if (action === 'm-sub') { calc.memorySub(); }
    else if (action === 'ms') { calc.memorySet(); }

    updateDisplay();
  });

  // Toggle Scientific Mode
  modeToggleBtn.addEventListener('click', () => {
    sciPanel.classList.toggle('hidden');
    modeToggleBtn.classList.toggle('active');
  });

  // Toggle History Drawer
  document.getElementById('toggle-history-btn').addEventListener('click', () => {
    renderHistory();
    historyDrawer.classList.remove('hidden');
  });

  document.getElementById('close-history-btn').addEventListener('click', () => {
    historyDrawer.classList.add('hidden');
  });

  document.getElementById('clear-history-btn').addEventListener('click', () => {
    calc.history = [];
    localStorage.removeItem('calc_history');
    renderHistory();
  });

  // Toggle Theme (Dark / Light)
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    themeToggleBtn.querySelector('.theme-icon').textContent = newTheme === 'dark' ? '🌙' : '☀️';
  });

  // DEG / RAD Toggle
  angleToggleBtn.addEventListener('click', () => {
    calc.isAngleDeg = !calc.isAngleDeg;
    angleToggleBtn.textContent = calc.isAngleDeg ? 'DEG' : 'RAD';
  });

  // Keyboard Support
  window.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') calc.appendNumber(e.key);
    else if (e.key === '.') calc.appendNumber('.');
    else if (e.key === '+') calc.appendOperator('+');
    else if (e.key === '-') calc.appendOperator('-');
    else if (e.key === '*') calc.appendOperator('*');
    else if (e.key === '/') calc.appendOperator('/');
    else if (e.key === '%') calc.currentInput = (parseFloat(calc.currentInput || 0) / 100).toString();
    else if (e.key === 'Enter' || e.key === '=') calc.evaluate();
    else if (e.key === 'Backspace') calc.backspace();
    else if (e.key === 'Escape') calc.clearAll();
    else if (e.key === '(') calc.appendFunction('open-paren');
    else if (e.key === ')') calc.appendFunction('close-paren');
    
    updateDisplay();
  });

  updateDisplay();
});
