import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import Register from "./pages/UserRegistration";
import Decision from "./pages/Decision";
import Users from "./pages/Users";
import config from "./config/configs";


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/register" element={<Register />} />
                <Route path="/users" element={<Users />} />
                <Route path="/decision" element={<Decision />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;