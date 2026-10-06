import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});
const login = async (credential) => {
    try {
        const response = await api.post('/api/auth/google', {
            credentials : credential
        });
        return response.data;
    }
    catch(error) {
        console.log(error);
        throw error;
    }
}

const logout = async () => {
    try {
        const response = await api.post('/api/auth/logout');
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

const getUser = async () => {
    try {
        const response  = await api.get('/api/auth/me');
        return response.data
    }
    catch(error) {
        throw error;
    }
}

export {
    getUser,
    logout,
    login
}
