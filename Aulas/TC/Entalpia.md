---
layout: TCclass
title: Entalpia
previous_class: "/LSI/Aulas/TC/A9"
next_class: "/LSI/Aulas/TC/A10"
---

<div class="toolbox" id="enthalpy-tool">
    <div class="toolbox-header">
        <h2 class="toolbox-title">Laboratório Virtual</h2>        
    </div>

    <div class="jsbox-col-title" style="font-size: 1.2em; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; margin-top: 20px; color: #003366;">
        Dependência da Entalpia com a Temperatura: Lei de Kirchhoff
    </div>

    <p class="jt">
        Este Laboratório Virtual permite investigar como a entalpia padrão de uma reação química varia com a temperatura. Em termodinâmica elementar, costuma-se considerar as capacidades caloríficas como constantes. Contudo, em sistemas reais, o $C_{p,m}$ varia com a temperatura seguindo ajustes polinomiais experimentais fornecidos pelo <strong>NIST WebBook</strong>.
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
                <button class="generate-enthalpy-btn jsbox-btn jsbox-btn-primary">Calcular e atualizar os gráficos</button>
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
        A área hachurada no segundo gráfico representa graficamente o termo integral $\int_{T_1}^{T_2} \Delta_r C_{p,m}(T) \, dT$.
    </p>
</div> 

