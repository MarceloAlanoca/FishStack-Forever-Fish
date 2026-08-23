import { Routes, Route } from "react-router-dom"

import Principal from "./pages/Principal/Principal"
import Credits from "./pages/Credits/Credits"

function App() {
    return (
        <Routes>

            <Route
                path="/"
                element={<Principal />}
            />

            <Route
                path="/credits"
                element={<Credits />}
            />

        </Routes>
    )
}

export default App