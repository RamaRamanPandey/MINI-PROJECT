export interface SimulationState {
  isK1Closed: boolean; // Charging key
  isK2Closed: boolean; // Leaking/Discharge key
  capacitorVoltage: number; // Current voltage across capacitor (proportional to deflection)
  maxVoltage: number; // Battery voltage
  capacitance: number; // In MicroFarads (uF)
  resistance: number; // In MegaOhms (MΩ) - The Unknown
  simTime: number; // Simulation clock
}

export interface LabReading {
  id: number;
  timeSeconds: number;
  initialDeflection: number; // Theta 0
  finalDeflection: number; // Theta t
  calculatedR?: number;
}

export enum ComponentType {
  BATTERY = 'Battery',
  CAPACITOR = 'Condenser',
  RESISTANCE = 'High Resistance Box',
  GALVANOMETER = 'Sensitive Galvanometer',
  KEY_1 = 'Key K1 (Charge)',
  KEY_2 = 'Key K2 (Leak)',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
