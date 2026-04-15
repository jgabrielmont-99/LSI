---
layout: TCclass
title: Estudo dos Gases Ideais
---

A equação de estado dos gases ideais é dada por $$P \cdot V = n \cdot R \cdot T$$. Abaixo, utilize o simulador para comparar diferentes estados termodinâmicos.

<div class="toolbox" id="gas-ideal-tool">
    <div class="toolbox-header">
        <h2 class="toolbox-title">Laboratório Virtual: Gás Ideal</h2>
        <p class="toolbox-subtitle">Ajuste os parâmetros para gerar as isotermas em tempo real.</p>
    </div>

    <div class="toolbox-content">
        <div class="interactive-area">
            <div style="display: flex; gap: 20px; margin-bottom: 15px;">
                <div>
                    <label>Eixo X:</label>
                    <select id="select-x">
                        <option value="V">Volume (V)</option>
                        <option value="T">Temperatura (T)</option>
                    </select>
                </div>
                <div>
                    <label>Quantidade de Curvas: </label>
                    <select class="select-num-curvas">
                        <option value="1">1 Curva</option>
                        <option value="2">2 Curvas</option>
                        <option value="3">3 Curvas</option>
                    </select>
                </div>
            </div>

            <div class="controles-curvas">
                <div class="controle-c1">
                    <strong>Curva 1 (Azul):</strong>
                    T <input type="range" class="temp-c1" min="100" max="1000" value="300"> <span>300</span>K
                </div>
                <div class="controle-c2" style="margin-top:5px">
                    <strong>Curva 2 (Vermelha):</strong>
                    T <input type="range" class="temp-c2" min="100" max="1000" value="500"> <span>500</span>K
                </div>
                <div class="controle-c3" style="margin-top:5px">
                    <strong>Curva 3 (Verde):</strong>
                    T <input type="range" class="temp-c3" min="100" max="1000" value="700"> <span>700</span>K
                </div>
            </div>
        </div>

        <canvas class="graph-canvas"></canvas>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
