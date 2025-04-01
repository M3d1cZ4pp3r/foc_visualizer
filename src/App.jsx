import Sidebar from './components/Sidebar';
import VectorCanvas from './components/VectorCanvas';
import { useState } from 'react';
import './App.css';

function App() {
  const [params, setParams] = useState({
    u_alpha: 0,
    u_beta: 0,
    Udc: 12,
    boxSizeV: 1,
    showPhases: true,
  });

  return (
    <div className="app-container">
      <Sidebar params={params} setParams={setParams} />
      <VectorCanvas params={params} />
    </div>
  );
}

export default App;
