import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RedirectIfAuth = ({ children }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            navigate('/library');
        }
    }, [navigate]);

    return children;
};

export default RedirectIfAuth;