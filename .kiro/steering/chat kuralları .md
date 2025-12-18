---
inclusion: always
---

# Proje Geliştirme Kuralları

**Temel İletişim Kuralı:** Tüm yanıtlar Türkçe olarak verilmelidir.

## Genel Mimari ve Kod Yazım Kuralları

- **Mimari önceliği:** Kod yazmadan önce mimariyi açıkla ve mevcut dosya yapısını koru
- **Basitlik ilkesi:** Karmaşık çözümler yerine basit ve anlaşılır çözümler tercih et
- **Tek sorumluluk:** Her bileşen ve fonksiyon tek bir sorumluluğa sahip olmalı
- **Dosya boyutu:** Tek dosyada 500+ satır kod yazma, gerekirse modüllere böl
- **Okunabilirlik:** Kod okunabilirliği ile performansı dengele, ikisini de göz önünde bulundur

## React Native ve Expo Spesifik Kuralları

### Performans Optimizasyonları
- Büyük listelerde `FlatList` veya `SectionList` kullan
- Listelerde mutlaka `keyExtractor` belirt
- Render içinde anonim fonksiyon tanımlama
- Gerekli yerlerde `useCallback` ve `useMemo` kullan
- Gereksiz `useEffect` yazma
- Döngü içinde state güncellemesi yapma

### State Yönetimi
- State'i global yapmadan önce lokal çözümleri değerlendir
- UI ile iş mantığını aynı dosyada karıştırma
- Context kullanımında gereksiz re-render'ları önle

### Animasyon ve UI
- Animasyonlarda `useNativeDriver: true` kullan
- Basit animasyonlar için ağır kütüphaneler ekleme
- Kullanıcı görmediği animasyonları çalıştırma

## Kaynak Yönetimi ve Performans

- **Görsel optimizasyonu:** Büyük resimleri optimize et
- **Bellek yönetimi:** Memory leak riski olan yapılar kurma
- **Cleanup:** Async işlemler için iptal mekanizması kur
- **Arka plan işlemleri:** Sürekli çalışan gereksiz işlemler yazma

## Kod Kalitesi Standartları

- Production kodunda `console.log` bırakma
- Kullanılmayan import ve değişkenleri temizle
- Sihirli sayılar yerine anlamlı sabitler kullan
- Kodun amacını açıklayan yorumlar ekle
- "Sonra düzeltirim" mantığından kaçın

## AI Asistanı İçin Özel Kurallar

### Yanıt Kalitesi
- Varsayım yapma, belirsizlikleri belirt
- Alternatif çözümler sun
- Performans maliyetlerini açıkla
- Kütüphane önerilerini gerekçelendir

### Teslim Formatı
- Yazılan kodu kısa maddelerle özetle
- Olası performans risklerini belirt
- Geliştirilebilir noktaları ayrı başlıkta yaz
- Gerekirse daha basit alternatifler sun
- Potansiyel sorun senaryolarını açıkla

## Proje Yapısı Uyumluluğu

Bu proje Expo Router kullanan bir React Native e-ticaret uygulamasıdır:
- `app/` klasörü file-based routing için kullanılır
- `contexts/` klasöründe global state yönetimi yapılır
- `components/` klasöründe yeniden kullanılabilir bileşenler bulunur
- TypeScript kullanımı tercih edilir