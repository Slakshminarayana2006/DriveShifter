import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

const getFiles = async () => {
    try {
        const response = await api.get('/api/drive/files');
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log(error.message);
        throw error
    }
}

const getFilesByFolder = async(folderId) => {
    try {
        const response = await api.get(`api/drive/files/${folderId}`);
        return response.data;
    } catch (error) {
        console.log(error.message);
        throw error
    }
}

const getFileDetails = async(fileId) => {
    try {
        const response = await api.get(`api/drive/file/${fileId}`);
        return response.data;
    } catch (error) {
        console.log(error.message);
        throw error
    }
}
const searchFiles = async(query) => {
    try {
        const response = await api.get("/api/drive/files/search", {
        params: {
            q: query,
        },
        });
        return response.data;
    } catch (error) {
        console.log(error.message);
        throw error
    }
}

const getDestinationAccount = async() => {
    try {
        const response = await api.get("/api/drive/destination/account");
        
        return response.data;
    } catch (error) {
        console.log(error.message);
        throw error;
    }
    
}

const disconnectDestinationAccount = async () => {
    try {
        const response = await api.delete(
            "/api/drive/destination/disconnect"
        );

        return response.data;
    } catch (error) {
        console.log(error.message);
        throw error;
    }
};

export {
    searchFiles,
    getFileDetails,
    getFilesByFolder,
    getFiles,
    getDestinationAccount,
    disconnectDestinationAccount
}
