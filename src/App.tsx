import PlayController from './PlayController';
import './App.css';
import { EmulatorContext } from './emulator/useEmulator';

export default function App() {
  return <EmulatorContext>
    <PlayController />
  </EmulatorContext>;
}
