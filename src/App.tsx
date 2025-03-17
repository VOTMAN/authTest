import {Link } from "react-router-dom"

function App() {
  return(
    <div>
      <h1 className="text-2xl">HomePage</h1>
      <Link to="/signup">Signup</Link>
    </div>
  )
}

export default App;
