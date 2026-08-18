import { TemplateProject } from '../types';

export const STARTER_TEMPLATES: TemplateProject[] = [
  {
    id: 'cyber-dashboard',
    title: 'Neon Cyberpunk HUD & Game',
    description: 'Interactive canvas particle system, live counter, and audio-style visualizer.',
    tag: 'Canvas & JS',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cyber Pulse - Online HUD</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090d16;
      color: #e2e8f0;
      font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow-x: hidden;
    }
    .hud-card {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid #00f2fe;
      border-radius: 16px;
      padding: 32px;
      max-width: 650px;
      width: 100%;
      box-shadow: 0 0 35px rgba(0, 242, 254, 0.15);
      position: relative;
    }
    h1 {
      font-size: 26px;
      margin-bottom: 8px;
      color: #00f2fe;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .badge {
      background: #00f2fe22;
      color: #00f2fe;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 9999px;
      border: 1px solid #00f2fe44;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    canvas {
      width: 100%;
      height: 160px;
      background: #030712;
      border-radius: 8px;
      border: 1px solid #1e293b;
      margin-bottom: 20px;
      display: block;
    }
    .controls {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }
    button {
      background: #0ea5e9;
      color: #fff;
      border: none;
      padding: 12px 18px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    button:hover {
      background: #38bdf8;
      transform: translateY(-1px);
    }
    button.secondary {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
    }
    button.secondary:hover {
      background: #334155;
      color: #fff;
    }
    .stats {
      margin-top: 18px;
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #64748b;
      padding-top: 14px;
      border-top: 1px solid #1e293b;
    }
    .stat-val {
      color: #38bdf8;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="hud-card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h1>⚡ Live Sandbox Node <span class="badge">ONLINE</span></h1>
    </div>
    <p>This HTML document is running directly in your live isolated environment. Interact with canvas physics, test console outputs, and inspect DOM performance.</p>
    
    <canvas id="particleCanvas"></canvas>
    
    <div class="controls">
      <button id="burstBtn">💥 Trigger Pulse</button>
      <button id="colorBtn" class="secondary">🎨 Shift Color</button>
      <button id="logBtn" class="secondary">📋 Log Telemetry</button>
    </div>

    <div class="stats">
      <span>Active Particles: <span id="particleCount" class="stat-val">120</span></span>
      <span>Render FPS: <span id="fpsCount" class="stat-val">60</span></span>
      <span>Status: <span class="stat-val" style="color: #4ade80;">Active</span></span>
    </div>
  </div>

  <script>
    console.log('✨ Live Sandbox loaded successfully at ' + new Date().toLocaleTimeString());
    
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    
    let dpr = window.devicePixelRatio || 1;
    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    let colors = ['#00f2fe', '#4facfe', '#38bdf8', '#818cf8', '#c084fc'];
    let currentColor = colors[0];
    let particles = [];

    class Particle {
      constructor(x, y, speed) {
        this.x = x || Math.random() * (canvas.width / dpr);
        this.y = y || Math.random() * (canvas.height / dpr);
        this.vx = (Math.random() - 0.5) * (speed || 2);
        this.vy = (Math.random() - 0.5) * (speed || 2);
        this.radius = Math.random() * 3 + 1.5;
        this.alpha = Math.random() * 0.7 + 0.3;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width / dpr) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height / dpr) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = currentColor;
        ctx.globalAlpha = this.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }

    for (let i = 0; i < 70; i++) {
      particles.push(new Particle());
    }

    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 60;

    function animate(time) {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      
      // Connect nearby particles with lines
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 65) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = currentColor;
            ctx.globalAlpha = (1 - dist / 65) * 0.3;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }
        }
      }

      frameCount++;
      if (time - lastTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = time;
        document.getElementById('fpsCount').textContent = fps;
      }

      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    document.getElementById('burstBtn').addEventListener('click', () => {
      console.log('💥 Triggering particle burst...');
      for (let i = 0; i < 25; i++) {
        particles.push(new Particle(canvas.width / (2 * dpr), canvas.height / (2 * dpr), 6));
      }
      document.getElementById('particleCount').textContent = particles.length;
    });

    document.getElementById('colorBtn').addEventListener('click', () => {
      const nextColor = colors[(colors.indexOf(currentColor) + 1) % colors.length];
      currentColor = nextColor;
      console.info('🎨 Changed particle color palette to ' + nextColor);
    });

    document.getElementById('logBtn').addEventListener('click', () => {
      console.log({
        event: 'telemetry_ping',
        status: 'ok',
        particleCount: particles.length,
        timestamp: new Date().toISOString()
      });
    });
  </script>
</body>
</html>`
  },
  {
    id: 'interactive-calculator',
    title: 'Modern Glassmorphic Calculator',
    description: 'A fully functional, responsive calculator with keyboard support and history log.',
    tag: 'Web App',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Web Calculator</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body {
      background: radial-gradient(circle at 50% 20%, #1e1b4b, #0f172a);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
      color: #fff;
    }
    .calc-container {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 24px;
      width: 100%;
      max-width: 360px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .display {
      background: rgba(15, 23, 42, 0.6);
      border-radius: 16px;
      padding: 16px 20px;
      margin-bottom: 20px;
      text-align: right;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .history {
      font-size: 13px;
      color: #94a3b8;
      min-height: 18px;
      margin-bottom: 4px;
      word-break: break-all;
    }
    .current {
      font-size: 32px;
      font-weight: 700;
      color: #f8fafc;
      overflow-x: auto;
    }
    .keypad {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    button {
      background: rgba(51, 65, 85, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.05);
      color: #f1f5f9;
      font-size: 18px;
      font-weight: 600;
      padding: 16px;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    button:hover {
      background: rgba(71, 85, 105, 0.8);
      transform: translateY(-2px);
    }
    button:active {
      transform: translateY(0);
    }
    button.op {
      background: rgba(99, 102, 241, 0.25);
      color: #818cf8;
      border-color: rgba(99, 102, 241, 0.3);
    }
    button.op:hover {
      background: rgba(99, 102, 241, 0.4);
      color: #a5b4fc;
    }
    button.equal {
      background: #6366f1;
      color: #ffffff;
      grid-column: span 2;
    }
    button.equal:hover {
      background: #4f46e5;
    }
    button.clear {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }
  </style>
</head>
<body>
  <div class="calc-container">
    <div class="display">
      <div id="history" class="history"></div>
      <div id="current" class="current">0</div>
    </div>
    <div class="keypad">
      <button class="clear" onclick="clearAll()">C</button>
      <button class="op" onclick="deleteLast()">⌫</button>
      <button class="op" onclick="inputOp('%')">%</button>
      <button class="op" onclick="inputOp('/')">÷</button>
      
      <button onclick="inputNum('7')">7</button>
      <button onclick="inputNum('8')">8</button>
      <button onclick="inputNum('9')">9</button>
      <button class="op" onclick="inputOp('*')">×</button>
      
      <button onclick="inputNum('4')">4</button>
      <button onclick="inputNum('5')">5</button>
      <button onclick="inputNum('6')">6</button>
      <button class="op" onclick="inputOp('-')">−</button>
      
      <button onclick="inputNum('1')">1</button>
      <button onclick="inputNum('2')">2</button>
      <button onclick="inputNum('3')">3</button>
      <button class="op" onclick="inputOp('+')">+</button>
      
      <button onclick="inputNum('0')">0</button>
      <button onclick="inputNum('.')">.</button>
      <button class="equal" onclick="calculate()">=</button>
    </div>
  </div>

  <script>
    let currentInput = '0';
    let previousInput = '';
    let operation = null;
    let shouldResetCurrent = false;

    const currentEl = document.getElementById('current');
    const historyEl = document.getElementById('history');

    function updateDisplay() {
      currentEl.textContent = currentInput;
      if (operation) {
        historyEl.textContent = previousInput + ' ' + (operation === '*' ? '×' : operation === '/' ? '÷' : operation);
      } else {
        historyEl.textContent = '';
      }
    }

    function inputNum(num) {
      if (currentInput === '0' || shouldResetCurrent) {
        currentInput = num;
        shouldResetCurrent = false;
      } else {
        if (num === '.' && currentInput.includes('.')) return;
        currentInput += num;
      }
      updateDisplay();
    }

    function inputOp(op) {
      if (operation && !shouldResetCurrent) {
        calculate();
      }
      previousInput = currentInput;
      operation = op;
      shouldResetCurrent = true;
      updateDisplay();
    }

    function calculate() {
      if (!operation || shouldResetCurrent) return;
      let result;
      const prev = parseFloat(previousInput);
      const curr = parseFloat(currentInput);
      
      switch (operation) {
        case '+': result = prev + curr; break;
        case '-': result = prev - curr; break;
        case '*': result = prev * curr; break;
        case '/': result = curr === 0 ? 'Error' : prev / curr; break;
        case '%': result = prev % curr; break;
        default: return;
      }

      console.log(\`Calculation: \${prev} \${operation} \${curr} = \${result}\`);
      historyEl.textContent = \`\${prev} \${operation} \${curr} =\`;
      currentInput = String(result);
      operation = null;
      shouldResetCurrent = true;
      currentEl.textContent = currentInput;
    }

    function clearAll() {
      currentInput = '0';
      previousInput = '';
      operation = null;
      updateDisplay();
    }

    function deleteLast() {
      if (shouldResetCurrent) return;
      currentInput = currentInput.slice(0, -1) || '0';
      updateDisplay();
    }
  </script>
</body>
</html>`
  },
  {
    id: 'kanban-task-board',
    title: 'Local Drag & Drop Task Board',
    description: 'Clean productivity organizer with drag-and-drop cards and status filters.',
    tag: 'Productivity',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agile Sprint Board</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; }
    body {
      background: #f8fafc;
      color: #1e293b;
      min-height: 100vh;
      padding: 24px;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    h1 { font-size: 22px; font-weight: 700; color: #0f172a; }
    .add-form {
      display: flex;
      gap: 8px;
    }
    input {
      padding: 8px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }
    button {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .board {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }
    .column {
      background: #f1f5f9;
      border-radius: 12px;
      padding: 16px;
      min-height: 400px;
    }
    .col-header {
      font-weight: 700;
      font-size: 14px;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
    }
    .card {
      background: white;
      padding: 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin-bottom: 10px;
      cursor: grab;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: all 0.2s;
    }
    .card:hover {
      box-shadow: 0 4px 6px rgba(0,0,0,0.08);
      transform: translateY(-2px);
    }
    .card.dragging {
      opacity: 0.5;
    }
    .tag {
      display: inline-block;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      background: #e0e7ff;
      color: #4338ca;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <header>
    <h1>📋 Project Sprint Planner</h1>
    <div class="add-form">
      <input type="text" id="taskInput" placeholder="Enter task title...">
      <button onclick="addTask()">+ Add Task</button>
    </div>
  </header>

  <div class="board">
    <div class="column" ondragover="allowDrop(event)" ondrop="drop(event, 'todo')">
      <div class="col-header">
        <span>To Do</span>
        <span id="count-todo">0</span>
      </div>
      <div id="col-todo"></div>
    </div>

    <div class="column" ondragover="allowDrop(event)" ondrop="drop(event, 'in-progress')">
      <div class="col-header">
        <span>In Progress</span>
        <span id="count-in-progress">0</span>
      </div>
      <div id="col-in-progress"></div>
    </div>

    <div class="column" ondragover="allowDrop(event)" ondrop="drop(event, 'done')">
      <div class="col-header">
        <span>Done</span>
        <span id="count-done">0</span>
      </div>
      <div id="col-done"></div>
    </div>
  </div>

  <script>
    let tasks = [
      { id: '1', title: 'Connect HTML parser to live runtime', status: 'done', tag: 'Core' },
      { id: '2', title: 'Support drag & drop file uploads', status: 'in-progress', tag: 'Feature' },
      { id: '3', title: 'Export bundle to Google Drive', status: 'todo', tag: 'Drive' }
    ];

    function renderTasks() {
      ['todo', 'in-progress', 'done'].forEach(col => {
        const container = document.getElementById('col-' + col);
        container.innerHTML = '';
        const colTasks = tasks.filter(t => t.status === col);
        document.getElementById('count-' + col).textContent = colTasks.length;
        
        colTasks.forEach(task => {
          const el = document.createElement('div');
          el.className = 'card';
          el.draggable = true;
          el.id = 'task-' + task.id;
          el.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            el.classList.add('dragging');
          };
          el.ondragend = () => el.classList.remove('dragging');
          el.innerHTML = \`
            <div style="font-weight: 600; font-size: 14px;">\${task.title}</div>
            <span class="tag">\${task.tag}</span>
          \`;
          container.appendChild(el);
        });
      });
    }

    function addTask() {
      const input = document.getElementById('taskInput');
      const val = input.value.trim();
      if (!val) return;
      tasks.push({
        id: Date.now().toString(),
        title: val,
        status: 'todo',
        tag: 'User'
      });
      input.value = '';
      console.log('Added task:', val);
      renderTasks();
    }

    function allowDrop(e) {
      e.preventDefault();
    }

    function drop(e, status) {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      const task = tasks.find(t => t.id === id);
      if (task) {
        task.status = status;
        console.log(\`Moved task "\${task.title}" to \${status}\`);
        renderTasks();
      }
    }

    renderTasks();
  </script>
</body>
</html>`
  }
];
