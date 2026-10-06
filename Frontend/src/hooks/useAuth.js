import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { login, logout } from "../services/auth.service";

const useAuth = () => {
    const { loading, setLoading, user, setUser } =
        useContext(AuthContext);

    const handleLogin = async (credential) => {
        try {
            setLoading(true);

            const response = await login(credential);

            setUser(response.user);

            return response;
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            setLoading(true);

            await logout();
            setUser(null);
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        setLoading,
        user,
        setUser,
        handleLogin,
        handleLogout
    };
};

export default useAuth;