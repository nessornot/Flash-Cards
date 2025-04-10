import React, {lazy, Suspense} from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import './styles/main.scss';
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import LearnSet from "./pages/LearnSet/LearnSet";
import SharedSet from "./pages/SharedSet/SharedSet";

const Home = lazy(() => import('./pages/Home/Home'));
const Register = lazy(() => import('./pages/Register/Register'));
const Login = lazy(() => import('./pages/Login/Login'));
const Library = lazy(() => import('./pages/Library/Library'))
const CreateSet = lazy(() => import("./pages/CreateSet/CreateSet"))

function App() {
    return (
        <Router>
            <Suspense fallback={<div>Загрузка... (заглушка)</div>}>
                <Routes>
                    <Route path="/" element={<Home/>}/>
                    <Route path="/register" element={<Register/>}/>
                    <Route path="/login" element={<Login/>}/>
                    <Route path="/shared/:id" element={<SharedSet />} />
                    <Route element={<ProtectedRoute />}>
                        <Route path="/library" element={<Library />} />
                    </Route>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/createset" element={<CreateSet />} />
                    </Route>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/edit/:id" element={<CreateSet />} />
                    </Route>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/learn/:id" element={<LearnSet />} />
                    </Route>
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;