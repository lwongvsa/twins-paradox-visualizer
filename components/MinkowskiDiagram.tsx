import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SimulationParams, SimulationStep } from '../types';

interface Props {
  params: SimulationParams;
  step: SimulationStep;
  progress: number; // 0 to 1 representing progress within the step
  showAliceGrid: boolean;
  showBobSignals: boolean;
  showAliceSignals: boolean;
}

const MinkowskiDiagram: React.FC<Props> = ({ params, step, progress, showAliceGrid, showBobSignals, showAliceSignals }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  const [counts, setCounts] = useState({ bobReceivedByAlice: 0, aliceReceivedByBob: 0 });

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

    // Define Clip Path
    svg.append("defs").append("clipPath")
       .attr("id", "chart-clip")
       .append("rect")
       .attr("width", width)
       .attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([-1, dist + 2])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([-1, totalBobTime + 2])
      .range([height, 0]);

    // Calculate Current World State
    let currentTime = 0;
    if (step === SimulationStep.SETUP) currentTime = 0;
    else if (step === SimulationStep.OUTBOUND) currentTime = bobTimeOneWay * progress;
    else if (step === SimulationStep.TURNAROUND) currentTime = bobTimeOneWay;
    else if (step === SimulationStep.INBOUND) currentTime = bobTimeOneWay + (bobTimeOneWay * progress);
    else if (step === SimulationStep.CONCLUSION) currentTime = totalBobTime;

    // --- Helpers ---
    
    // Calculate Alice's position at a given Earth time t
    const getAlicePosAtT = (t: number) => {
        if (t <= bobTimeOneWay) {
            return { x: v * t, t: t };
        } else if (t <= totalBobTime) {
            const timeSinceTurn = t - bobTimeOneWay;
            return { x: dist - v * timeSinceTurn, t: t };
        }
        return { x: 0, t: t };
    };

    // Calculate current Alice Proper Time
    const getAliceProperTime = (t: number) => {
        if (t <= bobTimeOneWay) return t / gamma;
        const remaining = t - bobTimeOneWay;
        return (bobTimeOneWay / gamma) + (remaining / gamma);
    };

    // --- Signal Visualization Logic ---

    // Bob's Signals (Emitted at integer t from Earth)
    let bobSignalsCount = 0;
    if (showBobSignals) {
        const maxEmitTime = Math.floor(totalBobTime);
        for (let i = 1; i <= maxEmitTime; i++) {
            const tEmit = i;
            
            // Only show if emission has happened
            if (tEmit > currentTime) continue;

            // Signal travels at c (slope 1)
            // x = t - tEmit => t = x + tEmit
            
            // Intersection with Outbound leg: x = vt
            // vt = t - tEmit => t(1-v) = tEmit => tInt = tEmit / (1-v)
            let tInt = tEmit / (1 - v);
            let xInt = v * tInt;
            let onOutbound = true;

            if (tInt > bobTimeOneWay) {
                onOutbound = false;
                // Intersection with Inbound leg: x = d - v(t - tTurn)
                // x = t - tEmit
                // t - tEmit = d - v(t - tTurn)
                // t(1 + v) = d + tEmit + v*tTurn
                // tInt = (d + tEmit + v*tTurn) / (1 + v)
                // Note: tTurn = bobTimeOneWay, d = v * tTurn
                const tTurn = bobTimeOneWay;
                tInt = (dist + tEmit + v * tTurn) / (1 + v);
                xInt = tInt - tEmit;
            }

            // Draw Signal Line
            // From (0, tEmit) to (xInt, tInt) but limited by currentTime
            // Signal wavefront at currentTime: x = currentTime - tEmit
            
            let xEnd = 0, yEnd = 0;
            let isReceived = false;

            if (currentTime >= tInt) {
                // Signal has been received by Alice
                xEnd = xInt;
                yEnd = tInt;
                isReceived = true;
                bobSignalsCount++;
            } else {
                // Signal is in flight
                xEnd = currentTime - tEmit;
                yEnd = currentTime;
            }

            g.append("line")
                .attr("x1", xScale(0))
                .attr("y1", yScale(tEmit))
                .attr("x2", xScale(xEnd))
                .attr("y2", yScale(yEnd))
                .attr("stroke", "#60a5fa") // Blue-400
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "2,2");

            g.append("circle")
                .attr("cx", xScale(0))
                .attr("cy", yScale(tEmit))
                .attr("r", 2)
                .attr("fill", "#60a5fa");

            if (isReceived) {
                g.append("circle")
                    .attr("cx", xScale(xEnd))
                    .attr("cy", yScale(yEnd))
                    .attr("r", 3)
                    .attr("fill", "#60a5fa")
                    .attr("stroke", "#1e3a8a")
                    .attr("stroke-width", 1);
            }
        }
    }

    // Alice's Signals (Emitted at integer proper time tau)
    let aliceSignalsCount = 0;
    if (showAliceSignals) {
        const totalAliceProperTime = aliceTimeOneWay * 2;
        const maxEmitTau = Math.floor(totalAliceProperTime);

        for (let i = 1; i <= maxEmitTau; i++) {
            const tauEmit = i;
            
            // Calculate emission coordinate time and position
            let tEmit = 0;
            let xEmit = 0;
            let isOutbound = true;

            if (tauEmit <= aliceTimeOneWay) {
                tEmit = tauEmit * gamma;
                xEmit = v * tEmit;
            } else {
                isOutbound = false;
                const tauSinceTurn = tauEmit - aliceTimeOneWay;
                tEmit = bobTimeOneWay + tauSinceTurn * gamma;
                xEmit = dist - v * (tEmit - bobTimeOneWay);
            }

            // Only show if emission has happened
            if (tEmit > currentTime) continue;

            // Signal travels at c towards earth (slope -1)
            // x = xEmit - (t - tEmit) => t = tEmit + xEmit - x
            // Arrives at Earth (x=0) at tArrive = tEmit + xEmit
            const tArrive = tEmit + xEmit;

            // Draw Signal Line
            let xEnd = 0, yEnd = 0;
            let isReceived = false;

            if (currentTime >= tArrive) {
                xEnd = 0;
                yEnd = tArrive;
                isReceived = true;
                aliceSignalsCount++;
            } else {
                // In flight
                // current t = currentTime
                // x = xEmit - (currentTime - tEmit)
                xEnd = xEmit - (currentTime - tEmit);
                yEnd = currentTime;
            }

            g.append("line")
                .attr("x1", xScale(xEmit))
                .attr("y1", yScale(tEmit))
                .attr("x2", xScale(xEnd))
                .attr("y2", yScale(yEnd))
                .attr("stroke", "#f87171") // Red-400
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "2,2");

             g.append("circle")
                .attr("cx", xScale(xEmit))
                .attr("cy", yScale(tEmit))
                .attr("r", 2)
                .attr("fill", "#f87171");

             if (isReceived) {
                g.append("circle")
                    .attr("cx", xScale(0))
                    .attr("cy", yScale(tArrive))
                    .attr("r", 3)
                    .attr("fill", "#f87171")
                    .attr("stroke", "#7f1d1d")
                    .attr("stroke-width", 1);
            }
        }
    }

    // Update state for counters if changed
    // We can't set state directly in render/effect if it causes loop, but here logic is deterministic
    // Using a ref to debounce updates or just comparing local var
    if (counts.bobReceivedByAlice !== bobSignalsCount || counts.aliceReceivedByBob !== aliceSignalsCount) {
        // We defer this update to avoid React render loop warnings in effect
        setTimeout(() => setCounts({ bobReceivedByAlice: bobSignalsCount, aliceReceivedByBob: aliceSignalsCount }), 0);
    }

    // --- Base Visualization (Same as before) ---
    const drawSkewedGrid = (velocity: number, origin: {x: number, t: number}, color: string, opacity: number) => {
        const gammaFactor = 1 / Math.sqrt(1 - velocity * velocity);
        
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

        const minTp = Math.min(...corners.map(c => c.tp));
        const maxTp = Math.max(...corners.map(c => c.tp));
        const startTp = Math.ceil(minTp);
        const endTp = Math.floor(maxTp);

        const gridG = g.append("g")
            .attr("class", "alice-grid")
            .style("opacity", opacity)
            .attr("clip-path", "url(#chart-clip)");

        const transform = (xp: number, tp: number) => ({
            x: origin.x + gammaFactor * (xp + velocity * tp),
            t: origin.t + gammaFactor * (tp + velocity * xp)
        });

        for (let tp = startTp; tp <= endTp; tp += 1) {
            const x1 = xDom[0];
            const x2 = xDom[1];
            const t1 = origin.t + velocity * (x1 - origin.x) + tp / gammaFactor;
            const t2 = origin.t + velocity * (x2 - origin.x) + tp / gammaFactor;

            gridG.append("line")
                .attr("x1", xScale(x1))
                .attr("y1", yScale(t1))
                .attr("x2", xScale(x2))
                .attr("y2", yScale(t2))
                .attr("stroke", color)
                .attr("stroke-width", 0.5)
                .attr("stroke-dasharray", "4,4");

            const labelPos = transform(0, tp);
            if (labelPos.x >= xDom[0] && labelPos.x <= xDom[1] && labelPos.t >= yDom[0] && labelPos.t <= yDom[1]) {
                 gridG.append("text")
                    .attr("x", xScale(labelPos.x) + 4)
                    .attr("y", yScale(labelPos.t) - 2)
                    .attr("fill", color)
                    .attr("font-size", "9px")
                    .attr("font-weight", "bold")
                    .text(`t'=${tp}`);
            }
        }
    };

    if (showAliceGrid) {
        if (step === SimulationStep.SETUP || step === SimulationStep.OUTBOUND) {
            drawSkewedGrid(v, {x:0, t:0}, "#22d3ee", 0.5); 
        } else if (step === SimulationStep.INBOUND || step === SimulationStep.CONCLUSION) {
            drawSkewedGrid(-v, {x: dist, t: bobTimeOneWay}, "#a78bfa", 0.5); 
        } else if (step === SimulationStep.TURNAROUND) {
            drawSkewedGrid(v, {x:0, t:0}, "#22d3ee", 0.3); 
            drawSkewedGrid(-v, {x: dist, t: bobTimeOneWay}, "#a78bfa", 0.3);
        }
    }

    // Axes & Labels
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    g.append("g")
      .attr("class", "grid opacity-10")
      .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(() => ""))
      .attr("transform", `translate(0,${height})`);
    
    g.append("g")
      .attr("class", "grid opacity-10")
      .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(() => ""));

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

    // Light Cone
    const drawLightCone = (tx: number, ty: number) => {
      const size = 10;
      g.append("line")
        .attr("x1", xScale(tx))
        .attr("y1", yScale(ty))
        .attr("x2", xScale(tx + size))
        .attr("y2", yScale(ty + size))
        .attr("stroke", "#fbbf24")
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

    // Bob World Line
    g.append("line")
      .attr("x1", xScale(0))
      .attr("y1", yScale(0))
      .attr("x2", xScale(0))
      .attr("y2", yScale(totalBobTime))
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 3);

    g.append("text")
      .attr("x", xScale(0) - 10)
      .attr("y", yScale(totalBobTime) - 10)
      .attr("fill", "#3b82f6")
      .text("Bob");

    // Planet Line
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

    // Alice World Line Construction
    const outboundEnd = { x: dist, t: bobTimeOneWay };
    const inboundEnd = { x: 0, t: totalBobTime };

    g.append("path")
      .datum([{x:0, t:0}, outboundEnd, inboundEnd])
      .attr("fill", "none")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 1)
      .attr("opacity", 0.3)
      .attr("d", d3.line<{x:number, t:number}>()
        .x(d => xScale(d.x))
        .y(d => yScale(d.t))
      );

    const currentAlicePos = getAlicePosAtT(currentTime);
    
    // Draw Active Path
    const pathData = [{x:0, t:0}];
    if (currentTime > 0) {
        if (currentTime <= bobTimeOneWay) {
            pathData.push(currentAlicePos);
        } else {
            pathData.push(outboundEnd);
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

    g.append("circle")
      .attr("cx", xScale(currentAlicePos.x))
      .attr("cy", yScale(currentAlicePos.t))
      .attr("r", 6)
      .attr("fill", "#ef4444");

    // Simultaneity Line (Only if signals off to reduce clutter, or keep it?) 
    // Keeping it as it's a core paradox feature.
    let simultaneitySlope = 0;
    let showSimultaneity = step !== SimulationStep.CONCLUSION && step !== SimulationStep.SETUP;
    if (step === SimulationStep.OUTBOUND) simultaneitySlope = v;
    else if (step === SimulationStep.TURNAROUND) {
        const slopeStart = v;
        const slopeEnd = -v;
        simultaneitySlope = slopeStart + (slopeEnd - slopeStart) * progress;
    } else if (step === SimulationStep.INBOUND) simultaneitySlope = -v;

    if (showSimultaneity && !showBobSignals && !showAliceSignals) {
         // Logic same as previous implementation...
         // Simplified here to prioritize signal view if toggles are on
         const t_bob_intercept = currentAlicePos.t - simultaneitySlope * currentAlicePos.x;
         g.append("line")
            .attr("x1", xScale(currentAlicePos.x))
            .attr("y1", yScale(currentAlicePos.t))
            .attr("x2", xScale(-0.5))
            .attr("y2", yScale(currentAlicePos.t - simultaneitySlope * (currentAlicePos.x - (-0.5))))
            .attr("stroke", "#10b981")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5");
    }

  }, [dimensions, params, step, progress, showAliceGrid, showBobSignals, showAliceSignals]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] bg-slate-900 rounded-xl border border-slate-700 shadow-xl overflow-hidden relative">
        <div className="absolute top-4 right-4 bg-slate-800/80 p-2 rounded text-xs text-slate-300 pointer-events-none z-10 text-right">
            <div className="font-bold mb-1">Space-Time Diagram</div>
            {(showBobSignals || showAliceSignals) && (
                <div className="mt-2 space-y-1 bg-slate-900/90 p-2 rounded border border-slate-700">
                    {showBobSignals && (
                        <div className="text-blue-400">
                             Alice received: <span className="font-mono font-bold text-white">{counts.bobReceivedByAlice}</span> msgs
                        </div>
                    )}
                    {showAliceSignals && (
                        <div className="text-red-400">
                             Bob received: <span className="font-mono font-bold text-white">{counts.aliceReceivedByBob}</span> msgs
                        </div>
                    )}
                </div>
            )}
        </div>
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="block" />
    </div>
  );
};

export default MinkowskiDiagram;