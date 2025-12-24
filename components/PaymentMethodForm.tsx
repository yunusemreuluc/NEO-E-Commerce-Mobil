// components/PaymentMethodForm.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useOrder } from '../contexts/OrderContext';
import { paymentService } from '../services/paymentService';

interface PaymentMethodFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

export const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const { addPaymentMethod } = useOrder();
  
  const [formData, setFormData] = useState({
    card_holder_name: '',
    card_number: '',
    exp_month: '',
    exp_year: '',
    cvv: '',
    is_default: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.card_holder_name.trim()) {
      newErrors.card_holder_name = 'Kart sahibi adı gereklidir';
    }

    if (!formData.card_number.trim()) {
      newErrors.card_number = 'Kart numarası gereklidir';
    } else if (!paymentService.validateCardNumber(formData.card_number)) {
      newErrors.card_number = 'Geçersiz kart numarası';
    }

    if (!formData.exp_month.trim()) {
      newErrors.exp_month = 'Ay gereklidir';
    } else {
      const month = parseInt(formData.exp_month);
      if (month < 1 || month > 12) {
        newErrors.exp_month = 'Geçersiz ay (1-12)';
      }
    }

    if (!formData.exp_year.trim()) {
      newErrors.exp_year = 'Yıl gereklidir';
    } else {
      const year = parseInt(formData.exp_year);
      const currentYear = new Date().getFullYear();
      if (year < currentYear || year > currentYear + 20) {
        newErrors.exp_year = 'Geçersiz yıl';
      }
    }

    if (!formData.cvv.trim()) {
      newErrors.cvv = 'CVV gereklidir';
    } else {
      const cardBrand = paymentService.getCardBrand(formData.card_number);
      if (!paymentService.validateCVV(formData.cvv, cardBrand)) {
        newErrors.cvv = cardBrand === 'amex' ? 'CVV 4 haneli olmalıdır' : 'CVV 3 haneli olmalıdır';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      await addPaymentMethod({
        card_holder_name: formData.card_holder_name,
        card_number: formData.card_number,
        exp_month: parseInt(formData.exp_month),
        exp_year: parseInt(formData.exp_year),
        cvv: formData.cvv,
        is_default: formData.is_default,
      });

      Alert.alert('Başarılı', 'Kart başarıyla eklendi');
      onSubmit();
    } catch (error) {
      Alert.alert('Hata', error instanceof Error ? error.message : 'Kart eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Hata varsa temizle
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatCardNumber = (value: string) => {
    const formatted = paymentService.formatCardNumber(value);
    updateField('card_number', formatted);
  };

  const formatExpiry = (field: 'exp_month' | 'exp_year', value: string) => {
    // Sadece rakam kabul et
    const numericValue = value.replace(/\D/g, '');
    
    if (field === 'exp_month') {
      // Ay için maksimum 2 karakter
      const month = numericValue.slice(0, 2);
      updateField(field, month);
    } else {
      // Yıl için maksimum 4 karakter
      const year = numericValue.slice(0, 4);
      updateField(field, year);
    }
  };

  const cardBrand = paymentService.getCardBrand(formData.card_number);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Yeni Kart Ekle</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        {/* Demo Uyarısı */}
        <View style={styles.demoWarning}>
          <Ionicons name="shield-checkmark" size={20} color="#28a745" />
          <Text style={styles.demoText}>
            Bu demo ortamıdır. Gerçek kart bilgilerinizi girmeyiniz.
          </Text>
        </View>

        {/* Kart Sahibi Adı */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kart Sahibi Adı *</Text>
          <TextInput
            style={[styles.input, errors.card_holder_name && styles.inputError]}
            value={formData.card_holder_name}
            onChangeText={(value) => updateField('card_holder_name', value.toUpperCase())}
            placeholder="AD SOYAD"
            maxLength={50}
            autoCapitalize="characters"
          />
          {errors.card_holder_name && (
            <Text style={styles.errorText}>{errors.card_holder_name}</Text>
          )}
        </View>

        {/* Kart Numarası */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kart Numarası *</Text>
          <View style={styles.cardNumberContainer}>
            <TextInput
              style={[styles.input, styles.cardNumberInput, errors.card_number && styles.inputError]}
              value={formData.card_number}
              onChangeText={formatCardNumber}
              placeholder="1234 5678 9012 3456"
              keyboardType="numeric"
              maxLength={19} // 16 rakam + 3 boşluk
            />
            {cardBrand !== 'unknown' && (
              <View style={styles.cardBrandIcon}>
                <Text style={styles.cardBrandText}>{cardBrand.toUpperCase()}</Text>
              </View>
            )}
          </View>
          {errors.card_number && (
            <Text style={styles.errorText}>{errors.card_number}</Text>
          )}
        </View>

        {/* Son Kullanma Tarihi ve CVV */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Ay *</Text>
            <TextInput
              style={[styles.input, errors.exp_month && styles.inputError]}
              value={formData.exp_month}
              onChangeText={(value) => formatExpiry('exp_month', value)}
              placeholder="MM"
              keyboardType="numeric"
              maxLength={2}
            />
            {errors.exp_month && (
              <Text style={styles.errorText}>{errors.exp_month}</Text>
            )}
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Yıl *</Text>
            <TextInput
              style={[styles.input, errors.exp_year && styles.inputError]}
              value={formData.exp_year}
              onChangeText={(value) => formatExpiry('exp_year', value)}
              placeholder="YYYY"
              keyboardType="numeric"
              maxLength={4}
            />
            {errors.exp_year && (
              <Text style={styles.errorText}>{errors.exp_year}</Text>
            )}
          </View>
        </View>

        {/* CVV */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>CVV *</Text>
          <TextInput
            style={[styles.input, styles.cvvInput, errors.cvv && styles.inputError]}
            value={formData.cvv}
            onChangeText={(value) => updateField('cvv', value.replace(/\D/g, ''))}
            placeholder={cardBrand === 'amex' ? '1234' : '123'}
            keyboardType="numeric"
            maxLength={cardBrand === 'amex' ? 4 : 3}
            secureTextEntry
          />
          {errors.cvv && (
            <Text style={styles.errorText}>{errors.cvv}</Text>
          )}
        </View>

        {/* Varsayılan Kart */}
        <View style={styles.switchGroup}>
          <Text style={styles.label}>Varsayılan Kart</Text>
          <Switch
            value={formData.is_default}
            onValueChange={(value) => updateField('is_default', value)}
            trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
            thumbColor={formData.is_default ? '#FFFFFF' : '#F4F3F4'}
          />
        </View>

        {/* Güvenlik Bilgisi */}
        <View style={styles.securityInfo}>
          <Ionicons name="lock-closed" size={16} color="#28a745" />
          <Text style={styles.securityText}>
            Kart bilgileriniz güvenli şekilde şifrelenir ve saklanır
          </Text>
        </View>

        {/* Butonlar */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>İptal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Ekleniyor...' : 'Kartı Ekle'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  form: {
    padding: 20,
  },
  demoWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4EDDA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  demoText: {
    fontSize: 14,
    color: '#155724',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  cardNumberContainer: {
    position: 'relative',
  },
  cardNumberInput: {
    paddingRight: 60,
  },
  cardBrandIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cardBrandText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  cvvInput: {
    maxWidth: 120,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 30,
    gap: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#28a745',
    flex: 1,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});