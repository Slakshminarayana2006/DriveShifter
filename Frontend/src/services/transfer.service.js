import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});


const getTransferHistory = async () => {
    try {
        const response = await api.get('/api/transfer/history');
        return response.data;
    } catch (error) {
        console.log(error.message);
        throw error
    }
}

const transferFiles = async (fileIds) => {
  const response = await api.post(
    `/api/transfer`,
    { fileIds }
  );

  return response.data.data || response.data;
};

const transferFolder = async (folderId) => {
  const response = await api.post(
    `/api/transfer/folder/${encodeURIComponent(folderId)}`,
    {},
  );

  return response.data.data || response.data;
};


export {
    getTransferHistory,
    transferFiles,
    transferFolder
}
