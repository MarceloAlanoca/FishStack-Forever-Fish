
import { Routes, Route, useLocation } from "react-router-dom";

import Principal from "./pages/Principal/Principal";
import Credits from "./pages/Credits/Credits";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Home from "./pages/Home/Home";
import Profile from "./pages/Profile/Profile";
import Game from "./pages/Game/Game";
import Crud from "./pages/Crud/Crud";
import Logs from "./pages/Logs/Logs";
import Shop from "./pages/Shop/Shop";

import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer/Footer";

function App() {
    const location = useLocation();

    const paginasSinFooter = ["/login", "/register", "/game"];

    const mostrarFooter = !paginasSinFooter.includes(location.pathname);

    return (
        <div className="app-layout">
            <div className="app-content">
                <Routes>
                    <Route path="/" element={<Principal />} />

                    <Route path="/credits" element={<Credits />} />

                    <Route path="/login" element={<Login />} />

                    <Route path="/register" element={<Register />} />

                    <Route
                        path="/home"
                        element={
                            <ProtectedRoute>
                                <Home />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="/game" element={<Game />} />

                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/shop"
                        element={
                            <ProtectedRoute>
                                <Shop />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="/logs" element={<Logs />} />

                    <Route
                        path="/crud"
                        element={
                            <ProtectedRoute>
                                <Crud />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </div>

            {mostrarFooter && (
                <div className="footer-wrapper">
                    <Footer />
                </div>
            )}
        </div>
    );
}

export default App;

