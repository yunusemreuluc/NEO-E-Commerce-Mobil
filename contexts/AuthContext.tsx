import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { API_BASE_URL, loginUser, registerUser } from '../api';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkTokenValidity: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Uygulama açılışında token kontrolü
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Auth status check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await loginUser(email, password);
      
      // Token ve kullanıcı bilgilerini kaydet
      await AsyncStorage.setItem('auth_token', response.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
      
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await registerUser(name, email, password);
      
      // Token ve kullanıcı bilgilerini kaydet
      await AsyncStorage.setItem('auth_token', response.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
      
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Token ve kullanıcı verilerini temizle
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      
      // Kullanıcı state'ini temizle
      setUser(null);
      
      // Diğer context'lerin de temizlenmesi için kısa bir bekleme
      setTimeout(() => {
        console.log('Kullanıcı çıkış yaptı, tüm veriler temizlendi');
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Token geçerliliğini kontrol eden fonksiyon
  const checkTokenValidity = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        return false;
      }
      
      // Backend'e token doğrulama isteği gönder
      const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Token geçersizse temizle
        await logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token validity check error:', error);
      // Hata durumunda güvenli tarafta kal
      await logout();
      return false;
    }
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    register,
    logout,
    checkTokenValidity,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
