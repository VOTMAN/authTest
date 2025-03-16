import { createSession, generateSessionToken } from "../backend/sessionApi.ts";

function App() {
  generateSessionToken();
  return (
    <div>
      <button>Click here</button>
    </div>
  );
}

export default App;
