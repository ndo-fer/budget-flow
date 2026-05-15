// src/screens/ProductScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Platform, StatusBar, Alert } from 'react-native';
import { ProductCatalog } from '../components/buyer/ProductCatalog';
import { colors } from '../constants/colors';

// Dummy data to demonstrate the UI
const dummyProducts = [
  { id: '1', name: 'Nasi Goreng Spesial', description: 'Nasi goreng dengan telor, ayam, sosis', price: 25000, stock: 15, category: 'Food' },
  { id: '2', name: 'Es Teh Manis', description: 'Teh manis dingin menyegarkan', price: 5000, stock: 50, category: 'Beverage' },
  { id: '3', name: 'Kerupuk Udang', description: 'Renyah gurih', price: 2000, stock: 0, category: 'Snacks' },
  { id: '4', name: 'Mie Ayam Pangsit', description: 'Mie ayam komplit', price: 20000, stock: 10, category: 'Food' },
  { id: '5', name: 'Kopi Susu Gula Aren', description: 'Kopi susu legit kekinian', price: 18000, stock: 3, category: 'Beverage' },
];

export default function ProductScreen() {
  const [products] = useState(dummyProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ProductCatalog
          products={filteredProducts}
          categories={['Food', 'Beverage', 'Snacks']}
          searchQuery={searchQuery}
          categoryFilter={categoryFilter}
          totalCount={filteredProducts.length}
          isLoading={false}
          onAddToCart={(product) => {
            if (Platform.OS === 'web') {
              window.alert(`Added ${product.name} to cart!`);
            } else {
              Alert.alert('Sukses', `Berhasil menambahkan ${product.name} ke keranjang!`);
            }
          }}
          onUpdateFilters={(search, category) => {
            setSearchQuery(search);
            setCategoryFilter(category);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});
