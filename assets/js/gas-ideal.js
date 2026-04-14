//gas-ideal.js

const R_GAS = 0.08314;
let meuGraficoGases = null;

// Esta função faz o cálculo que estava no App.vue
function calcularY(xValue, config, axisX, axisY) {
    const state = { p: config.p, V: config.V, n: config.n, T: config.T };
    state[axisX] = xValue;

    if (axisY === 'p') return (state.n * R_GAS * state.T) / state.V;
    if (axisY === 'V') return (state.n * R_GAS * state.T) / state.p;
    if (axisY === 'T') return (state.p * state.V) / (state.n * R_GAS);
    if (axisY === 'n') return (state.p * state.V) / (R_GAS * state.T);
    return 0;
}

function atualizarSimulacaoGases() {
    const ctx = document.getElementById('canvas-gases').getContext('2d');
    
    const axisX = document.getElementById('select-x').value;
    const axisY = "p"; // Fixamos Y em Pressão por enquanto para facilitar
    const numCurvas = parseInt(document.getElementById('num-curvas').value) || 1;

    if (meuGraficoGases) meuGraficoGases.destroy();

    const datasets = [];
    const cores = ['#2980b9', '#e74c3c', '#27ae60']; // Azul, Vermelho, Verde

    for (let i = 0; i < numCurvas; i++) {
        const pontos = [];
        // Pega os valores dos inputs específicos de cada curva (T1, T2, T3...)
        const temp = parseFloat(document.getElementById(`temp-c${i+1}`).value) || 300;
        const n_mol = parseFloat(document.getElementById(`n-c${i+1}`).value) || 1.0;

        for (let x = 1; x <= 50; x += 1) {
            pontos.push({ x: x, y: calcularY(x, {T: temp, n: n_mol, V: 10, p: 1}, axisX, axisY) });
        }

        datasets.push({
            label: `Curva ${i+1} (T=${temp}K)`,
            data: pontos,
            borderColor: cores[i],
            pointRadius: 0,
            tension: 0.3
        });
    }

    meuGraficoGases = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            scales: {
                x: { type: 'linear', title: { display: true, text: axisX } },
                y: { title: { display: true, text: axisY } }
            }
        }
    });
}
