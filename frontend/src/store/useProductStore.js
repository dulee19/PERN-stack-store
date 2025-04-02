import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";

// Base URL will be dynamic depending on the environment
const BASE_URL = "http://localhost:5000";

export const useProductStore = create((set, get) => ({
  // Products state
  products: [],
  loading: false,
  error: null,
  currentProduct: null,

  // Form state
  formData: {
    name: "",
    price: "",
    image: "",
  },

  setFormData: (formData) => set({ formData }),
  resetForm: () => set({ formData: { name: "", price: "", image: "" } }),

  // Add product
  addProduct: async (e) => {
    e.preventDefault();

    set({ loading: true });

    try {
      const { formData } = get();
      await axios.post(`${BASE_URL}/api/products`, formData);
      await get().fetchProducts();
      get().resetForm();

      toast.success("Product added successfully");
      document.querySelector("#add_product_modal").close();

      // Close the modal
    } catch (error) {
      console.log("Error in addProduct", error);
      toast.error("Something went wrong");
    } finally {
      set({ loading: false });
    }
  },

  // Fetch products
  fetchProducts: async () => {
    set({ loading: true });

    try {
      const response = await axios.get(`${BASE_URL}/api/products`);
      set({ products: response.data.data, error: null });
    } catch (error) {
      if (error.status === 429)
        set({ error: "Rate limit exceeded", products: [] });
      else set({ error: "Something went wrong", products: [] });
    } finally {
      set({ loading: false });
    }
  },

  // Fetch Product by ID
  fetchProduct: async (id) => {
    set({ loading: true });

    try {
      const response = await axios(`${BASE_URL}/api/products/${id}`);
      set({
        currentProduct: response.data.data,
        formData: response.data.data,
        error: null,
      });
    } catch (error) {
      console.log("Error in fetchProduct", error);
      set({ error: "Something went wrong", currentProduct: null });
    } finally {
      set({ loading: false });
    }
  },

  // Update Product
  updateProduct: async (id) => {
    set({ loading: true });

    try {
      const { formData } = get();
      const response = await axios.put(
        `${BASE_URL}/api/products/${id}`,
        formData
      );
      set({ currentProduct: response.data.data });
      toast.success("Product updated successfully");
    } catch (error) {
      toast.success("Error in updateProduct", error);
    } finally {
      set({ loading: false });
    }
  },

  // Delete Product
  deleteProduct: async (id) => {
    set({ loading: true });

    try {
      await axios.delete(`${BASE_URL}/api/products/${id}`);
      set((prev) => ({ products: prev.products.filter(product.id !== id) }));
      toast.success("Product deleted successfully");
    } catch (error) {
      console.log("Error deleting product", error);
      toast.error("Something went wrong");
    } finally {
      set({ loading: false });
    }
  },
}));
