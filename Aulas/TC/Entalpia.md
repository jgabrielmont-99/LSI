---
layout: TCclass
title: Entalpia
previous_class: "/LSI/Aulas/TC/A9"
next_class: "/LSI/Aulas/TC/A10"
---
---
layout: TCclass
title: Entalpia
previous_class: "/LSI/Aulas/TC/A8"
next_class: "/LSI/Aulas/TC/"
---

<div class="toolbox" id="enthalpy-tool">
    <div class="toolbox-header">
        <h2 class="toolbox-title">Laboratório Virtual</h2>        
    </div>

    <div class="jsbox-col-title" style="font-size: 1.2em; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; margin-top: 20px; color: #003366;">
        Dependência da Entalpia com a Temperatura: Lei de Kirchhoff
    </div>

    <p class="jt">
        Este Laboratório Virtual permite investigar como a entalpia padrão de uma reação química varia com a temperatura. Em termodinâmica elementar, costuma-se considerar as capacidades caloríficas como constantes. Contudo, em sistemas reais, o $C_{p,m}$ varia com a temperatura seguindo ajustes polinomiais experimentais fornecidos pelo <strong>NIST WebBook</strong> (Equação de Shomate).
    </p>
    
    <p class="jt">
        A variação do calor de reação com a temperatura é descrita pela <strong>Lei de Kirchhoff</strong>. Conhecendo-se a entalpia da reação em uma temperatura de referência $T_1$ (geralmente $298{,}15\text{ K}$), pode-se determinar a entalpia em uma temperatura $T_2$ por meio da integração da diferença das capacidades caloríficas dos produtos e reagentes:
     
        $$\Delta_r C_{p,m}(T) = \sum \nu_i \cdot C_{p,m,i}(T)$$
        $$\Delta_r H^\circ(T_2) = \Delta_r H^\circ(T_1) + \int_{T_1}^{T_2} \Delta_r C_{p,m}(T) \, dT$$
    </p>

    <div class="toolbox-content">
        <div class="jsbox-control-panel">
            <div class="jsbox-controls-grid">
                <div>
                    <div class="jsbox-col-title sys">Parâmetros da Reação</div>
                    <div class="jsbox-input-row" style="margin-bottom: 10px;">
                        <label>Reação Química:</label>
                        <select id="param-reaction" class="jsbox-input" style="width: 60%;">
                            <option value="ammonia" selected>Formação de Amônia (N₂ + 3H₂ → 2NH₃)</option>
                            <option value="methane">Combustão do Metano (CH₄ + 2O₂ → CO₂ + 2H₂O)</option>
                        </select>
                    </div>
                    <div class="jsbox-input-row">
                        <label>Temperatura Inicial T₁ / K:</label>
                        <input type="number" id="param-t1" class="jsbox-input" value="298.15" step="10" min="298.15" max="1000">
                    </div>
                    <div class="jsbox-input-row">
                        <label>Temperatura Final T₂ / K:</label>
                        <input type="number" id="param-t2" class="jsbox-input" value="500" step="10" min="298.15" max="1000">
                    </div>
                </div>

                <div>
                    <div class="jsbox-col-title opt">Limites de Operação (NIST)</div>
                    <div class="jsbox-history" id="info-box" style="height: auto; min-height: 100px; font-size: 0.9em;">
                        <p style="margin: 5px 0;"><strong>Faixa Segura:</strong> 298.15 K a 1000 K</p>
                        <p style="margin: 5px 0; color: #666;" id="reaction-equation">Equação: N₂(g) + 3H₂(g) → 2NH₃(g)</p>
                    </div>
                </div>
            </div> 

            <div style="margin-top: 15px;">
                <button id="btn-calculate" class="jsbox-btn jsbox-btn-primary">Calcular e atualizar os gráficos</button>
            </div>
        </div> 

        <div class="jsbox-alert" id="results-panel" style="text-align: left; font-weight: normal; font-size: 0.95em; margin-top: 20px; background-color: #e2f0d9; border-color: #b5e2a3; color: #385723; padding: 15px; border-radius: 4px;">
            </div>

        <div class="jsbox-card" style="margin-top: 20px;">
            <div class="jsbox-card-header" style="background: #003366; color: white;">Capacidades Caloríficas Molares ($C_{p,m}$) individuais e da Reação</div>
            <div class="jsbox-card-body">
                <div class="graph-canvas" style="height: 350px;">
                    <canvas id="cpChart"></canvas>
                </div>
            </div>
        </div>

        <div class="jsbox-card" style="margin-top: 20px;">
            <div class="jsbox-card-header" style="background: #17a2b8; color: white;">Efeito de Kirchhoff (Área Integrada do $\Delta_r C_{p,m}$)</div>
            <div class="jsbox-card-body">
                <div class="graph-canvas" style="height: 350px;">
                    <canvas id="kirchhoffChart"></canvas>
                </div>
            </div>
        </div>
    </div>

    <p class="jt" style="margin-top: 20px;">
        A área hachurada no segundo gráfico representa graficamente o termo integral $\int_{T_1}^{T_2} \Delta_r C_{p,m}(T) \, dT$. Note que se a curva do $\Delta_r C_{p,m}$ estiver abaixo de zero, a entalpia de reação se tornará mais negativa (mais exotérmica) ou menos positiva com o aumento da temperatura.
    </p>
</div> 

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
// Banco de Dados NIST - Coeficientes de Shomate (T de 298.15K a 1000K)
// Cp = A + B*t + C*t^2 + D*t^3 + E/t^2  (onde t = T / 1000)
const nistData = {
    "N2":  { A: 28.98641,  B: 1.853978,  C: -9.647459, D: 16.63537,  E: 0.000117,  hf298: 0.0 },
    "H2":  { A: 33.066178, B: -11.36342, C: 11.432816, D: -2.772874, E: -0.158558, hf298: 0.0 },
    "NH3": { A: 19.99563,  B: 49.77119,  C: -15.37599, D: 1.921168,  E: 0.189174,  hf298: -45.90 }, // kJ/mol
    "CO2": { A: 24.99735,  B: 55.18696,  C: -33.69137, D: 7.948387,  E: -0.136638, hf298: -393.51 },
    "O2":  { A: 31.32234,  B: -20.23531, C: 57.86644,  D: -36.50624, E: -0.007374, hf298: 0.0 },
    "CH4": { A: -0.703029, B: 108.4773,  C: -42.52157, D: 5.862788,  E: 0.678565,  hf298: -74.87 },
    "H2O": { A: 30.09200,  B: 6.832514,  C: 6.793435,  D: -2.534480, E: 0.082139,  hf298: -241.83 } // gasoso
};

// Definição das Reações Estequiométricas
const reactions = {
    ammonia: {
        name: "Formação de Amônia",
        equation: "N₂(g) + 3H₂(g) → 2NH₃(g)",
        maxTemp: 500, // Conforme combinado para foco estrito
        components: [
            { id: "N2", coeff: -1 },
            { id: "H2", coeff: -3 },
            { id: "NH3", coeff: 2 }
        ]
    },
    methane: {
        name: "Combustão do Metano",
        equation: "CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(g)",
        maxTemp: 1000,
        components: [
            { id: "CH4", coeff: -1 },
            { id: "O2", coeff: -2 },
            { id: "CO2", coeff: 1 },
            { id: "H2O", coeff: 2 }
        ]
    }
};

// Instâncias Globais dos Gráficos para Limpeza Automática
let cpChartInstance = null;
let kirchhoffChartInstance = null;

// Função para Calcular o Cp de uma molécula pura
function calculateCp(compId, T) {
    const data = nistData[compId];
    const t = T / 1000;
    return data.A + data.B * t + data.C * Math.pow(t, 2) + data.D * Math.pow(t, 3) + data.E / Math.pow(t, 2);
}

// Função Primitiva da integral da Equação de Shomate: Int(Cp dT) = 1000 * Int(Cp dt)
function shomatePrimitive(data, T) {
    const t = T / 1000;
    return 1000 * (data.A * t + (data.B * Math.pow(t, 2)) / 2 + (data.C * Math.pow(t, 3)) / 3 + (data.D * Math.pow(t, 4)) / 4 - data.E / t);
}

// Execução Principal do Simulador
function updateSimulation() {
    const reactionKey = document.getElementById("param-reaction").value;
    const selectedReaction = reactions[reactionKey];
    
    let t1 = parseFloat(document.getElementById("param-t1").value);
    let t2 = parseFloat(document.getElementById("param-t2").value);
    
    // Validação estrita de limites das faixas de temperatura
    if (t1 < 298.15) { t1 = 298.15; document.getElementById("param-t1").value = 298.15; }
    if (t2 > selectedReaction.maxTemp) { t2 = selectedReaction.maxTemp; document.getElementById("param-t2").value = selectedReaction.maxTemp; }
    if (t2 < t1) { t2 = t1 + 10; document.getElementById("param-t2").value = t2; }

    // Atualiza texto explicativo lateral
    document.getElementById("reaction-equation").innerHTML = `<strong>Equação:</strong> ${selectedReaction.equation}`;
    document.getElementById("info-box").innerHTML = `
        <p style="margin: 5px 0;"><strong>Faixa Aceitável:</strong> 298.15 K a ${selectedReaction.maxTemp} K</p>
        <p style="margin: 5px 0; color: #003366;"><strong>Sistema:</strong> ${selectedReaction.equation}</p>
    `;

    // 1. Cálculo do Delta_r H a 298.15 K (Referência Padrão)
    let deltaH298 = 0;
    selectedReaction.components.forEach(comp => {
        deltaH298 += comp.coeff * nistData[comp.id].hf298;
    });

    // 2. Cálculo das Integrais de Kirchhoff usando o Teorema Fundamental do Cálculo
    let integralT1 = 0;
    let integralT2 = 0;
    
    selectedReaction.components.forEach(comp => {
        const data = nistData[comp.id];
        integralT1 += comp.coeff * shomatePrimitive(data, t1);
        integralT2 += comp.coeff * shomatePrimitive(data, t2);
    });
    
    // Valores calculados em J/mol convertidos para kJ/mol
    const deltaH_T1 = deltaH298 + (integralT1 - shomatePrimitiveFromRef(selectedReaction, t1)) / 1000; 
    const totalKirchhoffIntegral = (integralT2 - integralT1) / 1000; // kJ/mol
    const deltaH_T2 = deltaH_T1 + totalKirchhoffIntegral;

    // Injeção limpa no painel de resultados estruturado
    document.getElementById("results-panel").innerHTML = `
        <h3 style="margin-top: 0; color: #276a3e; border-bottom: 1px solid #b5e2a3; padding-bottom: 5px;">Resultados Termodinâmicos</h3>
        <table style="width: 100%; border-collapse: collapse; font-family: monospace;">
            <tr><td><strong>Δ_rH° (298.15 K) de referência:</strong></td><td style="text-align: right;">${deltaH298.toFixed(2)} kJ/mol</td></tr>
            <tr><td><strong>Δ_rH° no ponto inicial T₁ (${t1} K):</strong></td><td style="text-align: right;">${deltaH_T1.toFixed(2)} kJ/mol</td></tr>
            <tr><td><strong>Valor do Termo Integral (∫ Δ_rC_p dT):</strong></td><td style="text-align: right; color: #b84117; font-weight: bold;">${totalKirchhoffIntegral.toFixed(3)} kJ/mol</td></tr>
            <tr style="border-top: 1px dashed #b5e2a3;"><td style="padding-top: 5px;"><strong>Δ_rH° final calculado no ponto T₂ (${t2} K):</strong></td><td style="text-align: right; padding-top: 5px; font-size: 1.1em; font-weight: bold;">${deltaH_T2.toFixed(2)} kJ/mol</td></tr>
        </table>
    `;

    // Gerar pontos finos para curvas completas dos gráficos (Eixo X)
    const temperatures = [];
    const step = (selectedReaction.maxTemp - 298.15) / 50;
    for (let T = 298.15; T <= selectedReaction.maxTemp; T += step) {
        temperatures.push(T);
    }
    if (!temperatures.includes(selectedReaction.maxTemp)) temperatures.push(selectedReaction.maxTemp);

    // Arrays de plotagem do Gráfico 1
    const datasetsChart1 = [];
    
    // Cores padronizadas para componentes
    const colors = ['#4e73df', '#1cc88a', '#f6c23e', '#e74a3b'];
    
    selectedReaction.components.forEach((comp, idx) => {
        const cpValues = temperatures.map(T => calculateCp(comp.id, T));
        datasetsChart1.push({
            label: `${comp.id} (Cp,m)`,
            data: cpValues,
            borderColor: colors[idx % colors.length],
            borderWidth: 2,
            fill: false,
            pointRadius: 0
        });
    });

    // Calcular linha de Reação (Δ_rCp) para Gráfico 1 e Gráfico 2
    const deltaCpValues = temperatures.map(T => {
        let sum = 0;
        selectedReaction.components.forEach(comp => {
            sum += comp.coeff * calculateCp(comp.id, T);
        });
        return sum;
    });

    datasetsChart1.push({
        label: 'Δ_rC_p (Reação Net)',
        data: deltaCpValues,
        borderColor: '#000000',
        borderWidth: 3,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0
    });

    // Configuração e Renderização do Gráfico 1
    if (cpChartInstance) cpChartInstance.destroy();
    const ctx1 = document.getElementById('cpChart').getContext('2d');
    cpChartInstance = new Chart(ctx1, {
        type: 'line',
        data: { labels: temperatures.map(T => T.toFixed(0)), datasets: datasetsChart1 },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Temperatura / K' } },
                y: { title: { display: true, text: 'C_p,m / (J · mol⁻¹ · K⁻¹)' } }
            },
            plugins: { legend: { position: 'top' } }
        }
    });

    // Lógica Avançada de Hachura para o Gráfico 2
    // Separamos a curva em pontos normais e pontos da área selecionada [T1, T2]
    const infoKirchhoffDataset = [];
    const shadedDataset = [];

    temperatures.forEach((T, index) => {
        const val = deltaCpValues[index];
        infoKirchhoffDataset.push({ x: T, y: val });
        
        // Se a temperatura do ponto estiver dentro do intervalo escolhido, adiciona na hachura
        if (T >= t1 && T <= t2) {
            shadedDataset.push({ x: T, y: val });
        }
    });

    if (kirchhoffChartInstance) kirchhoffChartInstance.destroy();
    const ctx2 = document.getElementById('kirchhoffChart').getContext('2d');
    kirchhoffChartInstance = new Chart(ctx2, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Δ_rC_p (Polinômio da Reação)',
                    data: infoKirchhoffDataset,
                    borderColor: '#17a2b8',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: `Integral de Kirchhoff (T₁ para T₂)`,
                    data: shadedDataset,
                    borderColor: 'transparent',
                    backgroundColor: 'rgba(23, 162, 184, 0.35)', // Tom ciano translúcido
                    fill: 'origin', // Preenche de forma inteligente até a linha zero do gráfico
                    pointRadius: 0,
                    showLine: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { type: 'linear', title: { display: true, text: 'Temperatura / K' }, min: 298.15, max: selectedReaction.maxTemp },
                y: { title: { display: true, text: 'Δ_rC_p / (J · mol⁻¹ · K⁻¹)' } }
            },
            plugins: { legend: { position: 'top' } }
        }
    });
}

// Auxiliar para ancoragem matemática da integral a partir do ponto padrão absoluto 298.15 K
function shomatePrimitiveFromRef(reaction, T) {
    let sum = 0;
    reaction.components.forEach(comp => {
        sum += comp.coeff * shomatePrimitive(nistData[comp.id], 298.15);
    });
    return sum;
}

// Ouvintes de Evento Modulares nativos do JS
document.getElementById("btn-calculate").addEventListener("click", updateSimulation);
document.getElementById("param-reaction").addEventListener("change", function() {
    const reactionKey = this.value;
    // Reseta o slider final baseado na escolha da reação padrão
    document.getElementById("param-t2").value = reactions[reactionKey].maxTemp;
    updateSimulation();
});

// Primeira execução ao carregar a página da aula
window.addEventListener('load', updateSimulation);
</script>
