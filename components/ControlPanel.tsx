import React from 'react';
import { SimulationParams, SimulationStep } from '../types';

interface Props {
  params: SimulationParams;
  setParams: (p: SimulationParams) => void;
  step: SimulationStep;
  setStep: (s: SimulationStep) => void;
  progress: number;
  handlePlayPause: () => void;
  isPlaying: boolean;
  showAliceGrid: boolean;
  setShowAliceGrid: (v: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
}

const ControlPanel: React.FC<Props> = ({ 
  params, 
  setParams, 
  step, 
  setStep,
  handlePlayPause,
  isPlaying,
  showAliceGrid,
  setShowAliceGrid,
  playbackSpeed,
  setPlaybackSpeed
}) => {
  
  const steps = Object.values(SimulationStep);
  const currentStepIndex = steps.indexOf(step);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1]);
    }
  };

  // Calculations for display
  const gamma = 1 / Math.sqrt(1 - Math.pow(params.velocity, 2));
  const bobTime = (params.distance / params.velocity) * 2;
  const aliceTime = bobTime / gamma;

  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-800 rounded-xl border border-slate-700 h-full overflow-y-auto">
      
      {/* Parameters */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white border-b border-slate-600 pb-2">Mission Parameters</h2>
        
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">
            Distance (Light Years): {params.distance}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={params.distance}
            onChange={(e) => setParams({ ...params, distance: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            disabled={step !== SimulationStep.SETUP}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">
            Velocity (c): {params.velocity}
          </label>
          <input
            type="range"
            min="0.1"
            max="0.99"
            step="0.01"
            value={params.velocity}
            onChange={(e) => setParams({ ...params, velocity: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            disabled={step !== SimulationStep.SETUP}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-900 p-3 rounded-lg">
          <div>
            <span className="block text-slate-500">Gamma Factor (γ)</span>
            <span className="text-lg font-mono text-emerald-400">{gamma.toFixed(3)}</span>
          </div>
          <div>
            <span className="block text-slate-500">Time Dilation</span>
            <span className="text-lg font-mono text-emerald-400">1 : {gamma.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Visual Options */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Visual Options</h2>
        <div className="flex items-center gap-3">
          <div className="relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in">
              <input 
                type="checkbox" 
                name="toggle" 
                id="alice-grid-toggle" 
                checked={showAliceGrid}
                onChange={(e) => setShowAliceGrid(e.target.checked)}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-4 checked:border-blue-600"
              />
              <label htmlFor="alice-grid-toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${showAliceGrid ? 'bg-blue-600' : 'bg-slate-600'}`}></label>
          </div>
          <label htmlFor="alice-grid-toggle" className="text-sm text-slate-200 cursor-pointer">
              Show Alice's Grid
          </label>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white border-b border-slate-600 pb-2">Simulation Control</h2>
        
        <div>
           <div className="flex justify-between text-xs text-slate-400 mb-1">
             <span>Animation Speed</span>
             <span>{(playbackSpeed / 0.005).toFixed(1)}x</span>
           </div>
           <input
            type="range"
            min="0.001"
            max="0.02"
            step="0.001"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
           />
           <div className="flex justify-between text-[10px] text-slate-500 mt-1">
             <span>Slow</span>
             <span>Fast</span>
           </div>
        </div>

        <div className="flex items-center justify-between gap-2">
            <button 
                onClick={handlePrev}
                disabled={step === SimulationStep.SETUP || isPlaying}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded text-white font-medium transition-colors"
            >
                Prev
            </button>
            <div className="text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Current Stage</div>
                <div className="font-bold text-blue-400">{step}</div>
            </div>
            <button 
                onClick={handleNext}
                disabled={step === SimulationStep.CONCLUSION || isPlaying}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded text-white font-medium transition-colors"
            >
                Next
            </button>
        </div>

        <button
            onClick={handlePlayPause}
            className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all ${
                isPlaying 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
            }`}
        >
            {isPlaying ? 'Pause Simulation' : 'Play / Resume'}
        </button>
      </div>

      {/* Explanation Text */}
      <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 flex-grow">
        <h3 className="font-bold text-amber-400 mb-2">Physics Insight</h3>
        <div className="text-sm text-slate-300 leading-relaxed">
            {getExplanationText(step, gamma, bobTime, aliceTime)}
        </div>
      </div>
    </div>
  );
};

function getExplanationText(step: SimulationStep, gamma: number, bobTime: number, aliceTime: number) {
    switch(step) {
        case SimulationStep.SETUP:
            return "Alice and Bob start at the same location (Earth) at t=0. Alice plans to travel to a distant star and return. According to Special Relativity, moving clocks tick slower relative to a stationary observer.";
        case SimulationStep.OUTBOUND:
            return `Alice travels away at constant velocity. From Bob's perspective, Alice's clock is running slow (Time Dilation). However, from Alice's perspective, she is stationary and Bob is moving away, so she sees Bob's clock running slow. Look at the green 'Simultaneity' line pointing back to Bob's axis—it shows what Alice considers 'Now' on Earth.`;
        case SimulationStep.TURNAROUND:
            return "CRITICAL MOMENT: Alice changes direction (accelerates). She switches from an inertial frame moving away to one moving towards Earth. Her definition of 'Now' (the green line) swings drastically forward in time on Earth. This 'gap' in Bob's timeline accounts for the missing years. Acceleration breaks the symmetry.";
        case SimulationStep.INBOUND:
            return "Alice returns. Again, due to time dilation, her clock ticks slower than Bob's during this leg. But because of the frame switch at the star, she will return finding Bob much older.";
        case SimulationStep.CONCLUSION:
            return `Reunion! Bob has aged ${bobTime.toFixed(2)} years, while Alice has only aged ${aliceTime.toFixed(2)} years. Both agree on the final result, but they disagree on *when* the aging happened. Bob says it was gradual. Alice says Bob aged rapidly during her turnaround (the gap in simultaneity).`;
        default:
            return "";
    }
}

export default ControlPanel;