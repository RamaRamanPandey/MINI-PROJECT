import React from 'react';
import { LucideIcon, Zap, Battery, Activity, SwitchCamera } from 'lucide-react';

interface ComponentBaseProps {
  label: string;
  children?: React.ReactNode;
  active?: boolean;
  className?: string;
  icon?: LucideIcon;
}

export const LabComponent: React.FC<ComponentBaseProps> = ({ label, children, active, className, icon: Icon }) => (
  <div className={`relative group p-4 bg-slate-800 rounded-lg border-2 shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-all duration-300 ${active ? 'border-yellow-500 shadow-yellow-500/20' : 'border-slate-600'} ${className}`}>
    <div className="absolute -top-3 left-4 px-2 bg-slate-900 text-xs font-bold text-slate-400 border border-slate-700 rounded uppercase tracking-wider flex items-center gap-1">
      {Icon && <Icon size={10} />}
      {label}
    </div>
    {children}
  </div>
);

export const KeySwitch: React.FC<{
  label: string;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ label, isOpen, onToggle }) => (
  <div className="flex flex-col items-center">
    <div 
      className="cursor-pointer relative w-16 h-24 bg-amber-900/40 rounded-lg border border-amber-800 shadow-inner flex items-center justify-center hover:bg-amber-900/60 transition-colors"
      onClick={onToggle}
    >
      {/* Base contact */}
      <div className="absolute bottom-4 w-4 h-4 rounded-full bg-yellow-600 shadow-sm border border-yellow-400"></div>
      
      {/* Lever */}
      <div 
        className={`w-2 h-16 bg-gradient-to-t from-gray-300 to-gray-100 rounded shadow-md origin-bottom transition-transform duration-200 absolute bottom-5 ${isOpen ? '-rotate-45' : 'rotate-0'}`}
      >
        <div className="w-4 h-6 bg-black rounded absolute -top-1 -left-1"></div>
      </div>
    </div>
    <span className="mt-2 text-xs font-mono text-slate-400">{label}</span>
    <span className={`text-[10px] font-bold ${isOpen ? 'text-red-400' : 'text-green-400'}`}>
      {isOpen ? 'OPEN' : 'CLOSED'}
    </span>
  </div>
);

export const ResistorBox: React.FC<{ value: number }> = ({ value }) => (
  <LabComponent label="High Resistance Box" className="w-32 h-32 flex flex-col items-center justify-center bg-stone-800" icon={Activity}>
    <div className="grid grid-cols-2 gap-2">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="w-8 h-8 rounded-full border-2 border-stone-600 bg-black flex items-center justify-center">
           <div className="w-2 h-4 bg-stone-400"></div>
        </div>
      ))}
    </div>
    <div className="mt-2 text-xs font-mono text-stone-400">R = ? MΩ</div>
  </LabComponent>
);

export const CapacitorBox: React.FC<{ value: number }> = ({ value }) => (
  <LabComponent label="Condenser" className="w-32 h-32 flex flex-col items-center justify-center bg-blue-950/30" icon={Zap}>
    <div className="w-16 h-20 border-4 border-blue-400 rounded-lg flex items-center justify-center bg-blue-900/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
      <span className="font-mono text-blue-200 font-bold">{value} μF</span>
    </div>
  </LabComponent>
);

export const BatteryBox: React.FC = () => (
  <LabComponent label="DC Battery" className="w-32 h-24 flex items-center justify-center bg-zinc-800" icon={Battery}>
    <div className="text-2xl font-black text-zinc-500 tracking-widest">
      <span className="text-red-500">+</span> 2V <span className="text-blue-500">-</span>
    </div>
  </LabComponent>
);
