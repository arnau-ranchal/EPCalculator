// Ensure DOM is loaded before initializing and binding functions
window.addEventListener('DOMContentLoaded', () => {
    initializeChart();
    onLineTypeChange();
    setTimeout(() => {
      drawDefaultGrid();
      plotInitialGraph();  // <- esta es la llamada nueva
    }, 100);
});


/* Global parameters */
const axisLabelsMap = {
  M:   'Modulation',
  SNR: 'SNR',
  Rate:'Rate',
  N:   'Quadrature',
  n:   'Code length',
  th:  'Threshold'
};
let lastYVar = null;
let lastXVar = null;
let skipPlotWarning = false;



function calculateExponents(event) {
    event.preventDefault();

    const M = document.getElementById('M').value;
    const typeM = document.getElementById('TypeModulation').value;
    const SNR = document.getElementById('SNR').value;
    const R = document.getElementById('R').value;
    const N = document.getElementById('N').value || 20; // Valor per defecte
    const n = document.getElementById('n').value;
    const th = document.getElementById('th').value || 1e-6; // Valor per defecte
    const resultDiv = document.getElementById('result');

    // Neteja resultats anteriors
    resultDiv.innerHTML = "";
    resultDiv.classList.remove('show');

    fetch(`/exponents?M=${M}&typeM=${typeM}&SNR=${SNR}&R=${R}&N=${N}&n=${n}&th=${th}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Server response not OK");
            }
            return response.json();
        })
        .then(data => {
            resultDiv.innerHTML = `
                <p><strong>Probability error:</strong> ${data["Probabilidad de error"].toFixed(4)}</p>
                <p><strong>Exponents:</strong> ${data["Exponents"].toFixed(4)}</p>
                <p><strong>Optimal rho:</strong> ${data["rho óptima"].toFixed(4)}</p>
            `;
            resultDiv.classList.add('show');
        })
        .catch(error => {
            console.error("Error fetching exponents:", error);
            resultDiv.innerHTML = `<p style="color: red; font-weight: bold;">⚠️ Unable to process the data. Please verify your inputs.</p>`;
            resultDiv.classList.add('show');
        });
}


/* Plot Using the ENDPOINT */
function plotFromFunction() {

    const y = document.getElementById('yVar').value;
    const x = document.getElementById('xVar').value;
    const x2 = document.getElementById('xVar2').value; /* Pel contour plot */
    const [min, max] = document.getElementById('xRange').value.split(',').map(Number);
    const [min2, max2] = document.getElementById('xRange2').value.split(',').map(Number); /* Pel contour plot */
    const points = Number(document.getElementById('points').value);
    const points2 = Number(document.getElementById('points2').value); /* Pel contour plot */

    // Recull els valors fixos
    const M = document.getElementById('M').value;
    const typeModulation = document.getElementById('TypeModulation').value;
    const SNR = document.getElementById('SNR').value;
    const Rate = document.getElementById('R').value;
    const N = document.getElementById('N').value || 20; // Valor per defecte
    const n = document.getElementById('n').value;
    const th = document.getElementById('th').value || 1e-6; // Valor per defecte

    const inputs = { M, SNR, Rate, N, n, th };

    /* ----------------- PEL WARNING --------------------- */
    const plotChanged = (lastYVar !== null && (y !== lastYVar || x !== lastXVar));
    const hasPlots = activePlots.length > 0;

    if (plotChanged && hasPlots) {
        if (skipPlotWarning) {
            clearAllPlots();
        } else {
            showPlotWarningModal(() => {
                clearAllPlots();
                lastYVar = y;
                lastXVar = x;
                plotFromFunction(); // Reintenta
            });
            return;
        }
    }


    lastYVar = y;
    lastXVar = x;
    /* ----------------------------------------------------- */

    // Validar inputs
    const resultDiv = document.getElementById('plot-result');
    resultDiv.innerHTML = "";
    resultDiv.classList.remove('show');

    if (isNaN(min) || isNaN(max) || min >= max) {
        resultDiv.innerHTML = `<p style="color: red; font-weight: bold;">⚠️ Please enter a valid range (min < max) for X axis.</p>`;
        resultDiv.classList.add('show');
        return;
    } 

    const lineType = document.getElementById('lineType').value || '-';
    let color = document.getElementById('lineColor').value;
    // Si no s'ha modificat, deixem el color per defecte
    if (!document.getElementById('lineColor').dataset.userModified) {
      color = ""; 
    }

    const plotType = document.getElementById('plotType').value;

    // CONTOUR CASE
    if (plotType === "contour") {

        // TODO: Comprovar si x2 es un valor vàlid
        if (isNaN(min2) || isNaN(max2) || min2 >= max2) {
            resultDiv.innerHTML = `<p style="color: red; font-weight: bold;">⚠️ Please enter a valid range (min < max) for X2 axis.</p>`;
            resultDiv.classList.add('show');
            return;
        } 

        for (const [key, value] of Object.entries(inputs)) {
          if ((key !== x && key !== x2) && (value === '' || isNaN(parseFloat(value)))) {
              resultDiv.innerHTML = `<p style="color: red; font-weight: bold;">⚠️ Please enter a valid value for ${key}.</p>`;
              resultDiv.classList.add('show');
              return;
          }
        }

        const payload = {
        y,
        x1: x,       
        x2,
        rang_x1: [min, max],
        rang_x2: [min2, max2],
        points1: points,
        points2,
        typeModulation,
        M: parseFloat(M) || 0,
        SNR: parseFloat(SNR) || 0,
        Rate: parseFloat(Rate) || 0,
        N: parseFloat(N) || 0,
        n: parseFloat(n) || 0,
        th: parseFloat(th) || 0
        };
      
        fetch("/plot_contour", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        })
          .then(response => response.json())
          .then(data => {
            drawContourPlot(data.x1, data.x2, data.z);
          })
          .catch(error => console.error("Error:", error));
    }
    // LINEAR I LOG CASE
    else{
      for (const [key, value] of Object.entries(inputs)) {
          if (key !== x && (value === '' || isNaN(parseFloat(value)))) {
              resultDiv.innerHTML = `<p style="color: red; font-weight: bold;">⚠️ Please enter a valid value for ${key}.</p>`;
              resultDiv.classList.add('show');
              return;
          }
      }

      const payload = {
          y, x,
          rang_x: [min, max],
          points,
          typeModulation,
          M: parseFloat(M) || 0,
          SNR: parseFloat(SNR) || 0,
          Rate: parseFloat(Rate) || 0,
          N: parseFloat(N) || 0,
          n: parseFloat(n) || 0,
          th: parseFloat(th) || 0,
          color,
          lineType,
          plotType
      };
  
      document.getElementById('plot-result').innerHTML = "";
      document.getElementById('plot-result').classList.remove('show');
    
      fetch('/plot_function', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      })
      .then(response => {
          if (!response.ok) throw new Error("Error en /plot_function");
          return response.json();
      })
      .then(data => {
          console.log("Datos recibidos del backend:", data); 
          // Info que passarem per a poder visualitzar les dades
          const metadata = {
            M, SNR, Rate, N, n, th,
            typeModulation,
            xVar: x
          };
          drawInteractivePlot(data.x, data.y, {
              color: color,
              lineType: lineType,
              plotType: plotType,
              metadata
          });

      })
      .catch(error => {
          console.error("Error plotting data", error);
          const resultDiv = document.getElementById('plot-result');
          resultDiv.innerHTML = `<p style="color: red; font-weight: bold;">⚠️ Unable to process the data. Please verify your inputs.</p>`;
          resultDiv.classList.add('show');
      }); 
    }
       
}


/* Plot Manually  ---> Unused */
function plotManually() {
    const xInputEl = document.getElementById('xValues');
    const yInputEl = document.getElementById('yValues');
    const xInput = xInputEl.value.trim();
    const yInput = yInputEl.value.trim();
    const color = document.getElementById('lineColor').value;
    const plotType = document.getElementById('plotType').value;
    const lineType = document.getElementById('lineType').value || '-';
    //const manualTitle = document.getElementById('manualTitle').value || 'Manual Graph';
    const manualTitle = document.getElementById('manualTitle').value.trim();

    const resultDiv = document.getElementById('plot-result');
    resultDiv.innerHTML = "";
    resultDiv.classList.remove('show');

    // Reset styles
    xInputEl.classList.remove('input-error');
    yInputEl.classList.remove('input-error');

    try {
        if (!xInput || !yInput) {
            if (!xInput) xInputEl.classList.add('input-error');
            if (!yInput) yInputEl.classList.add('input-error');
            throw new Error("Missing input values.");
        }

        const x = xInput.split(',').map(str => Number(str.trim()));
        const y = yInput.split(',').map(str => Number(str.trim()));

        if (x.length !== y.length) {
            xInputEl.classList.add('input-error');
            yInputEl.classList.add('input-error');
            throw new Error("Mismatched array lengths.");
        }

        if (x.some(isNaN) || y.some(isNaN)) {
            xInputEl.classList.add('input-error');
            yInputEl.classList.add('input-error');
            throw new Error("Invalid number in inputs.");
        }

        const sorted = x.map((val, i) => ({ x: val, y: y[i] }))
            .sort((a, b) => a.x - b.x);

        const xSorted = sorted.map(p => p.x);
        const ySorted = sorted.map(p => p.y);

        drawInteractivePlot(xSorted, ySorted, {
            color: color,
            lineType: lineType,
            plotType: plotType,
            label: manualTitle   // si es cadena vacía, lo ignoraremos más abajo
        });

    } catch (error) {
        console.error("Error plotting manual data:", error);
        resultDiv.innerHTML = `<p style="color: red; font-weight: bold;">⚠️ Unable to process the data. Please check your input format.</p>`;
        resultDiv.classList.add('show');
    }
}



function drawContourPlot(x1, x2, zMatrix) {
    // 1) Generar nou plotId
    const plotId = `plot-${plotIdCounter++}`;
  
    // 2) Calcular etiqueta por defecto
    const yText = document.getElementById('yVar').selectedOptions[0].text;
    const x1Text = document.getElementById('xVar').selectedOptions[0].text;
    const x2Text = document.getElementById('xVar2').selectedOptions[0].text;
    const label = `${yText} / ${x1Text} & ${x2Text}`;
  
    // 3) Color
    const gradient = 'linear-gradient(90deg, #ffffcc, #a1dab4, #41b6c4, #2c7fb8, #253494)';
    activePlots.push({
      plotId,
      type: 'contour',
      x1, x2, z: zMatrix,
      label,
      color: gradient
    });
  
    // 5) Re-renderitzar tot
    renderAll();
    updatePlotListUI();
  }
  


// Interactive multi-plot with zoom, grid, tooltip, overlay & removal
let activePlots = [];
const defaultColors = [
  "steelblue", "crimson", "purple", "seagreen", "goldenrod",
  "orange", "royalblue", "orchid", "darkcyan", "tomato"
];
let colorIndex = 0;
let plotIdCounter = 1;


function initializeChart() {
  const plotOutput = d3.select('#plot-output');
  plotOutput.html(''); // Limpia contenido previo

  const plotWrapper = plotOutput
    .append('div')
    .attr('id', 'plot-wrapper')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('align-items', 'center')
    .style('width', '100%')
    .style('height', '100%'); 

  const outer = plotWrapper
    .append('div')
    .attr('id', 'plot-layout')
    .style('display', 'flex')
    .style('gap', '20px')
    .style('align-items', 'stretch')
    .style('flex-wrap', 'nowrap')
    .style('height', '100%');


  const container = outer
    .append('div')
    .attr('class', 'plot-container')
    .style('flex', '1 1 100%')
    .style('min-width', '400px')
    .style('position', 'relative')
    .style('width', '100%')         
    .style('height', '100%');

  // Contenedor de la metadata
  container.append('div')
    .attr('id', 'plot-meta-info')
    .style('position', 'absolute')
    .style('top', '80px') 
    .style('right', '330px')
    .style('background', 'rgba(50,50,50,0.95)')
    .style('color', 'white')
    .style('padding', '10px 16px')
    .style('border-radius', '10px')
    .style('font-size', '0.9em')
    .style('max-width', '280px')
    .style('line-height', '1.5em')
    .style('z-index', '10')
    .style('opacity', '0')
    .style('transform', 'scale(0.95)')
    .style('transition', 'opacity 250ms ease, transform 250ms ease')
    .style('display', 'none');

    
  // Contenedor de la lista de plots
  container.append('div')
    .attr('id', 'plot-list')
    .style('position', 'absolute')
    .style('top', '80px')
    .style('right', '50px')
    .style('background', 'rgba(255, 255, 255, 0)')
    .style('border', '1px solid #ccc')
    .style('padding', '10px 0px 10px 10px')
    .style('border-radius', '0px')
    .style('max-height', '60%')
    .style('overflow-y', 'auto')
    .style('z-index', '10')
    .style('min-width', '250px');

  // SVG
  const margin = { top: 70, right: 30, bottom: 100, left: 100 };
  // Mida gràfic
  const width = 1200
  const height = 850;

  const svg = container.append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('width', '100%')
    .style('height', '100%');

  svg.append('line')
    .attr('x1', margin.left).attr('x2', width - margin.right)
    .attr('y1', height - margin.bottom).attr('y2', height - margin.bottom)
    .attr('stroke', 'black');
  svg.append('line')
    .attr('x1', margin.left).attr('x2', margin.left)
    .attr('y1', margin.top).attr('y2', height - margin.bottom)
    .attr('stroke', 'black');
  window.__xAxisBaseLine = svg.append('line')
  .attr('x1', margin.left).attr('x2', width - margin.right)
  .attr('y1', height - margin.bottom).attr('y2', height - margin.bottom)
  .attr('stroke', 'black');

    

  window.__svg = svg;
  window.__g = svg.append('g')
    .attr('class', 'main-group')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  window.__innerWidth = width - margin.left - margin.right;
  window.__innerHeight = height - margin.top - margin.bottom;
  window.__xScale = d3.scaleLinear().range([0, window.__innerWidth]);
  window.__yScale = d3.scaleLinear().range([window.__innerHeight, 0]);

  window.__gridX = window.__g.append('g')
    .attr('class', 'grid-x')
    .attr('transform', `translate(0,${window.__innerHeight})`);
  window.__gridY = window.__g.append('g').attr('class', 'grid-y');
  window.__gX = window.__g.append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', `translate(0,${window.__innerHeight})`);
  window.__gY = window.__g.append('g').attr('class', 'axis y-axis');

  // Etiqueta de cada eix
  window.__g.append('text')
    .attr('class', 'x-axis-label')
    .attr('text-anchor', 'middle')
    .attr('x', window.__innerWidth / 2 - 10)
    .attr('y', window.__innerHeight + 65) // Posició
    .style('font-size', '25px')
    .style('font-weight', 'bold')
    .text('');
  window.__g.append('text')
    .attr('class', 'y-axis-label')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .attr('x', -window.__innerHeight / 2)
    .attr('y', -60)
    .style('font-size', '25px')
    .style('font-weight', 'bold')
    .text('');

  const defs = svg.append('defs');
  defs.append('linearGradient')
    .attr('id', 'contour-gradient')
    .attr('x1', '0%').attr('y1', '100%')
    .attr('x2', '0%').attr('y2', '0%')
    .selectAll('stop')
    .data([
      { offset: '0%', color: '#ffeda0' },
      { offset: '25%', color: '#feb24c' },
      { offset: '50%', color: '#fd8d3c' },
      { offset: '75%', color: '#f03b20' },
      { offset: '100%', color: '#bd0026' }
    ])
    .enter().append('stop')
    .attr('offset', d => d.offset)
    .attr('stop-color', d => d.color);

  defs.append('clipPath')
    .attr('id', 'plot-area-clip')
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', window.__innerWidth)
    .attr('height', window.__innerHeight);

  window.__content = window.__g.append('g')
    .attr('class', 'content')
    .attr('clip-path', 'url(#plot-area-clip)');
  window.__lineLayer = window.__g.append('g')
    .attr('class', 'line-layer')
    .attr('clip-path', 'url(#plot-area-clip)');
  window.__pointLayer = window.__g.append('g')
    .attr('class', 'point-layer');

  window.__tooltip = plotWrapper.append('div')
    .attr('class', 'tooltip')
    .style('position', 'absolute')
    .style('background', 'rgba(0,0,0,0.75)')
    .style('color', 'white')
    .style('padding', '5px 10px')
    .style('border-radius', '5px')
    .style('pointer-events', 'none')
    .style('opacity', 0);

  const controlsWrapper = plotWrapper
    .append('div')
    .attr('id', 'plot-controls-wrapper')
    .style('display', 'flex')
    .style('justify-content', 'center')
    .style('width', '100%');

  const controls = controlsWrapper.append('div')
    .attr('id', 'plot-controls')
    .style('display', 'flex')
    .style('justify-content', 'center')
    .style('align-items', 'center')
    .style('gap', '20px')
    .style('margin-top', '12px')
    .style('flex-wrap', 'wrap');

  controls.append('button')
    .attr('type', 'button')
    .attr('class', 'reset-zoom-button')
    .text('Reset Zoom')
    .on('click', resetZoom);

  controls.append('button')
    .attr('type', 'button')
    .attr('class', 'reset-zoom-button')
    .text('Clear All Plots')
    .on('click', () => {
      activePlots = [];
      colorIndex = 0;
      updatePlotListUI();
      renderAll();
      const infoBox = document.getElementById('plot-meta-info');
      if (infoBox) infoBox.style.display = 'none';
    });

  controls.append('label')
    .html('<input type="checkbox" id="toggleGrid" checked> Show grid');
  controls.append('label')
    .html('<input type="checkbox" id="togglePoints"> Show points');

  window.__zoom = d3.zoom().scaleExtent([1, 10]).on('zoom', zoomed);
  window.__svg.call(window.__zoom);

  d3.select('#toggleGrid').on('change', () =>
    zoomed({ transform: d3.zoomTransform(window.__svg.node()) })
  );
  d3.select('#togglePoints').on('change', () =>
    zoomed(window.__lastZoomEvent || { transform: d3.zoomTransform(window.__svg.node()) })
  );

  // Efecte botó Reset Zoom & Clear All Plots
  controls.selectAll('button').each(function() {
    const btn = d3.select(this);
    const originalClick = btn.on('click');
    btn.on('click', function(event, d) {
      btn.classed('clicked', true);
      setTimeout(() => btn.classed('clicked', false), 60);
      if (originalClick) originalClick.call(this, event, d);
    });
  });


  updatePlotListUI();
}



function resetZoom() {
    if (!activePlots.length) return;
  
    // Reunir todo x,y
    let xAll = [], yAll = [];
    activePlots.forEach(p => {
      if (p.type === 'contour') {
        xAll = xAll.concat(p.x1);
        yAll = yAll.concat(p.x2);
      } else {
        xAll = xAll.concat(p.x);
        yAll = yAll.concat(p.y);
      }
    });
  
    const xExt = d3.extent(xAll);
    const yExt = d3.extent(yAll);
  
    window.__xScale.domain(xExt);
    window.__yScale.domain(yExt);
  
    window.__svg.transition().duration(750)
        .call(window.__zoom.transform, d3.zoomIdentity);
    setTimeout(() => zoomed({ transform: d3.zoomIdentity }), 750);
}
  



function zoomed(event) {
    const t = event.transform;
    window.__lastZoomEvent = event;

    // 1) Rescala los ejes
    const newX = t.rescaleX(window.__xScale);
    const newY = t.rescaleY(window.__yScale);

    // 2) Eixos amb la notació correspondent 
    const active = activePlots[activePlots.length - 1] || { plotType: 'linear' };
    //10^exponent
    const logFormat = d => {
        if (d <= 0 || isNaN(d)) return "";

        const exp = Math.log10(d);
        const rounded = Math.round(exp);

        // Solo mostrar potencias exactas
        if (Math.abs(exp - rounded) > 1e-6) return "";

        const superscripts = {
            "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³",
            "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹"
        };
        const expStr = rounded.toString().split("").map(c => superscripts[c] || "").join("");
        return `10${expStr}`;
    };


    const formatX = (active.plotType === "logX" || active.plotType === "logLog") ? logFormat : d3.format(".2f");
    const formatY = (active.plotType === "logY" || active.plotType === "logLog") ? logFormat : d3.format(".2f");


    window.__gX.call(
      d3.axisBottom(newX)
        .ticks(6)
        .tickFormat(formatX)
    ).select('.domain').remove();

    // Mida valor eixos
    window.__gX.selectAll("text")
      .style("font-size", "18px");

    window.__gY.call(
      d3.axisLeft(newY)
        .ticks(6)
        .tickFormat(formatY)
    ).select('.domain').remove();

    window.__gY.selectAll("text")
      .style("font-size", "18px");


    // 3) Grid toggle
    if (d3.select('#toggleGrid').property('checked')) {
        const xTicks = newX.ticks();
        const yTicks = newY.ticks();

        // Vertical lines
        window.__gridX.selectAll('line')
            .data(xTicks)
            .join('line')
            .attr('x1', d => newX(d))
            .attr('x2', d => newX(d))
            .attr('y1', 0)
            .attr('y2', -window.__innerHeight)
            .attr('stroke', '#ddd')
            .attr('stroke-dasharray', '2,2');

        // Horizontal lines
        window.__gridY.selectAll('line')
            .data(yTicks)
            .join('line')
            .attr('x1', 0)
            .attr('x2', window.__innerWidth)
            .attr('y1', d => newY(d))
            .attr('y2', d => newY(d))
            .attr('stroke', '#ddd')
            .attr('stroke-dasharray', '2,2');
    } else {
        window.__gridX.selectAll('line').remove();
        window.__gridY.selectAll('line').remove();
    }

    // 4) Aplica el mismo transform a todas las capas
    window.__lineLayer.attr('transform', t);    // líneas (clip-path)
    window.__content.attr('transform', t);      // contours (clip-path)
    window.__pointLayer.attr('transform', t);   // puntos (sin clip)

    // 5) Ajusta grosores de línea según zoom
    const scaleFactor = 1 / t.k;
    d3.selectAll('path.line')
      .attr('stroke-width', 2 * scaleFactor);

    // 6) Ajusta radios y visibilidad de puntos
    const showPoints = d3.select('#togglePoints').property('checked') ? 'visible' : 'hidden';
    d3.selectAll('circle.point')
      .attr('r', 4 * scaleFactor)
      .attr('visibility', showPoints);
}




function renderAll() {
    if (!window.__svg /*|| !window.__content*/) return;
  
    // 1) Si no hay plots, limpiar y dibujar grid
    if (activePlots.length === 0) {
      window.__lineLayer.selectAll('*').remove();
      window.__pointLayer.selectAll('*').remove();
      window.__content.selectAll('*').remove();
      drawDefaultGrid();

      updatePlotListUI();
      return;
    }

  
    // 2) Mostrar contenedores
    d3.select('#plot-container').style('display', 'block');
    d3.select('#plot-controls-wrapper').style('display', 'flex');
  
    
    // ─── Escalas LINEALES o LOG ────────────────────────────
    let xVals = [], yVals = [];
    activePlots.forEach(p => {
      if (p.type === 'contour') {
        xVals.push(...p.x1);
        yVals.push(...p.x2);
      } else {
        xVals.push(...p.x);
        yVals.push(...p.y);
      }
    });

    // dominio mínimo y máximo sobre datos transformados (pueden ser negativos)
    const xExtent = d3.extent(xVals);
    const yExtent = d3.extent(yVals);


    // Decide si cada eje debe ser log
    const xIsLog = activePlots.some(p =>
      p.plotType === 'log'     ||
      p.plotType === 'logX'    ||
      p.plotType === 'logLog'
    );
    const yIsLog = activePlots.some(p =>
      p.plotType === 'log'     ||
      p.plotType === 'logY'    ||
      p.plotType === 'logLog'
    );

    // Asegúrate de que los dominios log sean > 0
    const xDomain = xExtent;
    const yDomain = yExtent;

    // Crea las escalas apropiadas
    window.__xScale = (xIsLog ? d3.scaleLog().domain(xDomain).range([ 0, window.__innerWidth ]) : d3.scaleLinear())
      .domain(xDomain)
      .range([ 0, window.__innerWidth ]);

    window.__yScale = (yIsLog ? d3.scaleLog().domain(xDomain).range([ window.__innerHeight, 0 ]) : d3.scaleLinear())
      .domain(yDomain)
      .range([ window.__innerHeight, 0 ]);

  
    // 4) Reset zoom y redraw ejes/grids
    window.__svg.call(window.__zoom.transform, d3.zoomIdentity);
    setTimeout(() => zoomed({ transform: d3.zoomIdentity }), 0);
  
    // 5) Dibujar los line plots
    const linePlots = activePlots.filter(p => p.type !== 'contour');
    const lineGroups = window.__lineLayer.selectAll('.plot-group')
        .data(linePlots, d => d.plotId);

    const lineEnter = lineGroups.enter()
      .append('g').attr('class', d => `plot-group ${d.plotId}`);
    lineEnter.append('path').attr('class', 'line');
    lineEnter.append('g').attr('class', 'points');
  
    lineGroups.merge(lineEnter).each(function(d) {
      const g = d3.select(this);
      const lineGen = d3.line()
        .curve(d3.curveLinear)
        .x((_, i) => window.__xScale(d.x[i]))
        .y((_, i) => window.__yScale(d.y[i]));
  
      const dashMap = {
        solid:   '',
        dashed:  '6,4',
        dotted:  '2,4',
        'dot-dash': '4,2,2,2'
      };
      // Config linea
      const baseWidth = 1200;
      const scaleFactor = window.__innerWidth / baseWidth;

      g.select('path.line')
        .datum(d.y)
        .attr('fill', 'none')
        .attr('stroke', d.color)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', dashMap[d.dashStyle] || '')
        .attr('d', lineGen);

      // Config puntos
      const pts = window.__pointLayer.selectAll(`.point-${d.plotId}`)
          .data(d.x.map((xVal,i) => ({ x:xVal, y:d.y[i], plotId:d.plotId })));

      pts.enter().append('circle')
        .attr('class', p => `point point-${p.plotId}`)
        .merge(pts)
        .attr('r', 4)
        .attr('fill', d.color)
        .attr('cx', pt => window.__xScale(pt.x))
        .attr('cy', pt => window.__yScale(pt.y))
        .attr('visibility', d3.select('#togglePoints').property('checked') ? 'visible' : 'hidden')
        // Posició caixa punts
        .on('mouseover', (event, pt) => {
          const svgRect = window.__svg.node().getBoundingClientRect();
          const offsetX = 80;
          const offsetY = 50;

          const x = event.clientX - svgRect.left + offsetX;
          const y = event.clientY - svgRect.top - offsetY;

          window.__tooltip
            .html(`x: ${pt.x}<br>y: ${pt.y.toFixed(4)}`)
            .style('left', `${x}px`)
            .style('top', `${y}px`)
            .style('opacity', 1);
        })

        .on('mouseout', () => window.__tooltip.style('opacity', 0));
  
      pts.exit().remove();
    });
    lineGroups.exit().remove();
  
    // 6) Dibujar los contour plots
    const contours = activePlots.filter(p => p.type === 'contour');
    const contourGroups = window.__content.selectAll('.contour-group')
      .data(contours, d => d.plotId);
    const contourEnter = contourGroups.enter()
      .append('g').attr('class', d => `contour-group ${d.plotId}`);
  
    contourGroups.merge(contourEnter).each(function(p) {
      const g = d3.select(this);
      g.selectAll('rect').remove();
  
      const colorScale = d3.scaleSequential()
        .interpolator(d3.interpolateTurbo)
        .domain([d3.min(p.z.flat()), d3.max(p.z.flat())]);
  
      const xs = window.__xScale.copy();
      const ys = window.__yScale.copy();
      const dx = xs(p.x1[1]) - xs(p.x1[0]);
      const dy = ys(p.x2[0]) - ys(p.x2[1]);
  
      for (let i = 0; i < p.x1.length; i++) {
        for (let j = 0; j < p.x2.length; j++) {
          g.append('rect')
            .attr('x', xs(p.x1[i]))
            .attr('y', ys(p.x2[j]))
            .attr('width', dx)
            .attr('height', dy)
            .attr('fill', colorScale(p.z[i][j]))
            .attr('opacity', 0.7);
        }
      }
    });
    contourGroups.exit().remove();
  
    // 7) Colorbar (leyenda) para *todos* los contours
    if (contours.length) {
      d3.select('#contour-legend').remove();
      const allZ = contours.flatMap(p => p.z.flat());
      const zExt = d3.extent(allZ);
      const legendW = 20, legendH = 200;
      const offsetX = window.__innerWidth + 20;  // 20px de separación al plot
      const offsetY = 10;
  
      // Actualizar gradiente
      const stops = [
        { offset: '0%',   value: zExt[0] },
        { offset: '25%',  value: zExt[0] + (zExt[1]-zExt[0])*0.25 },
        { offset: '50%',  value: (zExt[0]+zExt[1])/2 },
        { offset: '75%',  value: zExt[0] + (zExt[1]-zExt[0])*0.75 },
        { offset: '100%', value: zExt[1] }
      ];
      const grad = d3.select('#contour-gradient');
      grad.selectAll('stop')
        .data(stops)
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d3.interpolateTurbo((d.value - zExt[0]) / (zExt[1] - zExt[0])));
  
      // Grupo leyenda
      const legendG = window.__svg.append('g')
        .attr('id', 'contour-legend')
        .attr('transform', `translate(${offsetX},${offsetY})`);
  
      legendG.append('rect')
        .attr('width', legendW)
        .attr('height', legendH)
        .style('fill', 'url(#contour-gradient)');
  
      const zScale = d3.scaleLinear().domain(zExt).range([legendH, 0]);
      legendG.append('g')
        .attr('transform', `translate(${legendW},0)`)
        .call(d3.axisRight(zScale).ticks(5));
    }
    else {
      d3.select('#contour-legend').remove(); // Borra la leyenda si ya no hay contour plots
    }


    // ─── Actualizar etiquetas de ejes según el último plot ────
    if (activePlots.length) {
    const last = activePlots[activePlots.length - 1],
      xKey = last.metadata?.xVar || document.getElementById('xVar').value,
      xLabel = axisLabelsMap[xKey] || xKey,
      yLabel = last.type === 'contour'
        ? (axisLabelsMap[document.getElementById('xVar2').value] || document.getElementById('xVar2').value)
        : document.getElementById('yVar')?.selectedOptions[0]?.text || 'Y';

      d3.select('.x-axis-label').text(xLabel);
      d3.select('.y-axis-label').text(yLabel);
    } else {
      d3.select('.x-axis-label').text('');
      d3.select('.y-axis-label').text('');
    }

    // ────────────────────────────────────────────────────────

  
    // 8) Actualizar leyenda de plots y controles
    updatePlotListUI();
    d3.select('#plot-controls-wrapper').style('display', 'flex');

    // Limpiar puntos de plots eliminados
    window.__pointLayer.selectAll('.point')
        .filter(p => !activePlots.find(ap => ap.plotId === p.plotId))
        .remove();

}
  
  
  
function drawInteractivePlot(x, y, opts) {
    opts = opts || {};
    const plotId = `plot-${plotIdCounter++}`;

    // 1) Etiqueta
    let label = opts.label && opts.label.length > 0
      ? opts.label
      : `${document.getElementById('yVar')?.selectedOptions[0]?.text || 'Y'} / ${document.getElementById('xVar')?.selectedOptions[0]?.text || 'X'}`;

    const color = opts.color && opts.color.trim() !== ""
  ? opts.color
  : defaultColors[colorIndex++ % defaultColors.length];
    const dashStyle= opts.lineType  || 'solid';
    const plotType = opts.plotType  || 'linear';

    // 2) Copia datos originales
    let xCopy = [];
    let yCopy = [];

    for (let i = 0; i < x.length; i++) {
        const xi = x[i];
        const yi = y[i];
        if (  // descarta punts no vàlids pel Log
            (plotType === 'logX' || plotType === 'logLog') && xi <= 0
            || (plotType === 'logY' || plotType === 'logLog') && yi <= 0
        ) {
            continue; // descarta punto no válido
        }
        xCopy.push(xi);
        yCopy.push(yi);
    }


    // 3) Log if needed
/*     if (plotType === 'logX' || plotType === 'logLog') {
        xCopy = xCopy.map(v => Math.log10(v));
    }
    if (plotType === 'logY' || plotType === 'logLog') {
        yCopy = yCopy.map(v => Math.log10(v));
    } */

    // 4) Guarda los datos ya transformados en activePlots
    activePlots.push({
      plotId,
      x: xCopy,
      y: yCopy,
      color,
      dashStyle,
      label,
      plotType,
      metadata: opts.metadata || {}
    });

    renderAll();
}



function updatePlotListUI() {
    const container = document.getElementById('plot-list');
    if (!container) return;

    container.innerHTML = ''; // Neteja tot

    const title = document.createElement('h4');
    title.textContent = 'Active plots:';
    container.appendChild(title);

    if (activePlots.length === 0) return;

    activePlots.forEach(p => {
        const item = document.createElement('div');
        item.className = `legend-item ${p.plotId}`;
        item.dataset.plotId = p.plotId;
        item.style.margin = '5px 0';
        item.style.cursor = 'pointer';
        item.style.display = 'grid';
        item.style.gridTemplateColumns = '20px 1fr auto';
        item.style.alignItems = 'center';
        item.style.columnGap = '10px';
        item.style.transition = 'transform 0.3s ease';
        item.style.paddingLeft = '12px';
        item.style.width = 'calc(100% - 20px)';
        item.style.boxSizing = 'border-box';
        item.style.paddingRight = '10px';

        const colorBox = document.createElement('span');
        colorBox.style.display = 'inline-block';
        colorBox.style.width = '15px';
        colorBox.style.height = '15px';
        if (p.type === 'contour') {
            colorBox.style.background = 'none';
            colorBox.style.backgroundImage = p.color;
        } else {
            colorBox.style.background = p.color;
        }

        const textSpan = document.createElement('span');
        textSpan.textContent = p.label;
        textSpan.style.wordBreak = 'break-word';
        textSpan.addEventListener('dblclick', () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = p.label;
            input.style.width = '100%';
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') input.blur();
            });
            input.addEventListener('blur', () => {
                const newLabel = input.value.trim();
                if (newLabel) p.label = newLabel;
                updatePlotListUI();
            });
            textSpan.replaceWith(input);
            input.focus();
        });

        const btn = document.createElement('button');
        btn.innerHTML = '&times;';
        btn.type = 'button';
        btn.onclick = () => removePlot(p.plotId);

        // Estil creu
        btn.style.width = '22px';
        btn.style.height = '22px';
        btn.style.border = '1.5px solid black';
        btn.style.borderRadius = '50%';
        btn.style.background = 'transparent';
        btn.style.color = 'black';
        btn.style.fontSize = '14px';
        btn.style.fontWeight = 'normal';
        btn.style.cursor = 'pointer';
        btn.style.lineHeight = '1';
        btn.style.textAlign = 'center';
        btn.style.padding = '0';
        btn.style.marginRight = '8px';



        item.appendChild(colorBox);
        item.appendChild(textSpan);
        item.appendChild(btn);
        container.appendChild(item);

        item.addEventListener('mouseover', () => highlightPlot(p.plotId, true));
        item.addEventListener('mouseout', () => highlightPlot(p.plotId, false));

        item.addEventListener('mouseenter', () => {
          const infoBox = document.getElementById('plot-meta-info');
          if (!activePlots.find(ap => ap.plotId === p.plotId)) {
            if (infoBox) infoBox.style.display = 'none';
            return;
          }

          const meta = p.metadata || {};
          const lines = [];

          if (meta.typeModulation) lines.push(`Type: ${meta.typeModulation}`);
          if (meta.xVar !== 'M' && meta.M !== undefined) lines.push(`Modulation: ${meta.M}`);
          if (meta.xVar !== 'SNR' && meta.SNR !== undefined) lines.push(`SNR: ${meta.SNR}`);
          if (meta.xVar !== 'Rate' && meta.Rate !== undefined) lines.push(`Rate: ${meta.Rate}`);
          if (meta.xVar !== 'N' && meta.N !== undefined) lines.push(`Quadrature: ${meta.N}`);
          if (meta.xVar !== 'n' && meta.n !== undefined) lines.push(`Code Length: ${meta.n}`);
          if (meta.xVar !== 'th' && meta.th !== undefined) lines.push(`Threshold: ${meta.th}`);

          if (infoBox) {
            infoBox.innerHTML = lines.map(l => `<div>${l}</div>`).join('');
            infoBox.style.display = 'block';
            requestAnimationFrame(() => {
              infoBox.style.opacity = '1';
              infoBox.style.transform = 'scale(1)';
            });
          }
        });

        item.addEventListener('mouseleave', () => {
          const infoBox = document.getElementById('plot-meta-info');
          if (infoBox) {
            infoBox.style.opacity = '0';
            infoBox.style.transform = 'scale(0.95)';
            setTimeout(() => {
              infoBox.style.display = 'none';
            }, 250);
          }
        });

    });
}



function removePlot(plotId) {
    const removedPlot = activePlots.find(p => p.plotId === plotId);
    activePlots = activePlots.filter(p => p.plotId !== plotId);

    //Limpia leyenda visual antes de cualquier render
    updatePlotListUI();

    const hoveredItem = document.querySelector(`.legend-item.${plotId}:hover`);
    if (hoveredItem) {
        const infoBox = document.getElementById('plot-meta-info');
        if (infoBox) infoBox.style.display = 'none';
    }

    // Treu metadata
    const infoBox = document.getElementById('plot-meta-info');
    if (infoBox) infoBox.style.display = 'none';

    renderAll();
    if (activePlots.length === 0) {
      colorIndex = 0;
    }


    if (activePlots.length === 0 && window.__content) {
        window.__content.selectAll('*').remove();
        d3.select('#contour-legend').remove();
        drawDefaultGrid(removedPlot?.plotType === 'log');
    }

}


function highlightPlot(plotId, highlight) {
    const group = d3.select(`.plot-group.${plotId}`);
    if (!group.empty()) {
        group.select('path.line')
            .transition().duration(250)
            .attr('stroke-width', highlight ? 4 : 2)
            .attr('opacity', highlight ? 1 : 0.8);
        group.selectAll('circle')
            .transition().duration(250)
            .attr('r', highlight ? 6 : 4)
            .attr('opacity', highlight ? 1 : 0.8);
    }

    const legendItem = document.querySelector(`.legend-item.${plotId}`);
    if (legendItem) {
        legendItem.style.fontWeight = highlight ? 'bold' : 'normal';
        legendItem.style.transform = highlight ? 'scale(1.03)' : 'scale(1)';
    }
}

function drawDefaultGrid(forceLog = false) {
    const useLog = forceLog;

    window.__xScale = (useLog ? d3.scaleLog() : d3.scaleLinear()).range([0, window.__innerWidth]);
    window.__yScale = (useLog ? d3.scaleLog() : d3.scaleLinear()).range([window.__innerHeight, 0]);

    const defaultMin = useLog ? -10 : -10;
    const defaultMax = 10;

    window.__xScale.domain([defaultMin, defaultMax]);
    window.__yScale.domain([defaultMin, defaultMax]);

    document.getElementById('toggleGrid')?.setAttribute('checked', 'true');
    zoomed({ transform: d3.zoomIdentity });
}


// ------------------------ CHATBOT SCRIPT -----------------------------------
function sendMessage() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    const chatBox = document.getElementById('chat-messages');

    const userMsg = document.createElement('div');
    userMsg.className = 'chat-bubble user';
    userMsg.textContent = msg;
    chatBox.appendChild(userMsg);

    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    fetch('/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
    })
    .then(res => res.json())
    .then(data => {
        const botMsg = document.createElement('div');
        botMsg.className = 'chat-bubble bot';
        botMsg.textContent = data.response;
        chatBox.appendChild(botMsg);
        chatBox.scrollTop = chatBox.scrollHeight;

        // --- NEW: Fill input fields if parameters are present ---
        if (data.parameters) {
            if (data.parameters.modulation !== undefined) document.getElementById('M').value = data.parameters.modulation;
            // Accept both typeModulation, typeM, or modulation for robustness
            const typeMod = data.parameters.typeModulation || data.parameters.typeM || data.parameters.modulation;
            if (typeMod !== undefined) {
                // If it's in the form '2-PAM' or '16-QAM', split it
                const match = /^([0-9]+)[- ]?([A-Za-z]+)$/i.exec(typeMod);
                if (match) {
                    document.getElementById('M').value = match[1];
                    document.getElementById('TypeModulation').value = match[2].toUpperCase();
                } else {
                    // fallback: just set the type if not in '2-PAM' format
                    document.getElementById('TypeModulation').value = typeMod.toUpperCase(); // todo buggy
                }
            }
            const safelySetValue = (id, value) => {
                const element = document.getElementById(id);
                if (element) {
                    element.value = value;
                } else {
                // This message will appear in the F12 Developer Console if an ID is wrong.
                console.warn(`Warning: HTML element with id="${id}" was not found.`);
            }
            };

            if (!('x' in data.parameters)){ // not plot mode
                safelySetValue('SNR',data.parameters.snr);
                safelySetValue('R',data.parameters.rate);
                safelySetValue('N',data.parameters.quadrature_nodes);
                safelySetValue('n',data.parameters.n);

                document.querySelector('button.compute-error').click();
            }
            /*
            if (data.parameters.snr !== undefined) document.getElementById('SNR').value = data.parameters.snr;
            if (data.parameters.rate !== undefined) document.getElementById('R').value = data.parameters.rate;
            if (data.parameters.quadrature_nodes !== undefined) document.getElementById('N').value = data.parameters.quadrature_nodes;
            if (data.parameters.n !== undefined) document.getElementById('n').value = data.parameters.n;
            if (data.parameters.th !== undefined) document.getElementById('th').value = data.parameters.th;
            */
            else{ // plot mode
                // Update the plot variables
                safelySetValue('SNR',data.parameters.SNR);
                safelySetValue('R',data.parameters.Rate);

                safelySetValue('N',data.parameters.quadrature_nodes);
                //safelySetValue('N',data.parameters.N);

                safelySetValue('xVar', data.parameters.x.toLowerCase());
                if (data.parameters.y.toLowerCase() ==! 'n'){
                    safelySetValue('yVar', data.parameters.y.toLowerCase());
                }
                else{
                    safelySetValue('yVar', data.parameters.y);
                }
                safelySetValue('points', data.parameters.points);

                // Update the range fields using their unique IDs
                safelySetValue('xRange', `${data.parameters.min},${data.parameters.max}`);

                document.querySelector('button[type="button"][onclick*="plotFromFunction"]').click();
            }


        }
    })
    .catch(err => {
        const errMsg = document.createElement('div');
        errMsg.className = 'chat-bubble error';
        errMsg.textContent = "⚠️ Error: " + err.message;
        chatBox.appendChild(errMsg);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

function clearChat() {
    const chatBox = document.getElementById('chat-messages');
    chatBox.innerHTML = ''; // Borra todo el historial de mensajes
}

// ------------------------ Funcions auxiliars pel html -----------------------------------
/* Hide and Show Manual Inputs ---> Unused*/
function toggleManualInputs() {
    const manual = document.getElementById('manual-section');
    const btn = document.getElementById('toggleManualBtn');
    const visible = manual.style.display === 'block';
    manual.style.display = visible ? 'none' : 'block';
    btn.textContent = visible ? 'Add manually' : 'Hide manual inputs';
}

// Contour plot case
function onLineTypeChange() {
    const plotType = document.getElementById("plotType").value;
    const x2Group = document.getElementById("x2-group");
    const xRange2Group = document.getElementById("xRange2-group");
    const xPoints2Group = document.getElementById("xPoints2-group");

    if (plotType === "contour") {
        x2Group.style.display = "flex";
        xRange2Group.style.display = "flex";
        xPoints2Group.style.display = "flex";
    } else {
        x2Group.style.display = "none";
        xRange2Group.style.display = "none";
        xPoints2Group.style.display = "none";
    }
}
    // Sidebar toggle functionality
    let leftCollapsed = false;
    let rightCollapsed = false;

function toggleLeftSidebar() {
  const sidebar = document.getElementById('left-sidebar');
  const toggle = sidebar.querySelector('.toggle-icon');

  leftCollapsed = !leftCollapsed;
  sidebar.classList.toggle('collapsed');
  document.body.classList.toggle('left-collapsed', leftCollapsed);

  if (leftCollapsed) {
    toggle.textContent = '▶';
    setTimeout(() => createExternalToggle('left'), 300);
  } else {
    toggle.textContent = '◀';
    removeExternalToggle('left');
  }

  setTimeout(adjustPlotWidthBasedOnSidebar, 100); 
}

function toggleRightSidebar() {
  const sidebar = document.getElementById('right-sidebar');
  const toggle = sidebar.querySelector('.toggle-icon');

  rightCollapsed = !rightCollapsed;
  sidebar.classList.toggle('collapsed');

  if (rightCollapsed) {
    toggle.textContent = '◀';
    setTimeout(() => createExternalToggle('right'), 300); 
  } else {
    toggle.textContent = '▶';
    removeExternalToggle('right');
  }

  setTimeout(adjustPlotWidthBasedOnSidebar, 100);
}



function createExternalToggle(side) {
  const mainLayout = document.querySelector('.main-layout');
  const sidebar    = document.getElementById(side === 'left' ? 'left-sidebar'
                                                             : 'right-sidebar');
  const header     = sidebar.querySelector('.sidebar-header');
  const toggleBtn  = document.createElement('button');

  toggleBtn.className = `external-toggle external-${side}-toggle`;
  toggleBtn.innerHTML = side === 'left' ? '▶' : '◀';
  toggleBtn.onclick   = side === 'left' ? toggleLeftSidebar : toggleRightSidebar;

  Object.assign(toggleBtn.style, {
    position:  'absolute',
    top:       `10px`,    // MOD --> He tret pq es veia raro un cop replegat...
    [side]:    '15px',
    background:'#DCDCDC',
    color:     '#666',
    border:    'none',
    width:     '20px',
    height:    '20px',
    cursor:    'pointer',
    zIndex:    '1000',
    fontSize:  '10px',
    display:   'flex',
    alignItems:'center',
    justifyContent:'center',
    borderRadius:'3px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  });

  mainLayout.appendChild(toggleBtn);
}

function removeExternalToggle(side) {
  const existingToggle = document.querySelector(`.external-${side}-toggle`);
  if (existingToggle) {
    existingToggle.remove();
  }
}

function toggleAdvancedParams() {
  const toggle = document.querySelector('.advanced-toggle');
  const section = document.getElementById('advanced-params');

  const isOpen = section.classList.contains('show');
  toggle.classList.toggle('open', !isOpen);
  section.classList.toggle('show', !isOpen);
}

function toggleAdditionalParams() {
  const toggle = document.querySelector('.additional-toggle');
  const section = document.getElementById('additional-params');

  const isOpen = section.classList.contains('show');
  toggle.classList.toggle('open', !isOpen);
  section.classList.toggle('show', !isOpen);
}

function showPlotWarningModal(onConfirm) {
  const modal = document.getElementById('plot-warning-modal');
  modal.style.display = 'flex';

  const cancelBtn = document.getElementById('cancelWarningBtn');
  const confirmBtn = document.getElementById('confirmWarningBtn');
  const checkbox = document.getElementById('suppressWarningCheckbox');

  function close() {
      modal.style.display = 'none';
      cancelBtn.removeEventListener('click', onCancel);
      confirmBtn.removeEventListener('click', onContinue);
  }

  function onCancel() {
      close();
  }

  function onContinue() {
      if (checkbox.checked) skipPlotWarning = true;
      close();
      onConfirm();
  }

  cancelBtn.addEventListener('click', onCancel);
  confirmBtn.addEventListener('click', onContinue);
}

/* Clear all plots del WARNING */
function clearAllPlots() {
  activePlots = [];
  colorIndex = 0;
  updatePlotListUI();
  renderAll();
  const infoBox = document.getElementById('plot-meta-info');
  if (infoBox) infoBox.style.display = 'none';
}
// Efecte clic botons + colors plots
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.add('clicked');
      setTimeout(() => btn.classList.remove('clicked'), 60); // efecto corto
    });
  });
  const colorSelect = document.getElementById('lineColor');
  if (colorSelect) {
    colorSelect.dataset.userModified = "";  // marcador inicial
    colorSelect.addEventListener('change', () => {
      colorSelect.dataset.userModified = "true";  // solo si el usuario lo toca
    });
  }
});

// Ajusta el ancho del plot según el estado de los sidebars
function adjustPlotWidthBasedOnSidebar() {
  const leftCollapsed = document.getElementById('left-sidebar')?.classList.contains('collapsed');
  const rightCollapsed = document.getElementById('right-sidebar')?.classList.contains('collapsed');

  let newWidth = 1200;
  if (leftCollapsed && rightCollapsed) {
    newWidth = 1700;
  } else if (leftCollapsed || rightCollapsed) {
    newWidth = 1400;
  }

  const height = 850;
  const svg = d3.select("#plot-output svg");
  if (!svg.empty()) {
    svg.attr("viewBox", `0 0 ${newWidth} ${height}`);

    // ACTUALIZAR DIMENSIONES INTERNAS DEL PLOT
    window.__innerWidth = newWidth - 100 - 30;
    window.__xScale.range([0, window.__innerWidth]);
    if (window.__xAxisBaseLine) {
      window.__xAxisBaseLine
        .attr('x2', newWidth - 30); // margin.right
    }


    // Actualizar el clipPath del contenido
    d3.select("#plot-area-clip rect")
      .attr("width", window.__innerWidth);

    // Reposiciona ejes
    if (window.__gridX) window.__gridX.attr("transform", `translate(0,${window.__innerHeight})`);
    if (window.__gX) {
      window.__gX
        .attr("transform", `translate(0,${window.__innerHeight})`)
        .call(d3.axisBottom(window.__xScale)); // 🔥 fuerza eje completo
    }


    renderAll();
    resetZoom();
    setTimeout(() => zoomed({ transform: d3.zoomTransform(window.__svg.node()) }), 10);

  }
}

// Inicializa el gráfico al cargar la página
function plotInitialGraph() {
  const payload = {
    y: 'error_probability',
    x: 'n',
    rang_x: [1, 80],
    points: 50,
    typeModulation: 'PAM',
    M: 2,
    SNR: 2,
    Rate: 0.5,
    N: 20,
    th: 1e-6,
    n: 0,
    color: '',
    lineType: 'solid',
    plotType: 'linear'
    // NOTA: n NO debe enviarse porque es la variable x
  };

  fetch('/plot_function', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => {
      if (!res.ok) throw new Error("Error al cargar el gráfico inicial");
      return res.json();
    })
    .then(data => {
      const metadata = {
        M: 2,
        SNR: 2,
        Rate: 0.5,
        N: 20,
        th: 1e-6,
        typeModulation: 'PAM',
        xVar: 'n'
      };
      drawInteractivePlot(data.x, data.y, {
        color: '',
        lineType: 'solid',
        plotType: 'linear',
        metadata,
        label: 'Error Probability / n'
      });
    })
    .catch(err => console.error("Error al cargar el gráfico inicial:", err));

  lastYVar = 'ErrorProb';
  lastXVar = 'n';

}