import React, { useState, useEffect, useRef } from 'react';
import MinkowskiDiagram from './components/MinkowskiDiagram';
import ControlPanel from './components/ControlPanel';
import GeminiChat from './components/GeminiChat';
import { SimulationParams, SimulationStep } from './types';

const App: React.FC = () => {
  // Initial state based on the textbook problem: v = sqrt(0.75)c approx 0.866c, Distance = 5.2 ly
  const [params, setParams] = useState<SimulationParams>({
    distance: 5.2,
    velocity: 0.866
  });

  const [step, setStep] = useState<SimulationStep>(SimulationStep.SETUP);
  const [progress, setProgress] = useState(0); // 0 to 1 for current step animation
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<number>();

  const ANIMATION_SPEED = 0.005;

  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setProgress(prev => {
          const next = prev + ANIMATION_SPEED;
          if (next >= 1) {
            // Auto-advance step logic
            const steps = Object.values(SimulationStep);
            const currentIndex = steps.indexOf(step);
            
            if (currentIndex < steps.length - 1) {
              setStep(steps[currentIndex + 1]);
              return 0; // Reset progress for next step
            } else {
              setIsPlaying(false); // Stop at end
              return 1;
            }
          }
          return next;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, step]);

  // Reset progress when manually changing steps
  const handleStepChange = (newStep: SimulationStep) => {
    setStep(newStep);
    setProgress(0);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (step === SimulationStep.CONCLUSION && progress >= 1) {
        // Restart if at end
        setStep(SimulationStep.SETUP);
        setProgress(0);
        setIsPlaying(true);
    } else {
        setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8">
      <header className="max-w-7xl mx-auto mb-6 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Twin Paradox Visualizer
            </h1>
            <p className="text-slate-400 text-sm mt-1">Based on relativity principles. Visualizing the loss of simultaneity.</p>
        </div>
        <div className="hidden md:block text-right text-xs text-slate-500">
            Powered by React, D3 & Gemini
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
        
        {/* Left Column: Controls (3 cols) */}
        <section className="lg:col-span-3 h-full order-2 lg:order-1">
          <ControlPanel 
            params={params}
            setParams={setParams}
            step={step}
            setStep={handleStepChange}
            progress={progress}
            handlePlayPause={handlePlayPause}
            isPlaying={isPlaying}
          />
        </section>

        {/* Center Column: Visualization (6 cols) */}
        <section className="lg:col-span-6 h-[500px] lg:h-full order-1 lg:order-2">
          <MinkowskiDiagram 
            params={params}
            step={step}
            progress={progress}
          />
        </section>

        {/* Right Column: AI Chat (3 cols) */}
        <section className="lg:col-span-3 h-full order-3">
          <GeminiChat params={params} step={step} />
        </section>

      </main>
    </div>
  );
};

export default App;
