import './styles/rawla.css';
import './index.css';
import './rawla-core.js';
import { initCapacitor } from './capacitor-service';

// Initialize Capacitor native features (StatusBar, Back Button, Network, Splash)
initCapacitor();
