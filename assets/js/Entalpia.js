document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".toolbox").forEach(box => {
        if (box.id !== "enthalpy-tool") return;

        // Seletores corrigidos – agora usando os IDs do HTML
        const reactionSelect = box.querySelector("#param-reaction");
        const t1Input        = box.querySelector("#param-t1");
        const t2Input        = box.querySelector("#param-t2");
        const btnCalculate   = box.querySelector("#btn-calculate");
        const resultsPanel   = box.querySelector("#results-panel");
        const infoBox        = box.querySelector("#info-box");

        const cpCanvas       = box.querySelector("#cpChart");
        const kirchhoffCanvas = box.querySelector("#kirchhoffChart");

        let cpChartInstance = null;
        let kirchhoffChartInstance = null;

        // Banco de dados NIST (inalterado)
        const nistData = {
            "N2":  { A: 28.98641,  B: 1.853978,  C: -9.647459, D: 16.63537,  E: 0.000117,  hf298: 0.0 },
            "H2":  { A: 33.066178, B: -11.36342, C: 11.432816, D: -2.772874, E: -0.158558, hf298: 0.0 },
            "NH3": { A: 19.99563,  B: 49.77119,  C: -15.37599, D: 1.921168,  E: 0.189174,  hf298: -45.90 },
            "CO2": { A: 24.99735,  B: 55.18696,  C: -33.69137, D: 7.948387,  E: -0.136638, hf298: -393.51 },
            "O2":  { A: 31.32234,  B: -20.23531, C: 57.86644,  D: -36.50624, E: -0.007374, hf298: 0.0 },
            "CH4": { A: -0.703029, B: 108.4773,  C: -42.52157, D: 5.862788,  E: 0.678565,  hf298: -74.87 },
            "H2O": { A: 30.09200,  B: 6.832514,  C: 6.793435,  D: -2.534480, E: 0.082139,  hf298: -241.83 }
        };

        const reactions = {
            ammonia: {
                name: "Formação de Amônia",
                equation: "N₂(g) + 3H₂(g) → 2NH₃(g)",
                maxTemp: 500,
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

        // Funções matemáticas (inalteradas)
        function calculateCp(compId, T) {
            const data = nistData[compId];
            const t = T / 1000;
            return data.A + data.B * t + data.C * Math.pow(t, 2) + data.D * Math.pow(t, 3) + data.E / Math.pow(t, 2);
        }

        function shomatePrimitive(data, T) {
            const t = T / 1000;
            return 1000 * (data.A * t + (data.B * Math.pow(t, 2)) / 2 + (data.C * Math.pow(t, 3)) / 3 + (data.D * Math.pow(t, 4)) / 4 - data.E / t);
        }

        function shomatePrimitiveFromRef(reaction, T) {
            let sum = 0;
            reaction.components.forEach(comp => {
                sum += comp.coeff * shomatePrimitive(nistData[comp.id], 298.15);
            });
            return sum;
        }

        function updateSimulation() {
            const reactionKey = reactionSelect.value;
            const selectedReaction = reactions[reactionKey];

            let t1 = parseFloat(t1Input.value);
            let t2 = parseFloat(t2Input.value);

            if (t1 < 298.15) { t1 = 298.15; t1Input.value = 298.15; }
            if (t2 > selectedReaction.maxTemp) { t2 = selectedReaction.maxTemp; t2Input.value = selectedReaction.maxTemp; }
            if (t2 < t1) { t2 = t1 + 10; t2Input.value = t2; }

            infoBox.innerHTML = `
                <p style="margin: 5px 0;"><strong>Faixa Aceitável:</strong> 298.15 K a ${selectedReaction.maxTemp} K</p>
                <p style="margin: 5px 0; color: #003366;"><strong>Sistema:</strong> ${selectedReaction.equation}</p>
            `;

            let deltaH298 = 0;
            selectedReaction.components.forEach(comp => {
                deltaH298 += comp.coeff * nistData[comp.id].hf298;
            });

            let integralT1 = 0;
            let integralT2 = 0;
            selectedReaction.components.forEach(comp => {
                const data = nistData[comp.id];
                integralT1 += comp.coeff * shomatePrimitive(data, t1);
                integralT2 += comp.coeff * shomatePrimitive(data, t2);
            });

            const deltaH_T1 = deltaH298 + (integralT1 - shomatePrimitiveFromRef(selectedReaction, t1)) / 1000;
            const totalKirchhoffIntegral = (integralT2 - integralT1) / 1000;
            const deltaH_T2 = deltaH_T1 + totalKirchhoffIntegral;

            resultsPanel.style.display = "block";
            resultsPanel.innerHTML = `
                <h3 style="margin-top: 0; color: #276a3e; border-bottom: 1px solid #b5e2a3; padding-bottom: 5px;">Resultados Termodinâmicos</h3>
                <table style="width: 100%; border-collapse: collapse; font-family: monospace;">
                    <tr><td><strong>Δ_rH° (298.15 K) ref:</strong></td><td style="text-align: right;">${deltaH298.toFixed(2)} kJ/mol</td></tr>
                    <tr><td><strong>Δ_rH° em T₁ (${t1} K):</strong></td><td style="text-align: right;">${deltaH_T1.toFixed(2)} kJ/mol</td></tr>
                    <tr><td><strong>Termo Integral (∫ Δ_rC_p dT):</strong></td><td style="text-align: right; color: #b84117; font-weight: bold;">${totalKirchhoffIntegral.toFixed(3)} kJ/mol</td></tr>
                    <tr style="border-top: 1px dashed #b5e2a3;"><td style="padding-top: 5px;"><strong>Δ_rH° em T₂ (${t2} K):</strong></td><td style="text-align: right; padding-top: 5px; font-size: 1.1em; font-weight: bold;">${deltaH_T2.toFixed(2)} kJ/mol</td></tr>
                </table>
            `;

            const temperatures = [];
            const step = (selectedReaction.maxTemp - 298.15) / 50;
            for (let T = 298.15; T <= selectedReaction.maxTemp; T += step) {
                temperatures.push(T);
            }
            if (!temperatures.includes(selectedReaction.maxTemp)) temperatures.push(selectedReaction.maxTemp);

            const datasetsChart1 = [];
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

            const deltaCpValues = temperatures.map(T => {
                let sum = 0;
                selectedReaction.components.forEach(comp => { sum += comp.coeff * calculateCp(comp.id, T); });
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

            if (cpChartInstance) cpChartInstance.destroy();
            cpChartInstance = new Chart(cpCanvas.getContext('2d'), {
                type: 'line',
                data: { labels: temperatures.map(T => T.toFixed(0)), datasets: datasetsChart1 },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: 'Temperatura / K' } },
                        y: { title: { display: true, text: 'C_p,m / (J · mol⁻¹ · K⁻¹)' } }
                    }
                }
            });

            const infoKirchhoffPoints = [];
            const shadedPoints = [];

            temperatures.forEach((T, index) => {
                const val = deltaCpValues[index];
                infoKirchhoffPoints.push({ x: T, y: val });
                if (T >= t1 && T <= t2) {
                    shadedPoints.push({ x: T, y: val });
                }
            });

            if (kirchhoffChartInstance) kirchhoffChartInstance.destroy();
            kirchhoffChartInstance = new Chart(kirchhoffCanvas.getContext('2d'), {
                type: 'line',
                data: {
                    datasets: [
                        {
                            label: 'Δ_rC_p (Polinômio da Reação)',
                            data: infoKirchhoffPoints,
                            borderColor: '#17a2b8',
                            borderWidth: 2,
                            pointRadius: 0,
                            fill: false
                        },
                        {
                            label: `Integral de Kirchhoff (T₁ para T₂)`,
                            data: shadedPoints,
                            borderColor: 'transparent',
                            backgroundColor: 'rgba(23, 162, 184, 0.35)',
                            fill: 'origin',
                            pointRadius: 0,
                            showLine: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: 'linear', min: 298.15, max: selectedReaction.maxTemp, title: { display: true, text: 'Temperatura / K' } },
                        y: { title: { display: true, text: 'Δ_rC_p / (J · mol⁻¹ · K⁻¹)' } }
                    }
                }
            });
        }

        btnCalculate.addEventListener("click", updateSimulation);
        reactionSelect.addEventListener("change", () => {
            t2Input.value = reactions[reactionSelect.value].maxTemp;
            updateSimulation();
        });

        // Primeira execução automática
        updateSimulation();
    });
});
