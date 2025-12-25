// config/test-config.js - Test Dosyaları İçin Konfigürasyon
const API_CONFIG = {
  // Ana IP adresi - sadece burayı değiştir!
  BASE_IP: '10.241.81.212',
  PORT: '4000',
  
  // Otomatik URL oluşturma
  get BASE_URL() {
    return `http://${this.BASE_IP}:${this.PORT}`;
  }
};

module.exports = { API_BASE_URL: API_CONFIG.BASE_URL };