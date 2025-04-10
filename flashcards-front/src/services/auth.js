
export const registerUser = async (name, password) => {
    const response = await fetch(`${process.env.REACT_APP_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, password })
    });

    console.log("(registerUser)", name, password)
    return response;
};

export const loginUser = async (name, password) => {
    return fetch(`${process.env.REACT_APP_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
    });
};

export const logout = () => {
    localStorage.removeItem('jwtToken');
};

export const createAI = async (token, aiText) => {
    return fetch(`${process.env.REACT_APP_URL}/ai/cards`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
        },
        body: JSON.stringify({text: aiText})
    });
}