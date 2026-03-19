import { useState } from "react";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <header className="header">
        <h1>My First App</h1>
        <p>앱인토스 미니앱에 오신 것을 환영합니다!</p>
      </header>

      <main className="main">
        <div className="card">
          <button className="counter-btn" onClick={() => setCount((c) => c + 1)}>
            카운트: {count}
          </button>
          <p className="hint">버튼을 눌러보세요</p>
        </div>
      </main>
    </div>
  );
}

export default App;
