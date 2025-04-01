import { useState } from "react";

export default function Sidebar({ params, setParams }) {
  const [inputAlpha, setInputAlpha] = useState(params.u_alpha.toString());
  const [inputBeta, setInputBeta] = useState(params.u_beta.toString());

  const handleInput = (e, setter) => {
    const val = e.target.value;
    // Erlaubt: leeres Feld, -, . und Ziffern
    if (/^-?\d*\.?\d*$/.test(val) || val === "") {
      setter(val);
    }
  };

  const handleBlur = (inputVal, setter, key) => {
    const parsed = parseFloat(inputVal);
    const value = isNaN(parsed) ? 0 : parsed;
    setter(value.toString()); // Reset Text
    setParams({ ...params, [key]: value });
  };

  return (
    <div className="sidebar">
      <h2>Einstellungen</h2>

      <h3>Vektor-Eingabe</h3>

      <label>uₐ:
        <input
          type="text"
          value={inputAlpha}
          onChange={(e) => handleInput(e, setInputAlpha)}
          onBlur={() => handleBlur(inputAlpha, setInputAlpha, "u_alpha")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleBlur(inputAlpha, setInputAlpha, "u_alpha");
            }
          }}
        />
      </label>

      <label>uᵦ:
        <input
          type="text"
          value={inputBeta}
          onChange={(e) => handleInput(e, setInputBeta)}
          onBlur={() => handleBlur(inputBeta, setInputBeta, "u_beta")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleBlur(inputBeta, setInputBeta, "u_beta");
            }
          }}
        />
      </label>
  
        <h3>Darstellung</h3>
        <label>DC-Link-Spannung (V):
          <input type="number" value={params.Udc} onChange={e => setParams({ ...params, Udc: +e.target.value })} />
        </label>
        <label>Rasterweite (V/Kästchen):
          <input type="number" value={params.boxSizeV} onChange={e => setParams({ ...params, boxSizeV: +e.target.value })} />
        </label>
  
        <label>
          <input
            type="checkbox"
            checked={params.showPhases}
            onChange={e => setParams({ ...params, showPhases: e.target.checked })}
          />
          Phasen U/V/W anzeigen
        </label>

        <label>
        <input
          type="checkbox"
          checked={params.showSVM}
          onChange={e => setParams({ ...params, showSVM: e.target.checked })}
        />
        SVM-Darstellung aktivieren
      </label>
      </div>
    );
  }