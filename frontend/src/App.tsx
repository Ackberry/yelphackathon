import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>Mood-Based Discovery</h1>
      <p>Welcome to the mood-based place discovery application!</p>
      <button onClick={() => setCount((count) => count + 1)}>Count is {count}</button>
    </div>
  );
}

export default App;
