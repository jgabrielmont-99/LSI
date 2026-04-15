document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".toolbox").forEach(box => {
        if (box.id !== "gas-ideal-tool") return;

        const canvas = box.querySelector("#gasChart");
        const btnUpdate = box.querySelector(".generate-btn");
        const R = 0.08314;
        let chartInstance = null;

        const axisLabels = { P: 'P / bar', V: 'V / L', T: 'T / K', n: 'n / mol' };

        function getPoints(setIndex, config) {
            const points = [];
            const step = (config.rangeXMax - config.rangeXMin) / 100;
            
            // Pega os valores dos inputs daquela curva específica
            const s = {
                P: parseFloat(box.querySelector(`.p-${setIndex}`).value),
                V: parseFloat(box.querySelector(`.v-${setIndex}`).value),
                T: parseFloat(box.querySelector(`.t-${setIndex}`).value),
                n: parseFloat(box.querySelector(`.n-${setIndex}`).value)
            };

            for (let i = 0; i <= 100; i++) {
                let xValue = config.rangeXMin + (step * i);
                if (xValue <= 0) continue;

                let state = { ...s };
                state[config.axisX] = xValue;

                let yValue = 0;
                if (config.axisY === 'P') yValue = (state.n * R * state.T) / state.V;
                else if (config.axisY === 'V') yValue = (state.n * R * state.T) / state.P;
                else if (config.axisY === 'T') yValue = (state.P * state.V) / (state.n * R);
                else if (config.axisY === 'n') yValue = (state.P * state.V) / (R * state.T);

                points.push({ x: xValue, y: yValue });
            }
            return points;
        }

        function updateChart() {
            const config = {
                axisX: box.querySelector(".axis-x").value,
                axisY: box.querySelector(".axis-y").value,
                numCurves: parseInt(box.querySelector(".num-curves").value),
                rangeXMin: parseFloat(box.querySelector(".xmin").value),
                rangeXMax: parseFloat(box.querySelector(".xmax").value),
                rangeYMin: parseFloat(box.querySelector(".ymin").value),
                rangeYMax: parseFloat(box.querySelector(".ymax").value)
            };

            if (config.axisX === config.axisY) {
                alert("O Eixo X deve ser diferente do Eixo Y!");
                return;
            }

            const colors = ['#2980b9', '#e74c3c', '#27ae60'];
            const datasets = [];

            for (let i = 0; i < config.numCurves; i++) {
                datasets.push({
                    label: `Curva ${i + 1}`,
                    data: getPoints(i, config),
                    borderColor: colors[i],
                    tension: 0.3,
                    pointRadius: 0
                });
            }

            if (chartInstance) chartInstance.destroy();

            chartInstance = new Chart(canvas.getContext('2d'), {
                type: 'line',
                data: { datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: 'linear', title: { display: true, text: axisLabels[config.axisX] }, min: config.rangeXMin, max: config.rangeXMax },
                        y: { title: { display: true, text: axisLabels[config.axisY] }, min: config.rangeYMin, max: config.rangeYMax }
                    }
                }
            });
        }

        btnUpdate.addEventListener("click", updateChart);
        updateChart(); // Inicializa o gráfico
    });
});
