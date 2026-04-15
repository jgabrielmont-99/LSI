const { createApp, ref, reactive, computed, onBeforeUnmount, nextTick } = Vue;

const EsferasApp = {
  setup() {
    // --- CONFIGURAÇÃO ---
    const params = reactive({
      visualSpeedScaling: true, 
      edge: 70,
      n1: 150,
      r1: 0.5,
      m1: 50, 
      n2: 0,
      r2: 0.5,
      m2: 10,
      T: 300,
      steps: 20000,
      dt: 0.005, 
      freqInterval: 200
    });

    // --- ESTADO DA UI ---
    const isCalculating = ref(false);
    const calculationDone = ref(false);
    const progress = ref(0);
    const eta = ref("");

    // --- REFS PARA O TOOLTIP (HOVER) NATIVO NÂO-REATIVO ---
    const tooltipVelRef = ref(null);
    const tooltipFreqRef = ref(null);

    function onChartMouseMoveNative(e, data, getKeyY, maxY, tooltipGroup, labelPrefix) {
      if (!data || data.length === 0 || !tooltipGroup) return;

      const startX = 60;
      const plotW = 540;
      const plotH = 280;
      const zeroY = 300; 

      const mouseX = e.offsetX;

      let ratio = (mouseX - startX) / plotW;
      ratio = Math.max(0, Math.min(1, ratio)); 

      const index = Math.round(ratio * (data.length - 1));
      const point = data[index];
      if (!point) return;

      const val = getKeyY(point);
      const px = startX + (index / (data.length - 1)) * plotW;
      const py = zeroY - (val / maxY) * plotH;

      tooltipGroup.style.display = 'block';
      tooltipGroup.querySelector('.hover-line').setAttribute('x1', px);
      tooltipGroup.querySelector('.hover-line').setAttribute('x2', px);
      tooltipGroup.querySelector('.hover-circle').setAttribute('cx', px);
      tooltipGroup.querySelector('.hover-circle').setAttribute('cy', py);

      const box = tooltipGroup.querySelector('.hover-box');
      const translateX = px < 500 ? px + 10 : px - 120;
      box.setAttribute('transform', `translate(${translateX}, ${py - 10})`);

      tooltipGroup.querySelector('.hover-step').textContent = `Step: ${point.step}`;
      const valFormatted = labelPrefix === 'Freq' ? val.toFixed(0) : val.toFixed(3);
      tooltipGroup.querySelector('.hover-val').textContent = `${labelPrefix}: ${valFormatted}`;
    }

    function onChartLeaveNative(tooltipGroup) {
      if (tooltipGroup) {
        tooltipGroup.style.display = 'none';
      }
    }

    // --- ESTADO DO HISTOGRAMA ---
    const histData = ref([]); 
    const histConfig = reactive({ vmin: -10, vmax: 10, binWidth: 0.5, bins: 40 });
    const theoreticalCurve = ref([]);
    const maxHistY = ref(1.0);

    // --- DADOS DA SIMULAÇÃO ---
    let frames = [];         
    let velocityData = [];   
    let frequencyData = [];  
    const theoreticalMeanV = ref(0); 

    const velocityMaxY = ref(10);
    const frequencyMaxY = ref(10);

    // MARCADORES DO EIXO X (Ticks)
    const xTicks = computed(() => {
      const ticks = [];
      const numTicks = 5; 
      for (let i = 0; i <= numTicks; i++) {
        const val = (params.steps / numTicks) * i;
        const x = 60 + (i / numTicks) * 540; 
        ticks.push({ label: Math.round(val), x });
      }
      return ticks;
    });

    // POSIÇÃO Y DA VELOCIDADE TEÓRICA
    const theoreticalY = computed(() => {
      if (!velocityMaxY.value || !theoreticalMeanV.value) return 300;
      return 300 - (theoreticalMeanV.value / velocityMaxY.value) * 280; 
    });


    // --- UTILS MATH E CORES ---
    function gaussian(a, b, v) {
      return a * Math.exp(-b*(v**2));
    }
    function randomUniform(min, max) {
        return Math.random() * (max - min) + min;
    }

    function getSpeedColor(vx, vy, vmax) {
      const speed = Math.hypot(vx, vy);
      let ratio = speed / (vmax*0.8);
      if (ratio > 1) ratio = 1; 

      const r = Math.round(255 * ratio);
      const g = 0; 
      const b = Math.round(255 * (1 - ratio));

      return `rgb(${r}, ${g}, ${b})`;
    }

    // --- CLASSE BOLA ---
    class Bola {
      constructor(radius, mass, x, y, vx, vy, color) {
        this.radius = radius;
        this.mass = mass;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
      }

      checkOverlap(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dist = Math.hypot(dx, dy);
        return dist <= (this.radius + other.radius);
      }

      advance(dt, edge, simRef) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.x + this.radius >= edge) {
          this.x = edge - this.radius;
          this.vx *= -1;
          simRef.colisaoContador++;} 
        if (this.x - this.radius <= 0) {
          this.x = this.radius;
          this.vx *= -1;
          simRef.colisaoContador++;}
        if (this.y + this.radius >= edge) {
          this.y = edge - this.radius;
          this.vy *= -1;
          simRef.colisaoContador++;} 
        if (this.y - this.radius <= 0) {
          this.y = this.radius;
          this.vy *= -1;
          simRef.colisaoContador++;}
      }
    }

    // --- ENGINE DA SIMULAÇÃO ---
    async function runSimulation() {
      isCalculating.value = true;
      calculationDone.value = false;
      progress.value = 0;
      
      frames = [];
      velocityData = [];
      frequencyData = [];
      
      await new Promise(r => setTimeout(r, 50));
      const startTime = performance.now();
      
      const particles = [];
      const k1 = 5.0;
      const sigma1 = Math.sqrt(k1 * params.T / params.m1);
      const b1 = 1 / (sigma1**2);
      theoreticalMeanV.value = Math.sqrt(Math.PI / b1) / 2;

      const a1 = Math.sqrt(b1 / Math.PI); 

      histConfig.vmax = 3.5 * sigma1;
      histConfig.vmin = -histConfig.vmax;
      histConfig.bins = 40;
      histConfig.binWidth = (histConfig.vmax - histConfig.vmin) / histConfig.bins;

      theoreticalCurve.value = [];
      let maxT = 0;
      for (let i = 0; i <= 50; i++) {
        let v = histConfig.vmin + (i / 50) * (histConfig.vmax - histConfig.vmin);
        let dens = a1 * Math.exp(-b1 * (v**2));
        theoreticalCurve.value.push({ v, dens });
        if (dens > maxT) maxT = dens;
      }
      maxHistY.value = maxT * 1.3;

      let runningBins = new Array(histConfig.bins).fill(0);
      let runningTotal = 0;
      let newHistData = [];

      const placeParticles = (count, r, m, baseColor) => {
        let placed = 0;
        let attempts = 0;
        const maxAttempts = count * 2000;
        const k = 5.0;
        const slices = 40;
        const sigma = Math.sqrt(k * params.T / m);
        const b = 1 / (sigma**2);
        const a = Math.sqrt(b/Math.PI);
        const vmax = 3*sigma;
        const vmin = - vmax;
        const window = (vmax - vmin)/slices;
        const prob_wind = [];

        for (let i = 0; i < slices; i++) {    	
    	const l_bound = vmin + i * window;
            const u_bound = l_bound + window;
    	const P = ( gaussian(a,b,u_bound) + gaussian(a,b,l_bound))*window/2;
    	prob_wind.push(P);
        }

        while (placed < count && attempts < maxAttempts) {
          attempts++;
          const x = Math.random() * (params.edge - 2*r) + r;
          const y = Math.random() * (params.edge - 2*r) + r;
          
          let overlap = false;
          for (let p of particles) {
            if (Math.hypot(x - p.x, y - p.y) <= (r + p.radius)) { overlap = true; break; }
          }
          
          if (!overlap) {
          	let vx, vy
          	while (true) {
    		vx = randomUniform(vmin,vmax);
    		vy = randomUniform(vmin,vmax);
    		const wx = Math.random();
    		const wy = Math.random();
    		let ix = Math.floor(((vx - vmin) / (vmax - vmin)) * slices);
    		let iy = Math.floor(((vy - vmin) / (vmax - vmin)) * slices);
    		ix = Math.max(0, Math.min(ix, slices - 1));
        		iy = Math.max(0, Math.min(iy, slices - 1));

    		if (wx <= prob_wind[ix] && wy <= prob_wind[iy]) {
            		break;
    		}
    	}	
            particles.push(new Bola(r, m, x, y, vx, vy, baseColor));
            placed++;
          }
        }
        if (placed < count) console.warn(`Aviso: ${placed}/${count} partículas colocadas.`);
      };

      placeParticles(params.n1, params.r1, params.m1, '#4caf50');
      placeParticles(params.n2, params.r2, params.m2, '#f44336');

      let simTime = 0;
      let lastCollisionCount = 0;
      const simObj = { colisaoContador: 0 }; 
      const chunkSize = 100; 
      const totalSteps = params.steps;

      for (let step = 0; step < totalSteps; step++) {
        
        for (let p of particles) {
          p.advance(params.dt, params.edge, simObj);
        }
        
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i];
            const p2 = particles[j];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.hypot(dx, dy);
            
            const sumRadius = p1.radius + p2.radius;

            if (dist <= sumRadius) {
               const safeDist = dist === 0 ? 1e-8 : dist;
               
               const theta = Math.atan2(dy, dx);
               const vn1 = Math.cos(theta) * p1.vx + Math.sin(theta) * p1.vy;
               const vn2 = Math.cos(theta) * p2.vx + Math.sin(theta) * p2.vy;
               const vt1 = -Math.sin(theta) * p1.vx + Math.cos(theta) * p1.vy;
               const vt2 = -Math.sin(theta) * p2.vx + Math.cos(theta) * p2.vy;
               
               const m1 = p1.mass;
               const m2 = p2.mass;
               
               const un1 = ((m1 - m2) * vn1 + 2 * m2 * vn2) / (m1 + m2);
               const un2 = ((m2 - m1) * vn2 + 2 * m1 * vn1) / (m1 + m2);
               
               p1.vx = Math.cos(theta) * un1 - Math.sin(theta) * vt1;
               p1.vy = Math.sin(theta) * un1 + Math.cos(theta) * vt1;
               p2.vx = Math.cos(theta) * un2 - Math.sin(theta) * vt2;
               p2.vy = Math.sin(theta) * un2 + Math.cos(theta) * vt2;

               const overlap = sumRadius - safeDist;
               if (overlap > 0) {
                 const shiftX = (dx / safeDist) * (overlap / 2);
                 const shiftY = (dy / safeDist) * (overlap / 2);
                 
                 p1.x -= shiftX; 
                 p1.y -= shiftY;
                 p2.x += shiftX; 
                 p2.y += shiftY;
               }
            }
          }
        }
        
        simTime += params.dt;

        const stride = Math.max(1, Math.floor(params.steps / 1000));
        if (step % stride === 0 || step === totalSteps - 1) {
          frames.push(particles.map(p => ({ pode me gerar o 
            x: p.x, 
            y: p.y, 
            r: p.radius, 
            c: getSpeedColor(p.vx, p.vy, histConfig.vmax) 
          })));
          
          const totalSpeed = particles.reduce((acc, p) => acc + Math.hypot(p.vx, p.vy), 0);
          velocityData.push({ step, sim: totalSpeed / particles.length, theo: theoreticalMeanV.value });

          let instBins = new Array(histConfig.bins).fill(0);
          let instTotal = 0;

          for (let p of particles) {
            if (p.mass === params.m1) { 
              let bx = Math.floor((p.vx - histConfig.vmin) / histConfig.binWidth);
              let by = Math.floor((p.vy - histConfig.vmin) / histConfig.binWidth);
              
              if (bx >= 0 && bx < histConfig.bins) { instBins[bx]++; runningBins[bx]++; instTotal++; runningTotal++; }
              if (by >= 0 && by < histConfig.bins) { instBins[by]++; runningBins[by]++; instTotal++; runningTotal++; }
            }pode me gerar o 
          }

          let instDensity = instBins.map(c => c / (instTotal * histConfig.binWidth || 1));
          let cumDensity = runningBins.map(c => c / (runningTotal * histConfig.binWidth || 1));

          newHistData.push({ inst: instDensity, cum: cumDensity });
        }

        if ((step + 1) % params.freqInterval === 0) {
          const collisionsInInterval = simObj.colisaoContador - lastCollisionCount;
          frequencyData.push({ step: step + 1, count: collisionsInInterval });
          lastCollisionCount = simObj.colisaoContador;
        }

        if (step % chunkSize === 0) {
          progress.value = (step / totalSteps) * 100;
          const now = performance.now();
          const elapsed = (now - startTime) / 1000;
          const rate = step / elapsed; 
          const etaSeconds = (totalSteps - step) / rate;
          eta.value = isFinite(etaSeconds) ? `${etaSeconds.toFixed(1)}s` : "--";
          await new Promise(r => setTimeout(r, 0));
        }
      }

      progress.value = 100;
      
      const maxSimV = Math.max(...velocityData.map(d => d.sim));
      const maxTheoV = Math.max(...velocityData.map(d => d.theo));
      velocityMaxY.value = Math.max(maxSimV, maxTheoV) * 1.1; 

      if (frequencyData.length > 0) {
        const maxFreq = Math.max(...frequencyData.map(d => d.count));
        frequencyMaxY.value = maxFreq > 0 ? maxFreq * 1.1 : 10;
      } else {
        frequencyMaxY.value = 10;
      }

      histData.value = newHistData;
      isCalculating.value = false;
      calculationDone.value = true;
      
      nextTick(() => {
        currentFrameIdx.value = 0;
        exactFrame = 0;
        drawFrame(0);
      });
    }

    // --- VISUALIZAÇÃO E ANIMAÇÃO ESCALONADA ---
    const canvasRef = ref(null);
    const isPlaying = ref(false);
    const currentFrameIdx = ref(0);
    const totalFrames = computed(() => frames.length);
    let animId = null;
    let exactFrame = 0; 

    function drawFrame(idx) {
      if (!frames[idx] || !canvasRef.value) return;
      const ctx = canvasRef.value.getContext('2d');
      const w = canvasRef.value.width;
      const h = canvasRef.value.height;
      const scale = w / params.edge;

      ctx.clearRect(0, 0, w, h);

      for (let p of frames[idx]) {
        const isIdealGas = p.r === 0;
        const drawRadius = isIdealGas ? 0.5 : p.r; 

        ctx.beginPath();
        ctx.arc(p.x * scale, (params.edge - p.y) * scale, drawRadius * scale, 0, Math.PI * 2);
        
        if (isIdealGas) {
          ctx.fillStyle = p.c;
          ctx.globalAlpha = 0.3; 
          ctx.fill();
          ctx.globalAlpha = 1.0;
          
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#666'; 
          ctx.setLineDash([2, 4]); 
          ctx.stroke();
          ctx.setLineDash([]); 
        } else {
          ctx.fillStyle = p.c;
          ctx.fill();
          
          ctx.lineWidth = 0.5;
          ctx.strokeStyle = '#333';
          ctx.setLineDash([]); 
          ctx.stroke();
        }
      }
    }

    function playLoop() {
      const speedFactor = params.visualSpeedScaling 
        ? Math.sqrt(Math.max(1, params.T) / 1000) 
        : 1.0;

      if (exactFrame < totalFrames.value - 1) {
        exactFrame += speedFactor;
        
        if (exactFrame >= totalFrames.value - 1) {
          exactFrame = totalFrames.value - 1;
          isPlaying.value = false;
        }
        
        currentFrameIdx.value = Math.floor(exactFrame);
        drawFrame(currentFrameIdx.value);
        
        if (isPlaying.value) {
          animId = requestAnimationFrame(playLoop);
        }
      } else {
        isPlaying.value = false;
      }
    }

    function togglePlayback() {
      if (isPlaying.value) {
        cancelAnimationFrame(animId);
        isPlaying.value = false;
      } else {
        isPlaying.value = true;
        if (currentFrameIdx.value >= totalFrames.value - 1) {
          currentFrameIdx.value = 0;
          exactFrame = 0;
        } else {
          exactFrame = currentFrameIdx.value;
        }
        playLoop();
      }
    }

    function onScrubberInput() {
      exactFrame = currentFrameIdx.value;
      drawFrame(currentFrameIdx.value);
    }

    // --- GRÁFICOS E HISTOGRAMA ANIMADOS ---
    const currentCumHist = computed(() => histData.value[currentFrameIdx.value]?.cum || []);
    const currentInstHist = computed(() => histData.value[currentFrameIdx.value]?.inst || []);

    const currentVelocityData = computed(() => {
      if (!calculationDone.value || !velocityData.length) return [];
      return velocityData.slice(0, currentFrameIdx.value + 1);
    });

    const currentFrequencyData = computed(() => {
      if (!calculationDone.value || !frequencyData.length || !velocityData.length) return [];
      const currentStep = velocityData[currentFrameIdx.value]?.step || 0;
      return frequencyData.filter(d => d.step <= currentStep);
    });

    function getHistX(i) { return 40 + (i / histConfig.bins) * 320; }
    function getHistW() { return 320 / histConfig.bins; }
    function getHistY(dens) { return 260 - (dens / maxHistY.value) * 220; }
    function getHistH(dens) { return (dens / maxHistY.value) * 220; }

    const histTheoreticalPath = computed(() => {
      if (!theoreticalCurve.value.length) return "";
      let d = "";
      theoreticalCurve.value.forEach((pt, i) => {
        let ratio = (pt.v - histConfig.vmin) / (histConfig.vmax - histConfig.vmin);
        let x = 40 + ratio * 320;
        let y = 260 - (pt.dens / maxHistY.value) * 220;
        d += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
      });
      return d;
    });

    function createPath(data, getKeyY, maxY) {
      if (!data.length) return "";
      const plotW = 540;
      const plotH = 280;
      const startX = 60;
      const zeroY = 300;
      
      const maxX = params.steps || 1;
      const effMaxY = maxY || 1;

      let d = `M ${startX} ${zeroY - (getKeyY(data[0]) / effMaxY) * plotH}`;
      
      for (let point of data) {
        const px = startX + (point.step / maxX) * plotW;
        const py = zeroY - (getKeyY(point) / effMaxY) * plotH;
        d += ` L ${px} ${py}`;
      }
      return d;
    }

    const velocityPathSim = computed(() => createPath(currentVelocityData.value, d => d.sim, velocityMaxY.value));
    const velocityPathTheoretical = computed(() => createPath(velocityData, d => d.theo, velocityMaxY.value));
    const frequencyPath = computed(() => createPath(currentFrequencyData.value, d => d.count, frequencyMaxY.value));

    onBeforeUnmount(() => {
      cancelAnimationFrame(animId);
    });

    // Retorna todos os dados reativos para a UI do Markdown
    return {
      params, isCalculating, calculationDone, progress, eta, 
      tooltipVelRef, tooltipFreqRef, onChartMouseMoveNative, onChartLeaveNative, 
      currentCumHist, currentInstHist, getHistX, getHistY, getHistW, getHistH, 
      histTheoreticalPath, velocityPathSim, velocityPathTheoretical, velocityMaxY, 
      theoreticalMeanV, xTicks, theoreticalY, frequencyPath, frequencyMaxY, 
      runSimulation, togglePlayback, isPlaying, currentFrameIdx, totalFrames, 
      onScrubberInput, canvasRef, currentVelocityData, currentFrequencyData
    };
  }
};

// Monta o app no div de ID "esferas-app" que está no Markdown
createApp(EsferasApp).mount('#esferas-app');
