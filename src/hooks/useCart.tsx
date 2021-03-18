import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productInCart = cart.find((product) => product.id === productId);

      if (!productInCart) {
        const productInApi = (await api.get(`products/${productId}`)).data;
        const productInStock = (await api.get(`stock/${productId}`)).data;

        if (productInStock.amount > 0) {
          setCart([...cart, { ...productInApi, amount: 1 }]);
          localStorage.setItem(
            "@RocketShoes:cart",
            JSON.stringify([...cart, { ...productInApi, amount: 1 }])
          );
          toast("Adicionado");
          return;
        }
      }

      if (productInCart) {
        const productInStock = (await api.get(`stock/${productId}`)).data;

        if (productInStock.amount > productInCart.amount) {
          const updatedCart = cart.map((productCurr) =>
            productCurr.id === productId
              ? { ...productCurr, amount: Number(productCurr.amount) + 1 }
              : productCurr
          );

          setCart(updatedCart);

          localStorage.setItem(
            "@RocketShoes:cart",
            JSON.stringify(updatedCart)
          );
          return;
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExistInCart = cart.find(
        (product) => product.id === productId
      );

      if (!productExistInCart) {
        toast.error("Erro na remoção do produto");
        return;
      }

      const newCart = cart.filter(
        (product: { id: number }) => product.id !== productId
      );

      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = (await api.get(`stock/${productId}`)).data.amount;
      const productExistInCart = cart.find(
        (product) => product.id === productId
      );

      console.log(!productExistInCart);

      if (!productExistInCart) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }

      if (amount < 1) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }

      if (stock < amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const updatedCart = cart.map((product) =>
        product.id === productId ? { ...product, amount: amount } : product
      );

      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
