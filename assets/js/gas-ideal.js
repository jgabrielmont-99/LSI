document.addEventListener("DOMContentLoaded", () => {
    // Procura todas as caixas de ferramentas (toolbox) na página
    document.querySelectorAll(".toolbox").forEach(box => {
        
        // Só executa este código se for a toolbox do Gás Ideal
        if (box.id !== "gas-ideal-tool") return;

        const canvas = box.querySelector(".graph-canvas");
        const selectNumCurvas = box.querySelector(".select-num-curvas");
        const selectX = box.querySelector("#select-x");
        
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const R = 0.08314;
        let chartInstance = null;

        function drawGasGraph() {
            const numCurvas = parseInt(selectNumCurvas.value);
            const axisX = selectX.value;
            const datasets = [];
            const cores = ['#2980b9', '#e74c3c', '#27ae60']; // Azul, Vermelho, Verde

            for (let i = 1; i <= numCurvas; i++) {
                const slider = box.querySelector(`.temp-c${i}`);
                const temp = parseFloat(slider.value);
                
                // Atualiza o número que aparece ao lado do slider
                slider.nextElementSibling.textContent = temp;

                const pontos = [];
                // Se X for Volume, variamos V de 1 a 50. Se for Temp, variamos T de 100 a 1000.
                const start = (axisX === 'V') ? 1 : 100;
                const end = (axisX === 'V') ? 50 : 1000;
                const step = (axisX === 'V') ? 1 : 20;

                for (let val = start; val <= end; val += step) {
                    let y;
                    if (axisX === 'V') {
                        y = (1 * R * temp) / val; // P = nRT/V
                    } else {
                        y = (1 * R * val) / 10;   // P = nRT/V (com V fixo em 10 para exemplo)
                    }
                    pontos.push({ x: val, y: y });
                }

                datasets.push({
                    label: `T = ${temp}K`,
                    data: pontos,
                    borderColor: cores[i-1],
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.3
                });
            }

            // Destrói o gráfico anterior para não bugar
            if (chartInstance) chartInstance.destroy();

            // Cria o novo gráfico usando Chart.js
            chartInstance = new Chart(ctx, {
                type: 'line',
                data: { datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Ajusta ao tamanho fixo do CSS do prof
                    aspectRatio: 1,
                    scales: {
                        x: { 
                            type: 'linear', 
                            title: { display: true, text: axisX === 'V' ? 'Volume (L)' : 'Temperatura (K)' } 
                        },
                        y: { 
                            title: { display: true, text: 'Pressão (bar)' },
                            min: 0
                        }
                    }
                }
            });
        }

        // Adiciona os "ouvintes" para atualizar o gráfico sempre que mexer em algo
        selectNumCurvas.addEventListener("change", drawGasGraph);
        selectX.addEventListener("change", drawGasGraph);
        box.querySelectorAll("input[type=range]").forEach(s => {
            s.addEventListener("input", drawGasGraph);
        });

        // Desenha o gráfico pela primeira vez
        drawGasGraph();
    });
});
