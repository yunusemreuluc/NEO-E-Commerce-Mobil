// utils/debugAuth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const debugAuthState = async () => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    const userData = await AsyncStorage.getItem('user_data');
    
    console.log('🔍 Auth Debug:');
    console.log('Token var mı:', !!token);
    console.log('Token (ilk 20 karakter):', token?.substring(0, 20) + '...');
    console.log('User data:', userData ? JSON.parse(userData) : null);
    
    return {
      hasToken: !!token,
      token: token?.substring(0, 20) + '...',
      user: userData ? JSON.parse(userData) : null
    };
  } catch (error) {
    console.error('Debug auth hatası:', error);
    return null;
  }
};

export const clearAuthDebug = async () => {
  try {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
    console.log('🧹 Auth verileri temizlendi');
  } catch (error) {
    console.error('Auth temizleme hatası:', error);
  }
};