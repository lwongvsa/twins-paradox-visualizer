import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SimulationParams, SimulationStep } from '../types';

interface Props {
  params: SimulationParams;
  step: SimulationStep;
  progress: number; // 0 to 1 representing progress within the step
  showAliceGrid: boolean;
}

const MinkowskiDiagram: React.FC<Props> = ({ params, step, progress, showAliceGrid }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });

  // Physics Calculations
  const v = params.velocity;
  const dist = params.distance;
  const gamma = 1 / Math.sqrt(1 - v * v);
  const bobTimeOneWay = dist / v;
  const aliceTimeOneWay = bobTimeOneWay / gamma;
  const totalBobTime = bobTimeOneWay * 2;
  
  // Update dimensions on resize
  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 500
        });
      }
    };
    window.addEventListener('resize', updateDims);
    updateDims();
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear canvas

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    // X axis: Distance (-1 to dist + 1)
    const xScale = d3.scaleLinear()
      .domain([-1, dist + 2])
      .range([0, width]);

    // Y axis: Time (-1 to totalBobTime + 2)
    const yScale = d3.scaleLinear()
      .domain([-1, totalBobTime + 2])
      .range([height, 0]);

    // Grid Helpers
    const drawSkewedGrid = (velocity: number, origin: {x: number, t: number}, color: string, opacity: number) => {
        const gammaFactor = 1 / Math.sqrt(1 - velocity * velocity);
        
        // Inverse transform: find min/max x' and t' visible in the viewport
        const inverseTransform = (x: number, t: number) => {
            const dx = x - origin.x;
            const dt = t - origin.t;
            return {
                xp: gammaFactor * (dx - velocity * dt),
                tp: gammaFactor * (dt - velocity * dx)
            };
        };

        const xDom = xScale.domain();
        const yDom = yScale.domain();
        const corners = [
            inverseTransform(xDom[0], yDom[0]),
            inverseTransform(xDom[1], yDom[0]),
            inverseTransform(xDom[1], yDom[1]),
            inverseTransform(xDom[0], yDom[1])
        ];

        const minXp = Math.floor(Math.min(...corners.map(c => c.xp)));
        const maxXp = Math.ceil(Math.max(...corners.map(c => c.xp)));
        const minTp = Math.floor(Math.min(...corners.map(c => c.tp)));
        const maxTp = Math.ceil(Math.max(...corners.map(c => c.tp)));

        // Transform (x', t') back to (x, t) for drawing
        const transform = (xp: number, tp: number) => ({
            x: origin.x + gammaFactor * (xp + velocity * tp),
            t: origin.t + gammaFactor * (tp + velocity * xp)
        });

        const gridG = g.append("g").attr("class", "alice-grid").style("opacity", opacity + 0.2); // Slightly more visible but thinner

        // Constant t' lines (Spatial axes for different times)
        // Only iterate integers
        for (let tp = minTp; tp <= maxTp; tp += 1) {
            const start = transform(minXp - 2, tp);
            const end = transform(maxXp + 2, tp);
            
            gridG.append("line")
                .attr("x1", xScale(start.x))
                .attr("y1", yScale(start.t))
                .attr("x2", xScale(end.x))
                .attr("y2", yScale(end.t))
                .attr("stroke", color)
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "3,3");

            // Label at x'=0 (Alice's worldline) if visible
            const labelPos = transform(0, tp);
            if (labelPos.x >= xDom[0] && labelPos.x <= xDom[1] && labelPos.t >= yDom[0] && labelPos.t <= yDom[1]) {
                gridG.append("text")
                    .attr("x", xScale(labelPos.x) + 4)
                    .attr("y", yScale(labelPos.t) - 2)
                    .attr("fill", color)
                    .attr("font-size", "10px")
                    .attr("font-weight", "bold")
                    .text(`${tp}`);
            }
        }

        // Constant x' lines (Time axes for different positions)
        for (let xp = minXp; xp <= maxXp; xp += 1) {
            const start = transform(xp, minTp - 2);
            const end = transform(xp, maxTp + 2);
            
            gridG.append("line")
                .attr("x1", xScale(start.x))
                .attr("y1", yScale(start.t))
                .attr("x2", xScale(end.x))
                .attr("y2", yScale(end.t))
                .attr("stroke", color)
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "3,3");

             // Label at t'=0 (Alice's x-axis) if visible
            const labelPos = transform(xp, 0);
            if (labelPos.x >= xDom[0] && labelPos.x <= xDom[1] && labelPos.t >= yDom[0] && labelPos.t <= yDom[1]) {
                gridG.append("text")
                    .attr("x", xScale(labelPos.x) + 2)
                    .attr("y", yScale(labelPos.t) + 10)
                    .attr("fill", color)
                    .attr("font-size", "10px")
                    .text(`x'=${xp}`);
            }
        }
    };

    // 0. Draw Alice's Grid if enabled
    if (showAliceGrid) {
        if (step === SimulationStep.SETUP || step === SimulationStep.OUTBOUND) {
            drawSkewedGrid(v, {x:0, t:0}, "#06b6d4", 0.3); // Cyan
        } else if (step === SimulationStep.INBOUND || step === SimulationStep.CONCLUSION) {
            drawSkewedGrid(-v, {x: dist, t: bobTimeOneWay}, "#8b5cf6", 0.3); // Violet
        } else if (step === SimulationStep.TURNAROUND) {
            // Show both during turnaround to emphasize the shift
            drawSkewedGrid(v, {x:0, t:0}, "#06b6d4", 0.2); 
            drawSkewedGrid(-v, {x: dist, t: bobTimeOneWay}, "#8b5cf6", 0.2);
        }
    }

    // 1. Grid & Axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    // Standard Grid lines (Bob)
    g.append("g")
      .attr("class", "grid opacity-10")
      .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(() => ""))
      .attr("transform", `translate(0,${height})`);
    
    g.append("g")
      .attr("class", "grid opacity-10")
      .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(() => ""));

    // Draw Axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .attr("color", "#94a3b8")
      .append("text")
      .attr("x", width)
      .attr("y", -10)
      .attr("fill", "#94a3b8")
      .text("Position (ly)");

    g.append("g")
      .call(yAxis)
      .attr("color", "#94a3b8")
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 20)
      .attr("fill", "#94a3b8")
      .text("Time (years)");

    // 2. Light Cones (45 degrees)
    const drawLightCone = (tx: number, ty: number) => {
      const size = 10;
      g.append("line")
        .attr("x1", xScale(tx))
        .attr("y1", yScale(ty))
        .attr("x2", xScale(tx + size))
        .attr("y2", yScale(ty + size))
        .attr("stroke", "#fbbf24") // Amber
        .attr("stroke-dasharray", "4")
        .attr("opacity", 0.5);
        
      g.append("line")
        .attr("x1", xScale(tx))
        .attr("y1", yScale(ty))
        .attr("x2", xScale(tx - size))
        .attr("y2", yScale(ty + size))
        .attr("stroke", "#fbbf24")
        .attr("stroke-dasharray", "4")
        .attr("opacity", 0.5);
        
      // Label for Light
      g.append("text")
        .attr("x", xScale(tx + 2))
        .attr("y", yScale(ty + 2) - 5)
        .attr("fill", "#fbbf24")
        .attr("transform", `rotate(-45, ${xScale(tx+2)}, ${yScale(ty+2)})`)
        .attr("font-size", "10px")
        .attr("opacity", 0.8)
        .text("Light Speed (c)");
    };
    drawLightCone(0, 0);

    // 3. Bob's World Line (Earth)
    g.append("line")
      .attr("x1", xScale(0))
      .attr("y1", yScale(0))
      .attr("x2", xScale(0))
      .attr("y2", yScale(totalBobTime))
      .attr("stroke", "#3b82f6") // Blue
      .attr("stroke-width", 3);

    g.append("text")
      .attr("x", xScale(0) - 10)
      .attr("y", yScale(totalBobTime) - 10)
      .attr("fill", "#3b82f6")
      .text("Bob (Earth)");

    // 4. Planet Line
    g.append("line")
      .attr("x1", xScale(dist))
      .attr("y1", yScale(0))
      .attr("x2", xScale(dist))
      .attr("y2", yScale(totalBobTime))
      .attr("stroke", "#94a3b8")
      .attr("stroke-dasharray", "2")
      .attr("opacity", 0.5);

    g.append("text")
      .attr("x", xScale(dist))
      .attr("y", yScale(-0.5))
      .attr("fill", "#94a3b8")
      .text("Planet");

    // 5. Alice's World Line Calculation
    const outboundEnd = { x: dist, t: bobTimeOneWay };
    const inboundEnd = { x: 0, t: totalBobTime };

    // Draw full path ghost
    g.append("path")
      .datum([{x:0, t:0}, outboundEnd, inboundEnd])
      .attr("fill", "none")
      .attr("stroke", "#ef4444") // Red
      .attr("stroke-width", 1)
      .attr("opacity", 0.3)
      .attr("d", d3.line<{x:number, t:number}>()
        .x(d => xScale(d.x))
        .y(d => yScale(d.t))
      );

    // 6. Dynamic Rendering based on Step
    let currentAlicePos = { x: 0, t: 0 };
    let showSimultaneity = false;
    let simultaneitySlope = 0; // Slope in t vs x: slope = v

    if (step === SimulationStep.SETUP) {
      currentAlicePos = { x: 0, t: 0 };
    } 
    else if (step === SimulationStep.OUTBOUND) {
      currentAlicePos = {
        x: dist * progress,
        t: bobTimeOneWay * progress
      };
      showSimultaneity = true;
      simultaneitySlope = v; // In x-ct units, slope is v
    } 
    else if (step === SimulationStep.TURNAROUND) {
      currentAlicePos = outboundEnd;
      // Show sweep
      showSimultaneity = true;
      // Interpolate slope from v to -v
      // Outbound slope: v
      // Inbound slope: -v
      const slopeStart = v;
      const slopeEnd = -v;
      simultaneitySlope = slopeStart + (slopeEnd - slopeStart) * progress;
    } 
    else if (step === SimulationStep.INBOUND) {
      currentAlicePos = {
        x: dist * (1 - progress),
        t: bobTimeOneWay + (bobTimeOneWay * progress)
      };
      showSimultaneity = true;
      simultaneitySlope = -v;
    } 
    else if (step === SimulationStep.CONCLUSION) {
      currentAlicePos = inboundEnd;
      showSimultaneity = false;
    }

    // Draw Alice's active path
    const pathData = [{x:0, t:0}];
    if (step === SimulationStep.OUTBOUND) {
      pathData.push(currentAlicePos);
    } else if (step === SimulationStep.TURNAROUND || step === SimulationStep.INBOUND || step === SimulationStep.CONCLUSION) {
      pathData.push(outboundEnd);
      if (step !== SimulationStep.TURNAROUND) {
        pathData.push(currentAlicePos);
      }
    }

    g.append("path")
      .datum(pathData)
      .attr("fill", "none")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 3)
      .attr("d", d3.line<{x:number, t:number}>()
        .x(d => xScale(d.x))
        .y(d => yScale(d.t))
      );

    // Draw Alice Dot
    g.append("circle")
      .attr("cx", xScale(currentAlicePos.x))
      .attr("cy", yScale(currentAlicePos.t))
      .attr("r", 6)
      .attr("fill", "#ef4444");

    // Draw Line of Simultaneity (Alice's "Now")
    if (showSimultaneity) {
      // Equation: t - t_alice = slope * (x - x_alice)
      // t_bob_intercept = t_alice - slope * x_alice
      const t_bob_intercept = currentAlicePos.t - simultaneitySlope * currentAlicePos.x;
      
      // Draw line from Alice to Bob's axis (and slightly beyond)
      g.append("line")
        .attr("x1", xScale(currentAlicePos.x))
        .attr("y1", yScale(currentAlicePos.t))
        .attr("x2", xScale(-0.5)) // Go a bit past Bob
        .attr("y2", yScale(currentAlicePos.t - simultaneitySlope * (currentAlicePos.x - (-0.5))))
        .attr("stroke", "#10b981") // Emerald
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5");

      // Mark the intercept on Bob's line
      g.append("circle")
        .attr("cx", xScale(0))
        .attr("cy", yScale(t_bob_intercept))
        .attr("r", 4)
        .attr("fill", "#10b981");
        
      g.append("text")
        .attr("x", xScale(0) - 90)
        .attr("y", yScale(t_bob_intercept) + 5)
        .attr("fill", "#10b981")
        .attr("font-size", "12px")
        .text(`Bob's Age: ${t_bob_intercept.toFixed(2)}y`);
      
      g.append("text")
        .attr("x", xScale(currentAlicePos.x) + 10)
        .attr("y", yScale(currentAlicePos.t) - 10)
        .attr("fill", "#ef4444")
        .attr("font-size", "12px")
        .text(`Alice Age: ${calculateAliceAge(step, progress, aliceTimeOneWay).toFixed(2)}y`);
    }

  }, [dimensions, params, step, progress, showAliceGrid]);

  const calculateAliceAge = (s: SimulationStep, p: number, oneWay: number) => {
    switch(s) {
      case SimulationStep.SETUP: return 0;
      case SimulationStep.OUTBOUND: return oneWay * p;
      case SimulationStep.TURNAROUND: return oneWay;
      case SimulationStep.INBOUND: return oneWay + (oneWay * p);
      case SimulationStep.CONCLUSION: return oneWay * 2;
      default: return 0;
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] bg-slate-900 rounded-xl border border-slate-700 shadow-xl overflow-hidden relative">
        <div className="absolute top-4 right-4 bg-slate-800/80 p-2 rounded text-xs text-slate-300 pointer-events-none z-10">
            Space-Time Diagram
        </div>
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="block" />
    </div>
  );
};

export default MinkowskiDiagram;