import { createContext, useEffect, useState } from "react";
import { getUser } from "../services/auth.service";


export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getTheUserAndSet = async () => {
            try {
                const data = await getUser();
                if(data?.user) {
                    setUser(data.user);
                }
            }
            catch (error) {
                setUser(null);
                console.log(error);
            }
            finally {
                setLoading(false);
            }
        }

        getTheUserAndSet();
    }, []);

    return (
        <AuthContext.Provider value={{user, loading, setLoading, setUser}}>
            {children}
        </AuthContext.Provider>
    )
}