// src/components/buyer/ProductCatalog.js
import React, { useState, useCallback } from 'react';  
import {  
  View,  
  Text,  
  StyleSheet,  
  FlatList,  
  Image,  
  TouchableOpacity,  
  Platform,  
  ActivityIndicator,  
} from 'react-native';  
import { Input } from '../ui/Input';  
import { Button } from '../ui/Button';  
import { Card, CardContent } from '../ui/Card';  
import { Badge } from '../ui/Badge';  

export function ProductCatalog({  
  products = [],  
  categories = [],  
  searchQuery = '',  
  categoryFilter = 'all',  
  totalCount = 0,  
  isLoading = false,  
  onAddToCart,  
  onUpdateFilters,  
}) {  
  const [search, setSearch] = useState(searchQuery);  
  const [category, setCategory] = useState(categoryFilter);  

  const handleApply = useCallback(() => {  
    if (onUpdateFilters) onUpdateFilters(search, category);  
  }, [search, category, onUpdateFilters]);  

  const handleReset = useCallback(() => {  
    setSearch('');  
    setCategory('all');  
    if (onUpdateFilters) onUpdateFilters('', 'all');  
  }, [onUpdateFilters]);  

  const formatPrice = (price) => {  
    return `Rp ${price.toLocaleString('id-ID')}`;  
  };  

  const getStockColor = (stock) => {  
    if (stock <= 0) return 'destructive';  
    if (stock <= 5) return 'warning';  
    return 'default';  
  };  

  const renderProduct = useCallback(  
    ({ item }) => (  
      <Card style={styles.productCard}>  
        <View style={styles.imageContainer}>  
          <Image  
            source={{ uri: item.image_url || 'https://via.placeholder.com/300x200' }}  
            style={styles.image}  
            resizeMode="cover"  
          />  
          {item.stock <= 0 && (  
            <View style={styles.stockOverlay}>  
              <Text style={styles.stockOverlayText}>Habis</Text>  
            </View>  
          )}  
        </View>  

        <CardContent style={styles.cardContent}>  
          <View style={styles.headerRow}>  
            <Text style={styles.productName} numberOfLines={2}>  
              {item.name}  
            </Text>  
            {item.category && (  
              <Badge variant="secondary" size="sm" style={styles.categoryBadge}>  
                {item.category}  
              </Badge>  
            )}  
          </View>  

          {item.description && (  
            <Text style={styles.productDescription} numberOfLines={2}>  
              {item.description}  
            </Text>  
          )}  

          <View style={styles.footerRow}>  
            <View>  
              <Text style={styles.price}>{formatPrice(item.price)}</Text>  
              <Badge  
                variant={getStockColor(item.stock)}  
                size="sm"  
                style={styles.stockBadge}  
              >  
                {item.stock > 0 ? `Stok: ${item.stock}` : 'Stok Habis'}  
              </Badge>  
            </View>  
            <Button  
              size="sm"  
              disabled={item.stock <= 0}  
              onPress={() => onAddToCart && onAddToCart(item)}  
              style={styles.addButton}  
            >  
              {item.stock <= 0 ? 'Habis' : 'Beli'}  
            </Button>  
          </View>  
        </CardContent>  
      </Card>  
    ),  
    [onAddToCart]  
  );  

  const renderHeader = () => (  
    <View style={styles.filterSection}>  
      <Text style={styles.filterTitle}>Filter Produk</Text>  

      <Input  
        placeholder="Cari produk..."  
        value={search}  
        onChangeText={setSearch}  
        label="Nama Produk"  
      />  

      <View style={styles.categorySection}>  
        <Text style={styles.categoryLabel}>Kategori</Text>  
        <FlatList  
          horizontal  
          showsHorizontalScrollIndicator={false}  
          data={['all', ...categories]}  
          keyExtractor={(item) => item}  
          renderItem={({ item }) => (  
            <TouchableOpacity  
              style={[  
                styles.categoryPill,  
                category === item && styles.categoryPillActive,  
              ]}  
              onPress={() => setCategory(item)}  
            >  
              <Text  
                style={[  
                  styles.categoryPillText,  
                  category === item && styles.categoryPillTextActive,  
                ]}  
              >  
                {item === 'all' ? 'Semua' : item}  
              </Text>  
            </TouchableOpacity>  
          )}  
          contentContainerStyle={styles.categoryList}  
        />  
      </View>  

      <View style={styles.buttonGroup}>  
        <Button  
          style={{ flex: 1, marginRight: 8 }}  
          onPress={handleApply}  
        >  
          Terapkan  
        </Button>  
        <Button  
          variant="outline"  
          style={{ flex: 1 }}  
          onPress={handleReset}  
        >  
          Reset  
        </Button>  
      </View>  

      <View style={styles.infoBox}>  
        <Text style={styles.infoText}>  
          Menampilkan <Text style={styles.infoNumber}>{products.length}</Text> dari{' '}  
          <Text style={styles.infoNumber}>{totalCount}</Text> produk  
        </Text>  
      </View>  
    </View>  
  );  

  const renderEmpty = () => (  
    <View style={styles.emptyContainer}>  
      <Text style={styles.emptyIcon}>📦</Text>  
      <Text style={styles.emptyTitle}>Produk Tidak Ditemukan</Text>  
      <Text style={styles.emptyText}>  
        Coba ubah filter atau cari dengan kata kunci yang berbeda  
      </Text>  
    </View>  
  );  

  const renderFooter = () => {  
    if (!isLoading) return null;  
    return (  
      <View style={styles.loadingFooter}>  
        <ActivityIndicator size="large" color="#2563eb" />  
      </View>  
    );  
  };  

  return (  
    <FlatList  
      data={products}  
      keyExtractor={(item) => item.id}  
      renderItem={renderProduct}  
      ListHeaderComponent={renderHeader}  
      ListEmptyComponent={renderEmpty}  
      ListFooterComponent={renderFooter}  
      contentContainerStyle={styles.listContainer}  
      scrollEnabled={false}  // if rendering inside scrollview, usually false
    />  
  );  
}  

const styles = StyleSheet.create({  
  listContainer: {  
    padding: 16,  
    paddingBottom: 32,  
  },  

  // Filter Section  
  filterSection: {  
    marginBottom: 24,  
    padding: 16,  
    backgroundColor: '#f9fafb',  
    borderRadius: 12,  
    borderWidth: 1,  
    borderColor: '#e5e7eb',  
  },  

  filterTitle: {  
    fontSize: 16,  
    fontWeight: '600',  
    color: '#0f172a',  
    marginBottom: 16,  
  },  

  categorySection: {  
    marginBottom: 16,  
  },  

  categoryLabel: {  
    fontSize: 14,  
    fontWeight: '500',  
    color: '#0f172a',  
    marginBottom: 8,  
  },  

  categoryList: {  
    paddingVertical: 4,  
  },  

  categoryPill: {  
    paddingHorizontal: 16,  
    paddingVertical: 8,  
    borderRadius: 20,  
    backgroundColor: '#ffffff',  
    marginRight: 8,  
    borderWidth: 1,  
    borderColor: '#e5e7eb',  
    justifyContent: 'center',  
    alignItems: 'center',  
    ...Platform.select({  
      ios: {  
        shadowColor: '#000',  
        shadowOffset: { width: 0, height: 1 },  
        shadowOpacity: 0.05,  
        shadowRadius: 2,  
      },  
      android: {  
        elevation: 1,  
      },  
      web: {  
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',  
      },  
    }),  
  },  

  categoryPillActive: {  
    backgroundColor: '#2563eb',  
    borderColor: '#2563eb',  
  },  

  categoryPillText: {  
    fontSize: 14,  
    color: '#374151',  
    fontWeight: '500',  
  },  

  categoryPillTextActive: {  
    color: '#ffffff',  
    fontWeight: '600',  
  },  

  buttonGroup: {  
    flexDirection: 'row',  
    marginBottom: 12,  
  },  

  infoBox: {  
    paddingHorizontal: 12,  
    paddingVertical: 8,  
    backgroundColor: '#dbeafe',  
    borderRadius: 8,  
    borderLeftWidth: 4,  
    borderLeftColor: '#2563eb',  
  },  

  infoText: {  
    fontSize: 13,  
    color: '#0f172a',  
    lineHeight: 18,  
  },  

  infoNumber: {  
    fontWeight: '600',  
    color: '#2563eb',  
  },  

  // Product Card  
  productCard: {  
    marginBottom: 16,  
    overflow: 'hidden',  
  },  

  imageContainer: {  
    width: '100%',  
    height: 200,  
    backgroundColor: '#f3f4f6',  
    position: 'relative',  
  },  

  image: {  
    width: '100%',  
    height: '100%',  
  },  

  stockOverlay: {  
    position: 'absolute',  
    top: 0,  
    left: 0,  
    right: 0,  
    bottom: 0,  
    backgroundColor: 'rgba(0, 0, 0, 0.5)',  
    justifyContent: 'center',  
    alignItems: 'center',  
  },  

  stockOverlayText: {  
    fontSize: 18,  
    fontWeight: 'bold',  
    color: '#ffffff',  
  },  

  cardContent: {  
    padding: 16,  
  },  

  headerRow: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'flex-start',  
    marginBottom: 8,  
  },  

  productName: {  
    flex: 1,  
    fontSize: 15,  
    fontWeight: '600',  
    color: '#0f172a',  
    lineHeight: 20,  
    marginRight: 8,  
  },  

  categoryBadge: {  
    alignSelf: 'flex-start',  
  },  

  productDescription: {  
    fontSize: 12,  
    color: '#64748b',  
    marginBottom: 12,  
    lineHeight: 16,  
  },  

  footerRow: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'flex-end',  
  },  

  price: {  
    fontSize: 16,  
    fontWeight: '700',  
    color: '#2563eb',  
    marginBottom: 4,  
  },  

  stockBadge: {  
    marginTop: 4,  
  },  

  addButton: {  
    minWidth: 80,  
  },  

  // Empty State  
  emptyContainer: {  
    paddingVertical: 60,  
    alignItems: 'center',  
    justifyContent: 'center',  
  },  

  emptyIcon: {  
    fontSize: 48,  
    marginBottom: 12,  
  },  

  emptyTitle: {  
    fontSize: 16,  
    fontWeight: '600',  
    color: '#0f172a',  
    marginBottom: 8,  
  },  

  emptyText: {  
    fontSize: 14,  
    color: '#64748b',  
    textAlign: 'center',  
    paddingHorizontal: 32,  
  },  

  // Loading  
  loadingFooter: {  
    paddingVertical: 20,  
    justifyContent: 'center',  
    alignItems: 'center',  
  },  
});  
