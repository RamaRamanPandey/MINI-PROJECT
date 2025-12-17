import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Galvanometer } from './components/Galvanometer';
import { LabComponent, KeySwitch, CapacitorBox, ResistorBox, BatteryBox } from './components/CircuitComponents';
import { Stopwatch } from './components/Stopwatch';
import { askLabAssistant } from './services/geminiService';
import { SimulationState, LabReading, ChatMessage } from './types';
import { Info, RotateCcw, Save, Trash2, Send, ChevronRight, HelpCircle, Box, MousePointer2, ZoomIn } from 'lucide-react';

// Physics Constants
const CAPACITANCE_UF = 1.0; 
const RESISTANCE_MOHM = 5.0; // The unknown value
const BATTERY_VOLTAGE = 100; // Arbitrary units for deflection (0-100 scale)

// SVG Wires Helper moved outside component
const Wire = ({ d, active, ground }: { d: string, active?: boolean, ground?: boolean }) => (
  <path 
    d={d} 
    className={`wire-path ${active ? 'active' : ''} ${ground ? 'ground' : ''}`} 
  />
);

export default function App() {
  // --- Simulation State ---
  const [simState, setSimState] = useState<SimulationState>({
    isK1Closed: false,
    isK2Closed: false,
    capacitorVoltage: 0,
    maxVoltage: BATTERY_VOLTAGE,
    capacitance: CAPACITANCE_UF,
    resistance: RESISTANCE_MOHM,
    simTime: 0,
  });

  // --- Lab Data State ---
  const [readings, setReadings] = useState<LabReading[]>([]);
  const [currentStopwatchTime, setCurrentStopwatchTime] = useState(0);
  const [hasShownTip, setHasShownTip] = useState(false);
  
  // --- AI Assistant State ---
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'model', text: 'Welcome to the Physics Lab! You can drag to rotate the view and scroll to zoom. To begin, ensure K2 is open and close K1 to charge the condenser.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- View / Camera State (Orbit Controls) ---
  const [view, setView] = useState({ pitch: 25, yaw: 0, zoom: 0.9 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // --- Physics Engine ---
  const lastTimeRef = useRef<number>(Date.now());
  const requestRef = useRef<number>();

  const updatePhysics = useCallback(() => {
    const now = Date.now();
    const dt = (now - lastTimeRef.current) / 1000; // seconds
    lastTimeRef.current = now;

    setSimState(prev => {
      let newVoltage = prev.capacitorVoltage;

      // Circuit Logic
      if (prev.isK1Closed) {
        // Charging Phase
        const chargeRate = 15.0;
        newVoltage = newVoltage + (prev.maxVoltage - newVoltage) * chargeRate * dt;
      } else if (prev.isK2Closed) {
        // Discharging Phase
        const rc = prev.resistance * prev.capacitance; 
        const decayFactor = Math.exp(-dt / rc);
        newVoltage = newVoltage * decayFactor;
      }

      return {
        ...prev,
        capacitorVoltage: Math.max(0, newVoltage),
        simTime: prev.simTime + dt
      };
    });

    requestRef.current = requestAnimationFrame(updatePhysics);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [updatePhysics]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // --- Interaction Handlers ---
  const toggleK1 = () => {
    setSimState(prev => {
      return { ...prev, isK1Closed: !prev.isK1Closed };
    });
  };

  const toggleK2 = () => {
    setSimState(prev => ({ ...prev, isK2Closed: !prev.isK2Closed }));
  };

  const recordReading = () => {
    const newReading: LabReading = {
      id: Date.now(),
      timeSeconds: parseFloat(currentStopwatchTime.toFixed(2)),
      initialDeflection: BATTERY_VOLTAGE,
      finalDeflection: parseFloat(simState.capacitorVoltage.toFixed(1)),
    };
    setReadings(prev => [...prev, newReading]);
    if (!hasShownTip) {
      setHasShownTip(true);
      setChatHistory(prev => [...prev, { role: 'model', text: "Great! You've recorded a reading. Use the 'Calc R' button to compute the resistance using the formula." }]);
    }
  };

  const deleteReading = (id: number) => {
    setReadings(prev => prev.filter(r => r.id !== id));
  };

  const calculateR = (r: LabReading) => {
    if (r.finalDeflection <= 0.1 || r.initialDeflection <= 0) {
      alert("Invalid deflection values for calculation.");
      return;
    }
    const ratio = r.initialDeflection / r.finalDeflection;
    if (ratio <= 1.001) return; 

    const val = r.timeSeconds / (CAPACITANCE_UF * Math.log(ratio));
    setReadings(prev => prev.map(item => 
      item.id === r.id ? { ...item, calculatedR: parseFloat(val.toFixed(2)) } : item
    ));
  };

  const resetExperiment = () => {
    setSimState(prev => ({
      ...prev,
      isK1Closed: false,
      isK2Closed: false,
      capacitorVoltage: 0
    }));
    setReadings([]);
    setChatHistory(prev => [...prev, { role: 'model', text: "Experiment reset. Ready for a new trial." }]);
  };

  const resetView = () => {
    setView({ pitch: 25, yaw: 0, zoom: 0.9 });
  }

  // --- Orbit Control Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    setView(prev => ({
      ...prev,
      yaw: prev.yaw + deltaX * 0.5,
      pitch: Math.min(Math.max(prev.pitch - deltaY * 0.5, -10), 85) // Clamp pitch to avoid flipping
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    setView(prev => ({
      ...prev,
      zoom: Math.min(Math.max(prev.zoom - e.deltaY * 0.001, 0.4), 2.5)
    }));
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    const context = `
      Simulation Status:
      - Capacitor Voltage (Deflection): ${simState.capacitorVoltage.toFixed(1)} / ${BATTERY_VOLTAGE}
      - Key K1 (Charging): ${simState.isK1Closed ? 'CLOSED' : 'OPEN'}
      - Key K2 (Leaking): ${simState.isK2Closed ? 'CLOSED' : 'OPEN'}
      - Known Capacitance: ${CAPACITANCE_UF} µF
      - Unknown Resistance: (Hidden value: ${RESISTANCE_MOHM} MΩ)
      - Stopwatch Time: ${currentStopwatchTime.toFixed(2)} s
      - Readings Taken: ${readings.length}
    `;

    const response = await askLabAssistant(userMsg.text, context);
    setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    setIsTyping(false);
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden select-none font-sans">
      
      {/* LEFT: 3D Immersive Workspace */}
      <div 
        className="flex-1 relative scene-container flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        
        {/* World Pivot: Controls the main camera angle via state */}
        <div 
          className="world-pivot"
          style={{
            transform: `perspective(1000px) rotateX(${view.pitch}deg) rotateY(${view.yaw}deg) scale(${view.zoom})`
          }}
        >
          
          {/* Floor Grid (Background) */}
          <div className="floor-grid"></div>

          {/* Table Shadow on Floor */}
          <div className="table-shadow"></div>

          {/* The 3D Table Assembly */}
          <div className="table-assembly">
            
            {/* Front Thickness Face */}
            <div className="table-face face-front"></div>
            {/* Back Thickness Face (needed for 360 view) */}
            <div className="table-face face-back"></div>
            
            {/* Side Thickness Faces */}
            <div className="side-face" style={{ 
              width: '50px', height: '600px', 
              transform: 'translateX(-25px) rotateY(90deg)', left: 0 
            }}></div>
             <div className="side-face" style={{ 
              width: '50px', height: '600px', 
              transform: 'translateX(25px) rotateY(90deg)', right: 0 
            }}></div>


            {/* Table Top Surface (Contains the Circuit) */}
            <div className="table-top shadow-2xl">
              
              {/* Texture Overlay */}
              <div className="absolute inset-0 wood-texture rounded-lg pointer-events-none"></div>

              {/* --- Wires Layer (SVG) --- */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
                 {/* Battery (+) to K1 */}
                 <Wire d="M 160 120 L 250 120" active={true} /> 
                 
                 {/* K1 to Node A (Distribution Point) */}
                 <Wire d="M 320 120 L 400 120 L 400 200" active={simState.isK1Closed} />

                 {/* Node A to Capacitor Top */}
                 <Wire d="M 400 200 L 400 280" active={simState.isK1Closed || simState.capacitorVoltage > 0} />
                 
                 {/* Node A to Galvanometer Top */}
                 <Wire d="M 400 200 L 550 200 L 550 240" active={simState.isK1Closed || simState.capacitorVoltage > 0} />

                 {/* Node A to K2 */}
                 <Wire d="M 400 200 L 250 200 L 250 280" active={simState.isK1Closed || simState.capacitorVoltage > 0} />

                 {/* K2 to Resistor Top */}
                 <Wire d="M 250 380 L 250 420" active={simState.isK2Closed && simState.capacitorVoltage > 0} />

                 {/* GROUND PATHS (Black Wires) */}
                 <Wire d="M 400 420 L 400 500" ground />
                 <Wire d="M 250 550 L 400 550" ground />
                 <Wire d="M 550 440 L 550 500 L 400 500" ground />
                 <Wire d="M 400 550 L 160 550 L 160 210" ground />
              </svg>

              {/* --- Components Placement --- */}
              {/* Using onMouseDown to stop propagation allows clicking components without dragging the world immediately, 
                  but we want dragging everywhere for "VR" feel. Usually, click matches action. */}
              
              <div className="absolute top-[80px] left-[60px] z-10" style={{transform: 'translateZ(5px)'}} onMouseDown={(e) => e.stopPropagation()}>
                <BatteryBox />
              </div>

              <div className="absolute top-[80px] left-[250px] z-10" style={{transform: 'translateZ(5px)'}} onMouseDown={(e) => e.stopPropagation()}>
                <KeySwitch label="K1 (Charge)" isOpen={!simState.isK1Closed} onToggle={toggleK1} />
              </div>

              <div className="absolute top-[280px] left-[220px] z-10" style={{transform: 'translateZ(5px)'}} onMouseDown={(e) => e.stopPropagation()}>
                 <KeySwitch label="K2 (Leak)" isOpen={!simState.isK2Closed} onToggle={toggleK2} />
              </div>

              <div className="absolute top-[280px] left-[340px] z-10" style={{transform: 'translateZ(5px)'}} onMouseDown={(e) => e.stopPropagation()}>
                <CapacitorBox value={CAPACITANCE_UF} />
              </div>

              <div className="absolute bottom-[40px] left-[180px] z-10" style={{transform: 'translateZ(5px)'}} onMouseDown={(e) => e.stopPropagation()}>
                <ResistorBox value={RESISTANCE_MOHM} />
              </div>

              <div className="absolute top-[240px] right-[150px] z-20 transform scale-125" style={{transform: 'translateZ(10px) scale(1.25)'}} onMouseDown={(e) => e.stopPropagation()}>
                 <Galvanometer value={simState.capacitorVoltage} maxValue={BATTERY_VOLTAGE} />
              </div>

              <div className="absolute bottom-4 right-4 text-white/30 font-mono text-sm pointer-events-none tracking-[0.2em] uppercase">
                 Physics Dept • Exp-04
              </div>
            </div>
          </div>
        </div>

        {/* HUD Elements Overlay (Floating) */}
        <div className="absolute top-6 left-6 pointer-events-none flex flex-col gap-2">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center gap-3">
             <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
             <span className="text-xs font-bold text-green-400 tracking-wider">SYSTEM ONLINE</span>
          </div>
          <div className="bg-black/60 text-white/60 p-2 rounded text-[10px] flex flex-col gap-1 backdrop-blur-sm pointer-events-auto">
             <div className="flex items-center gap-2"><MousePointer2 size={12}/> Drag to Rotate</div>
             <div className="flex items-center gap-2"><ZoomIn size={12}/> Scroll to Zoom</div>
             <button onClick={resetView} className="mt-1 bg-white/10 hover:bg-white/20 py-1 rounded text-center transition-colors">Reset View</button>
          </div>
        </div>

      </div>

      {/* RIGHT: HUD & Controls */}
      <div className="w-[400px] bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl z-30 relative">
        <div className="absolute inset-0 bg-grid-slate-800/20 pointer-events-none" style={{backgroundSize: '20px 20px'}}></div>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur z-10">
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Box className="text-indigo-500" /> VR Physics Lab
          </h1>
          <p className="text-xs text-slate-500 mt-1">High Resistance by Leakage of Condenser</p>
        </div>

        {/* Stopwatch & Main Action */}
        <div className="p-4 grid grid-cols-2 gap-4 items-start border-b border-slate-800 bg-slate-900/60 z-10">
          <Stopwatch onTimeUpdate={setCurrentStopwatchTime} />
          
          <div className="flex flex-col gap-2">
            <button 
              onClick={recordReading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] active:scale-95 transition-all flex flex-col items-center justify-center gap-1 border border-indigo-400/30"
            >
              <Save size={18} />
              <span className="text-xs">RECORD READING</span>
            </button>
            
            <button 
              onClick={resetExperiment}
              className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-300 font-bold py-2 px-4 rounded border border-red-900/50 active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
            >
              <RotateCcw size={18} />
              <span className="text-xs">RESET EXP</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[200px] z-10">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
             <HelpCircle size={12} /> Observation Table
          </h3>
          
          {readings.length === 0 ? (
            <div className="text-center text-slate-600 py-8 text-sm italic border-2 border-dashed border-slate-800 rounded bg-slate-900/50">
              No readings recorded yet. <br/> Close K1 to charge, then Open K1 & Close K2 to leak.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-5 text-[10px] text-slate-400 font-mono text-center pb-1 border-b border-slate-800">
                <div>Time(s)</div>
                <div>θ₀</div>
                <div>θₜ</div>
                <div>R(MΩ)</div>
                <div>Action</div>
              </div>
              {readings.map((r) => (
                <div key={r.id} className="grid grid-cols-5 text-xs font-mono items-center text-center bg-slate-800/80 p-2 rounded hover:bg-slate-800 transition-colors border border-slate-800/50">
                  <div className="text-blue-400 font-bold">{r.timeSeconds}</div>
                  <div>{r.initialDeflection}</div>
                  <div className="text-yellow-400">{r.finalDeflection}</div>
                  <div>
                    {r.calculatedR ? (
                      <span className="text-green-400 font-bold">{r.calculatedR}</span>
                    ) : (
                      <button 
                        onClick={() => calculateR(r)}
                        className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-300"
                      >
                        Calc
                      </button>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <button onClick={() => deleteReading(r.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Lab Assistant */}
        <div className="h-[35%] border-t border-slate-800 flex flex-col bg-slate-900 z-10">
           <div className="p-2 bg-slate-900/90 text-xs font-bold text-indigo-400 flex items-center gap-2 shadow-sm border-b border-slate-800">
             <span>🤖 AI Lab Assistant</span>
           </div>
           
           <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-950/50">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-2 rounded-lg text-xs leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600/90 text-white rounded-br-none border border-indigo-500' 
                      : 'bg-slate-800 text-slate-300 rounded-bl-none border border-slate-700'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                   <div className="bg-slate-800 p-2 rounded-lg rounded-bl-none text-xs text-slate-400 animate-pulse border border-slate-700">
                     Thinking...
                   </div>
                </div>
              )}
              <div ref={chatEndRef}></div>
           </div>

           <form onSubmit={handleChatSubmit} className="p-2 bg-slate-900 border-t border-slate-800 flex gap-2">
             <input
               type="text"
               value={chatInput}
               onChange={(e) => setChatInput(e.target.value)}
               placeholder="Ask about the formula, procedure..."
               className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-600 transition-colors"
             />
             <button 
               type="submit" 
               disabled={isTyping}
               className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/20"
             >
               <Send size={16} />
             </button>
           </form>
        </div>

      </div>
    </div>
  );
}