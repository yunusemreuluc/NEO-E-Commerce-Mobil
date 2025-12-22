import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AddressListProps {
  addresses: any[];
  onEdit: (address: any) => void;
  onDelete: (id: number) => void;
  onSetDefault: (id: number) => void;
  loading?: boolean;
}

export const AddressList: React.FC<AddressListProps> = ({ 
  addresses, 
  loading,
  onEdit,
  onDelete,
  onSetDefault
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  if (!addresses || addresses.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Henüz adres eklenmemiş</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {addresses.map((address, index) => {
        if (!address) return null;
        
        return (
          <View key={index} style={styles.cardWrapper}>
            <LinearGradient
              colors={address.is_default ? ['#667eea', '#764ba2'] : ['#ffffff', '#f8f9fa']}
              style={styles.card}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <Ionicons 
                    name={address.is_default ? "home" : "location-outline"} 
                    size={20} 
                    color={address.is_default ? "#ffffff" : "#667eea"} 
                  />
                  <Text style={[styles.title, address.is_default && styles.titleDefault]}>
                    {address.title ? address.title : 'Adres'}
                  </Text>
                </View>
                {address.is_default ? (
                  <View style={styles.defaultBadge}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.defaultText}>Varsayılan</Text>
                  </View>
                ) : null}
              </View>
              
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Ionicons 
                    name="person-outline" 
                    size={16} 
                    color={address.is_default ? "#ffffff" : "#666"} 
                  />
                  <Text style={[styles.name, address.is_default && styles.textDefault]}>
                    {address.full_name ? address.full_name : ''}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons 
                    name="call-outline" 
                    size={16} 
                    color={address.is_default ? "#ffffff" : "#666"} 
                  />
                  <Text style={[styles.phone, address.is_default && styles.textDefault]}>
                    {address.phone ? address.phone : ''}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons 
                    name="location-outline" 
                    size={16} 
                    color={address.is_default ? "#ffffff" : "#666"} 
                  />
                  <Text style={[styles.address, address.is_default && styles.textDefault]}>
                    {address.full_address ? address.full_address : ''}
                  </Text>
                </View>
              </View>
              
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => onEdit(address)}
                >
                  <Ionicons name="pencil" size={16} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Düzenle</Text>
                </TouchableOpacity>
                
                {!address.is_default ? (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.starButton]}
                    onPress={() => onSetDefault(address.id)}
                  >
                    <Ionicons name="star-outline" size={16} color="#ffffff" />
                    <Text style={styles.actionButtonText}>Varsayılan</Text>
                  </TouchableOpacity>
                ) : null}
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => onDelete(address.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Sil</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
  },
  titleDefault: {
    color: '#ffffff',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  defaultText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 20,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
  },
  phone: {
    fontSize: 15,
    color: '#4a5568',
    flex: 1,
  },
  address: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
    flex: 1,
  },
  textDefault: {
    color: '#ffffff',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    minWidth: 80,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#4299e1',
  },
  starButton: {
    backgroundColor: '#ed8936',
  },
  deleteButton: {
    backgroundColor: '#e53e3e',
  },
  actionButtonText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
});