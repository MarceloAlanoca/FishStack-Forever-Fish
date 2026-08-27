import { Routes, Route } from "react-router-dom"

import Principal from "./pages/Principal/Principal"
import Credits from "./pages/Credits/Credits"
import Login from "./pages/Login/Login"
import Register from "./pages/Register/Register"
import Home from "./pages/Home/Home"
import Game from "./pages/Game/Game"

import ProtectedRoute from "./components/ProtectedRoute"

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

            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/register"
                element={<Register />}
            />

            <Route
                path="/home"
                element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/game"
                element={<Game />}
            />

        </Routes>
    )
}

export default App
