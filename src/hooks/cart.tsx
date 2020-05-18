import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

export interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsString = await AsyncStorage.getItem('@GoMarket:products');

      if (productsString) {
        setProducts(JSON.parse(productsString));
      }
    }

    loadProducts();
  }, []);

  /**
   * Passos feitos:
   * -> Verificando a lista de produtos
   * -> Se o produto existe, então iremos procurar tal produto na lista dos mesmo, e incremetar uma unidade
   * -> Se o produto não existe, então ele é adicionado no final.
   * -> No final, o localstorage sempre é realimentado.
   */
  const addToCart = useCallback(
    async product => {
      const findedProduct = products.find(
        productItem => product.id === productItem.id,
      );

      let productAltered: Product[] = [];
      if (findedProduct) {
        productAltered = products.map(prodItem => {
          const prodMap = prodItem;
          if (prodMap.id === product.id) {
            prodMap.quantity += 1;
          }

          return prodMap;
        });
      } else {
        productAltered = [...products, { ...product, quantity: 1 }];
      }

      setProducts(productAltered);
      await AsyncStorage.setItem(
        '@GoMarket:products',
        JSON.stringify(productAltered),
      );
    },
    [products],
  );

  /**
   * 1 - Procurar o produto no banco local
   * 2 - Incrementar uma unidade
   * 3 - Salvar no storage
   */
  const increment = useCallback(
    async id => {
      let productsDB = products;

      // Altera os produtos direto no banco
      productsDB = productsDB.map(product => {
        const prodMap = product;
        if (prodMap.id === id) {
          prodMap.quantity += 1;
        }
        return prodMap;
      });

      // Depois dá set nos produtos.
      setProducts(productsDB);
      await AsyncStorage.setItem(
        '@GoMarket:products',
        JSON.stringify(productsDB),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      // TODO DECREMENTS A PRODUCT QUANTITY IN THE CART

      let productsDB = products;

      const findedProduct = productsDB.find(
        product => product.id === id,
      ) as Product;

      if (findedProduct !== undefined) {
        if (findedProduct.quantity === 1) {
          productsDB = productsDB.filter(product => product.id !== id);
        } else {
          productsDB = productsDB.map(product => {
            const prodMap = product;
            if (prodMap.id === id) {
              prodMap.quantity -= 1;
            }
            return prodMap;
          });
        }
      }

      setProducts(productsDB);
      await AsyncStorage.setItem(
        '@GoMarket:products',
        JSON.stringify(productsDB),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
