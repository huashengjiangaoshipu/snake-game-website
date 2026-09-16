// 贪吃蛇主逻辑
(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const highEl = document.getElementById('highscore');
  const btnRestart = document.getElementById('btnRestart');
  const btnPause = document.getElementById('btnPause');

  // 游戏配置
  const GRID = 20; // 每行/列格子数
  const CELL = 20; // 每格像素大小（会根据 canvas 大小调整缩放）
  let scale = 1;

  // 状态
  let snake = [];
  let dir = {x:1,y:0};
  let nextDir = null;
  let food = null;
  let score = 0;
  let highscore = Number(localStorage.getItem('snake-high') || 0);
  let speed = 8; // 初始 fps
  let running = false;
  let lastTick = 0;
  let tickInterval = 1000 / speed;

  highEl.textContent = highscore;
  scoreEl.textContent = score;

  // 初始化尺寸
  function fitCanvas(){
    // 让 canvas 根据窗口调整，保证正方形
    const size = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.7, 600);
    canvas.width = size;
    canvas.height = size;
    scale = canvas.width / (GRID * CELL);
    draw();
  }
  window.addEventListener('resize', fitCanvas);
  fitCanvas();

  function reset(){
    snake = [ {x: Math.floor(GRID/2)-1, y: Math.floor(GRID/2)}, {x: Math.floor(GRID/2), y: Math.floor(GRID/2)} ];
    dir = {x:1,y:0};
    nextDir = null;
    score = 0;
    speed = 8;
    tickInterval = 1000 / speed;
    placeFood();
    running = true;
    btnPause.textContent = '暂停';
    scoreEl.textContent = score;
  }

  function placeFood(){
    while(true){
      const f = { x: Math.floor(Math.random()*GRID), y: Math.floor(Math.random()*GRID) };
      if(!snake.some(s=>s.x===f.x && s.y===f.y)){ food = f; break; }
    }
  }

  function update(){
    if(nextDir){
      // 防止反向
      if(!(nextDir.x === -dir.x && nextDir.y === -dir.y)) dir = nextDir;
      nextDir = null;
    }
    const head = { x: snake[snake.length-1].x + dir.x, y: snake[snake.length-1].y + dir.y };

    // 撞墙判定（到边界即游戏结束）
    if(head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID){
      gameOver();
      return;
    }

    // 撞到自己
    if(snake.some(s=>s.x===head.x && s.y===head.y)){
      gameOver();
      return;
    }

    snake.push(head);

    // 吃到食物
    if(head.x === food.x && head.y === food.y){
      score += Math.floor(1 + snake.length/5);
      scoreEl.textContent = score;
      placeFood();
      // 难度递增
      speed = 8 + Math.floor(snake.length / 3);
      tickInterval = 1000 / speed;
    } else {
      // 移除尾部
      snake.shift();
    }
  }

  function gameOver(){
    running = false;
    btnPause.textContent = '已暂停';
    if(score > highscore){
      highscore = score;
      localStorage.setItem('snake-high', highscore);
      highEl.textContent = highscore;
    }
    // 简单的提示
    setTimeout(()=>{
      if(confirm('游戏结束！得分: '+score+'。是否重新开始？')) reset();
    },50);
  }

  function draw(){
    // 背景
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // grid 背景可选
    // 绘制食物
    if(food){
      drawCell(food.x, food.y, '#ff4d6d');
      // small shine
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      const cx = (food.x + 0.2) * CELL * scale; const cy = (food.y+0.2) * CELL * scale;
      ctx.fillRect(cx, cy, CELL*0.6*scale, CELL*0.6*scale);
    }
    // ���制蛇
    for(let i=0;i<snake.length;i++){
      const s = snake[i];
      const isHead = (i === snake.length-1);
      drawCell(s.x, s.y, isHead ? '#8ef1a5' : '#22c55e');
    }
  }

  function drawCell(gx, gy, color){
    const x = gx * CELL * scale;
    const y = gy * CELL * scale;
    const w = CELL * scale;
    const h = CELL * scale;
    // 圆角方块
    ctx.fillStyle = color;
    roundRect(ctx, x+1, y+1, w-2, h-2, 4*scale, true, false);
  }

  // 帮助函数：圆角矩形
  function roundRect(ctx, x, y, w, h, r, fill, stroke){
    if (typeof r === 'undefined') r = 5;
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y,   x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x,   y+h, r);
    ctx.arcTo(x,   y+h, x,   y,   r);
    ctx.arcTo(x,   y,   x+w, y,   r);
    ctx.closePath();
    if(fill){ ctx.fill(); }
    if(stroke){ ctx.stroke(); }
  }

  // 主循环，使用 requestAnimationFrame 以便节流
  function loop(ts){
    if(!lastTick) lastTick = ts;
    const elapsed = ts - lastTick;
    if(running && elapsed >= tickInterval){
      update();
      draw();
      lastTick = ts;
    } else {
      // 仍然绘制以响应窗口缩放
      draw();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // 控制：键盘
  window.addEventListener('keydown', e => {
    const key = e.key;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(key)){
      e.preventDefault();
      if(key === 'ArrowUp' || key === 'w' || key === 'W') nextDir = {x:0,y:-1};
      if(key === 'ArrowDown' || key === 's' || key === 'S') nextDir = {x:0,y:1};
      if(key === 'ArrowLeft' || key === 'a' || key === 'A') nextDir = {x:-1,y:0};
      if(key === 'ArrowRight' || key === 'd' || key === 'D') nextDir = {x:1,y:0};
    }
    if(key === ' '){
      togglePause();
    }
  });

  // 控制：按钮
  btnRestart.addEventListener('click', () => { reset(); });
  btnPause.addEventListener('click', () => { togglePause(); });
  function togglePause(){
    running = !running;
    btnPause.textContent = running ? '暂停' : '继续';
  }

  // 触摸滑动控制（移动端）
  let touchStart = null;
  canvas.addEventListener('touchstart', e => {
    if(e.touches.length === 1){
      const t = e.touches[0]; touchStart = {x:t.clientX, y:t.clientY, time:Date.now()};
    }
  }, {passive:true});
  canvas.addEventListener('touchend', e => {
    if(!touchStart) return; const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x; const dy = t.clientY - touchStart.y;
    const absX = Math.abs(dx); const absY = Math.abs(dy);
    if(Math.max(absX,absY) > 20){
      if(absX > absY){ nextDir = dx > 0 ? {x:1,y:0} : {x:-1,y:0}; }
      else { nextDir = dy > 0 ? {x:0,y:1} : {x:0,y:-1}; }
    }
    touchStart = null;
  }, {passive:true});

  // 鼠标点击重启位置
  canvas.addEventListener('dblclick', () => reset());

  // 初始
  reset();
})();
