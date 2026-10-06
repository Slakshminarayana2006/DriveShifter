import axios from 'axios';

const api = axios.create({
    baseURL : "http://localhost:3000",
    withCredentials : true
});


const getDashboardStats = async () => {
    try {
        const response = await api.get('/api/dashboard/stats');

        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}


export {
    getDashboardStats
}