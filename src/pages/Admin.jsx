'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { Dialog, DialogPanel, DialogBackdrop, Transition, TransitionChild } from '@headlessui/react'
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { v4 as uuidv4 } from 'uuid' // optional for dummy ID fallback
import supabase from '../utils/supabaseClient'
import NavBar from '../components/AccountNavBar' // Adjust path as needed
import Orders from '../components/OrderManagement' // Adjust path as needed
import {
  createProduct as supabaseCreateProduct,
  updateProduct as supabaseUpdateProduct,
  deleteProduct as supabaseDeleteProduct,
  getAllProducts as supabaseGetAllProducts,
} from '../services/productService'  // adjust path as needed

import {
  createCategory as supabaseCreateCategory,
  updateCategory as supabaseUpdateCategory,
  deleteCategory as supabaseDeleteCategory,
  getAllCategories as supabaseGetAllCategories,
} from '../services/categoryService' // Adjust path

// Utility function for conditional class names
function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Dummy Data
const initialProducts = [
  {
    id: 'prod1',
    name: 'Classic White Tee',
    price: '$25.00',
    imageUrl: 'https://placehold.co/64x64/FFD700/333333?text=Tee',
    imageAlt: 'Classic white t-shirt',
    categoryIds: ['cat1'],
  },
  {
    id: 'prod2',
    name: 'Slim Fit Blue Jeans',
    price: '$75.00',
    imageUrl: 'https://placehold.co/64x64/FFD700/333333?text=Jeans',
    imageAlt: 'Slim fit blue jeans',
    categoryIds: ['cat2'],
  },
  {
    id: 'prod3',
    name: 'Green Beanie Hat',
    price: '$15.00',
    imageUrl: 'https://placehold.co/64x64/FFD700/333333?text=Beanie',
    imageAlt: 'Green beanie hat',
    categoryIds: ['cat3', 'cat1'], // Example of multiple categories
  },
];

const initialCategories = [
  { id: 'cat1', name: 'Apparel' },
  { id: 'cat2', name: 'Bottoms' },
  { id: 'cat3', name: 'Accessories' },
];

const initialOffers = [
  {
    id: 'offer1',
    name: 'Summer Sale',
    code: 'SUMMER20',
    discountType: 'percentage',
    value: 20,
    minOrderAmount: 50,
    active: true,
    expiresAt: '2024-08-31',
  },
  {
    id: 'offer2',
    name: 'New Customer Discount',
    code: 'WELCOME10',
    discountType: 'fixed',
    value: 10,
    minOrderAmount: 30,
    active: false,
    expiresAt: '2024-12-31',
  },
];

const initialOrders = [
  {
    id: 'ORD001',
    date: '2024-07-01',
    total: 120.00,
    status: 'Delivered',
    items: [
      { name: 'Classic White Tee', quantity: 1, price: 25.00 },
      { name: 'Slim Fit Blue Jeans', quantity: 1, price: 75.00 },
      { name: 'Shipping', quantity: 1, price: 5.00 },
      { name: 'Tax', quantity: 1, price: 15.00 },
    ],
  },
  {
    id: 'ORD002',
    date: '2024-06-25',
    total: 45.00,
    status: 'Processing',
    items: [
      { name: 'Green Beanie Hat', quantity: 2, price: 15.00 },
      { name: 'Shipping', quantity: 1, price: 5.00 },
      { name: 'Tax', quantity: 1, price: 10.00 },
    ],
  },
  {
    id: 'ORD003',
    date: '2024-06-10',
    total: 90.00,
    status: 'Shipped',
    items: [
      { name: 'Cozy Black Hoodie', quantity: 1, price: 60.00 },
      { name: 'Shipping', quantity: 1, price: 5.00 },
      { name: 'Tax', quantity: 1, price: 25.00 },
    ],
  },
];


export default function AdminPage() {
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [offers, setOffers] = useState(initialOffers);
  const [orders, setOrders] = useState(initialOrders); // New state for orders

  const [totalItemsSold, setTotalItemsSold] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

  const [currentProduct, setCurrentProduct] = useState(null); // For editing product
  const [currentCategory, setCurrentCategory] = useState(null); // For editing category
  const [currentOffer, setCurrentOffer] = useState(null); // For editing offer

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    imageUrl: '',
    imageAlt: '',
    categoryIds: [],
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
  });
  const [offerForm, setOfferForm] = useState({
    name: '',
    code: '',
    discountType: 'percentage',
    value: 0,
    minOrderAmount: 0,
    active: true,
    expiresAt: '',
  });

  // Calculate total items sold and total earnings whenever orders change
  useEffect(() => {
    let itemsSold = 0;
    let earnings = 0;
    orders.forEach(order => {
      earnings += order.total;
      order.items.forEach(item => {
        // Only count actual product items, not shipping/tax
        if (item.name !== 'Shipping' && item.name !== 'Tax') {
          itemsSold += item.quantity;
        }
      });
    });
    setTotalItemsSold(itemsSold);
    setTotalEarnings(earnings);
  }, [orders]);


// Load products from Supabase on mount
useEffect(() => {
  const fetchProducts = async () => {
    try {
      const productsFromDb = await supabaseGetAllProducts()
      setProducts(productsFromDb)
    } catch (err) {
      console.error('Error fetching products:', err.message)
      alert('Failed to load products.')
    }
  }
  fetchProducts()
}, [])

// Open add modal
const openAddProductModal = () => {
  setCurrentProduct(null)
  setProductForm({ name: '', price: '', imageUrl: '', imageAlt: '', categoryIds: [] })
  setIsProductModalOpen(true)
}

// Open edit modal with existing data
const openEditProductModal = (product) => {
  setCurrentProduct(product)
  setProductForm({
    name: product.title,            // Note: product.title from DB
    price: product.price,
    imageUrl: product.image_url,
    imageAlt: product.image_alt,
    categoryIds: product.categoryIds || [],  // if using categories
  })
  setIsProductModalOpen(true)
}

// Handle form input change
const handleProductFormChange = (e) => {
  const { name, value } = e.target
  setProductForm(prev => ({ ...prev, [name]: value }))
}

// Handle image file input, convert to base64 string (or upload to storage in real app)
const handleProductImageUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onloadend = () => {
      setProductForm(prev => ({ ...prev, imageUrl: reader.result }))
    }
    reader.readAsDataURL(file)
  } else {
    setProductForm(prev => ({ ...prev, imageUrl: '' }))
  }
}

// Handle category checkbox toggle (if applicable)
const handleProductCategoryChange = (categoryId, isChecked) => {
  console.log('Category ID:', categoryId, 'Checked:', isChecked);
  setProductForm(prev => {
    const newCategoryIds = isChecked
      ? [...prev.categoryIds, categoryId]
      : prev.categoryIds.filter(id => id !== categoryId)
    return { ...prev, categoryIds: newCategoryIds }
  })
}

// Save product — create or update in Supabase, then update local state
const saveProduct = async (e) => {
  e.preventDefault()

  try {
    if (currentProduct) {
      // Update product in Supabase
      await supabaseUpdateProduct(currentProduct.id, productForm)

      // Update locally for immediate UI feedback
      setProducts(prev =>
        prev.map(p => (p.id === currentProduct.id ? { ...p, ...productForm } : p))
      )

      alert('Product updated successfully!')
    } else {
      // Create product in Supabase
      const createdProduct = await supabaseCreateProduct(productForm)
      
      // Add new product locally
      setProducts(prev => [...prev, createdProduct])

      alert('Product added successfully!')
    }
    setIsProductModalOpen(false)
  } catch (err) {
    console.error('Error saving product:', err.message)
    alert('Failed to save product. Please try again.')
  }
}

// Delete product both in Supabase and locally
const deleteProduct = async (productId) => {
  if (!window.confirm('Are you sure you want to delete this product?')) return

  try {
    await supabaseDeleteProduct(productId)

    setProducts(prev => prev.filter(p => p.id !== productId))
    alert('Product deleted successfully!')
  } catch (err) {
    console.error('Error deleting product:', err.message)
    alert('Failed to delete product.')
  }
}

  // --- Category CRUD Operations ---

// Load categories from Supabase on mount
useEffect(() => {
  const fetchCategories = async () => {
    try {
      const categoriesFromDb = await supabaseGetAllCategories()
      setCategories(categoriesFromDb)
    } catch (err) {
      console.error('Error fetching categories:', err.message)
      alert('Failed to load categories.')
    }
  }
  fetchCategories()
}, [])

// Open add modal
const openAddCategoryModal = () => {
  setCurrentCategory(null)
  setCategoryForm({ name: '' })
  setIsCategoryModalOpen(true)
}

// Open edit modal with existing data
const openEditCategoryModal = (category) => {
  setCurrentCategory(category)
  setCategoryForm({ name: category.name })
  setIsCategoryModalOpen(true)
}

// Handle input change
const handleCategoryFormChange = (e) => {
  const { name, value } = e.target
  setCategoryForm(prev => ({ ...prev, [name]: value }))
}

// Save category (create or update)
const saveCategory = async (e) => {
  e.preventDefault()

  try {
    if (currentCategory) {
      // Update category in Supabase
      await supabaseUpdateCategory(currentCategory.id, categoryForm)

      // Update locally
      setCategories(prev =>
        prev.map(c => (c.id === currentCategory.id ? { ...c, ...categoryForm } : c))
      )

      alert('Category updated successfully!')
    } else {
      // Create new category in Supabase
      const createdCategory = await supabaseCreateCategory(categoryForm)

      // Add locally
      setCategories(prev => [...prev, createdCategory])

      alert('Category added successfully!')
    }
    setIsCategoryModalOpen(false)
  } catch (err) {
    console.error('Error saving category:', err.message)
    alert('Failed to save category. Please try again.')
  }
}

// Delete category
const deleteCategory = async (categoryId) => {
  if (!window.confirm('Are you sure you want to delete this category? This will also remove it from all associated products.')) return

  try {
    await supabaseDeleteCategory(categoryId)

    // Remove locally
    setCategories(prev => prev.filter(c => c.id !== categoryId))

    // Remove this category from all products that reference it
    setProducts(prev =>
      prev.map(p => ({
        ...p,
        categoryIds: p.categoryIds.filter(id => id !== categoryId),
      }))
    )

    alert('Category and its references in products deleted successfully!')
  } catch (err) {
    console.error('Error deleting category:', err.message)
    alert('Failed to delete category.')
  }
}

// --- Offer CRUD Operations ---
const openAddOfferModal = () => {
  setCurrentOffer(null);
  setOfferForm({
    name: '',
    code: '',
    discountType: 'percentage',
    value: 0,
    minOrderAmount: 0,
    active: true,
    expiresAt: '',
  });
  setIsOfferModalOpen(true);
};

const openEditOfferModal = (offer) => {
  setCurrentOffer(offer);
  setOfferForm({
    name: offer.name,
    code: offer.code,
    discountType: offer.discount_type,
    value: offer.value,
    minOrderAmount: offer.min_order_amount,
    active: offer.active,
    expiresAt: offer.expires_at?.split('T')[0] || '',
  });
  setIsOfferModalOpen(true);
};

const handleOfferFormChange = (e) => {
  const { name, value, type, checked } = e.target;
  setOfferForm(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value,
  }));
};

const saveOffer = async (e) => {
  e.preventDefault();
  const newOffer = {
    name: offerForm.name,
    code: offerForm.code,
    discount_type: offerForm.discountType,
    value: parseFloat(offerForm.value),
    min_order_amount: parseFloat(offerForm.minOrderAmount),
    active: offerForm.active,
    expires_at: offerForm.expiresAt ? new Date(offerForm.expiresAt).toISOString() : null,
  };

  try {
    if (currentOffer) {
      const { error } = await supabase
        .from('offers')
        .update(newOffer)
        .eq('id', currentOffer.id);

      if (error) throw error;

      setOffers(prev =>
        prev.map(o => (o.id === currentOffer.id ? { ...o, ...newOffer } : o))
      );
      alert('Offer updated successfully!');
    } else {
      const { data, error } = await supabase
        .from('offers')
        .insert([newOffer])
        .select()
        .single();

      if (error) throw error;

      setOffers(prev => [...prev, data]);
      alert('Offer added successfully!');
    }

    setIsOfferModalOpen(false);
  } catch (err) {
    console.error('Error saving offer:', err.message);
    alert('Failed to save offer. Please try again.');
  }
};

const deleteOffer = async (offerId) => {
  if (!window.confirm("Are you sure you want to delete this offer?")) return;

  try {
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', offerId);

    if (error) throw error;

    setOffers(prev => prev.filter(o => o.id !== offerId));
    alert('Offer deleted successfully!');
  } catch (err) {
    console.error('Error deleting offer:', err.message);
    alert('Failed to delete offer.');
  }
};



  // Helper to get category names from IDs
  const getCategoryNames = (categoryIds) => {
    if (!categoryIds || categoryIds.length === 0) return 'N/A';
    return categoryIds.map(id => {
      const category = categories.find(cat => cat.id === id);
      return category ? category.name : 'Unknown';
    }).join(', ');
  };

  return (
    <div className="min-h-screen bg-gray-100 font-inter py-12 px-4 sm:px-6 lg:px-8">
<NavBar />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 text-center mb-10">Admin Panel</h1>

        {/* Products Management Section */}
        <section aria-labelledby="products-management-heading" className="bg-white p-8 rounded-lg shadow-md mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 id="products-management-heading" className="text-2xl font-semibold text-gray-900">Products Management</h2>
            <button
              type="button"
              onClick={openAddProductModal}
              className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            >
              <PlusIcon className="-ml-1 mr-2 size-5" aria-hidden="true" />
              Add Product
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img className="size-16 rounded-md object-cover" src={product.image_url || `https://placehold.co/64x64/FFD700/333333?text=N/A`} alt={product.imageAlt} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.price}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getCategoryNames(product.categoryIds)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEditProductModal(product)} className="text-yellow-600 hover:text-yellow-900 mr-4">
                        <PencilIcon className="size-5 inline-block" />
                        <span className="sr-only">Edit {product.name}</span>
                      </button>
                      <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:text-red-900">
                        <TrashIcon className="size-5 inline-block" />
                        <span className="sr-only">Delete {product.name}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Categories Management Section */}
        <section aria-labelledby="categories-management-heading" className="bg-white p-8 rounded-lg shadow-md mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 id="categories-management-heading" className="text-2xl font-semibold text-gray-900">Categories Management</h2>
            <button
              type="button"
              onClick={openAddCategoryModal}
              className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            >
              <PlusIcon className="-ml-1 mr-2 size-5" aria-hidden="true" />
              Add Category
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEditCategoryModal(category)} className="text-yellow-600 hover:text-yellow-900 mr-4">
                        <PencilIcon className="size-5 inline-block" />
                        <span className="sr-only">Edit {category.name}</span>
                      </button>
                      <button onClick={() => deleteCategory(category.id)} className="text-red-600 hover:text-red-900">
                        <TrashIcon className="size-5 inline-block" />
                        <span className="sr-only">Delete {category.name}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Offers Management Section */}
        <section aria-labelledby="offers-management-heading" className="bg-white p-8 rounded-lg shadow-md mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 id="offers-management-heading" className="text-2xl font-semibold text-gray-900">Offers Management</h2>
            <button
              type="button"
              onClick={openAddOfferModal}
              className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            >
              <PlusIcon className="-ml-1 mr-2 size-5" aria-hidden="true" />
              Add Offer
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {offers.map((offer) => (
                  <tr key={offer.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{offer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{offer.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{offer.discountType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {offer.discountType === 'percentage' ? `${offer.value}%` : `$${offer.value.toFixed(2)}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={classNames(
                        offer.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full'
                      )}>
                        {offer.active ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEditOfferModal(offer)} className="text-yellow-600 hover:text-yellow-900 mr-4">
                        <PencilIcon className="size-5 inline-block" />
                        <span className="sr-only">Edit {offer.name}</span>
                      </button>
                      <button onClick={() => deleteOffer(offer.id)} className="text-red-600 hover:text-red-900">
                        <TrashIcon className="size-5 inline-block" />
                        <span className="sr-only">Delete {offer.name}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Orders Management Section */}
<Orders />
      </div>

      {/* Product Modal */}
      <Transition show={isProductModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsProductModalOpen(false)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <DialogBackdrop className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </TransitionChild>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                      onClick={() => setIsProductModalOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="size-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div>
                    <div className="mt-3 text-center sm:mt-0 sm:text-left">
                      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{currentProduct ? 'Edit Product' : 'Add New Product'}</h3>
                      <form onSubmit={saveProduct} className="space-y-4">
                        <div>
                          <label htmlFor="product-name" className="block text-sm font-medium text-gray-700">Product Name</label>
                          <input
                            type="text"
                            name="name"
                            id="product-name"
                            value={productForm.name}
                            onChange={handleProductFormChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2"
                          />
                        </div>
                        <div>
                          <label htmlFor="product-price" className="block text-sm font-medium text-gray-700">Price ($)</label>
                          <input
                            type="text"
                            name="price"
                            id="product-price"
                            value={productForm.price}
                            onChange={handleProductFormChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2"
                          />
                        </div>
                        <div>
                          <label htmlFor="product-image-upload" className="block text-sm font-medium text-gray-700">Product Image</label>
                          <input
                            type="file"
                            id="product-image-upload"
                            accept="image/*"
                            onChange={handleProductImageUpload}
                            className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-gray-50 focus:outline-none focus:border-yellow-500 focus:ring-yellow-500"
                          />
                          {productForm.imageUrl && (
                            <div className="mt-2">
                              <img src={productForm.imageUrl} alt="Product Preview" className="size-24 object-cover rounded-md border border-gray-200" />
                              <p className="text-xs text-gray-500 mt-1">Image Preview (Base64)</p>
                            </div>
                          )}
                           <p className="text-xs text-gray-500 mt-1">
                            Note: In a real application, images would be uploaded to cloud storage (e.g., Firebase Storage) and only the URL saved here.
                          </p>
                        </div>
                        <div>
                          <label htmlFor="product-image-alt" className="block text-sm font-medium text-gray-700">Image Alt Text</label>
                          <input
                            type="text"
                            name="imageAlt"
                            id="product-image-alt"
                            value={productForm.imageAlt}
                            onChange={handleProductFormChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Categories</label>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {categories.map(category => (
                              <div key={category.id} className="flex items-center">
                                <input
                                  id={`product-category-${category.id}`}
                                  type="checkbox"
                                  checked={productForm.categoryIds.includes(category.id)}
                                  onChange={(e) => handleProductCategoryChange(category.id, e.target.checked)}
                                  className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                                />
                                <label htmlFor={`product-category-${category.id}`} className="ml-2 text-sm text-gray-900">{category.name}</label>
                              </div>
                            ))}
                            {categories.length === 0 && (
                              <p className="text-sm text-gray-500 col-span-2">No categories available. Add some first!</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-5 sm:mt-6">
                          <button
                            type="submit"
                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-yellow-500 px-4 py-2 text-base font-medium text-gray-900 shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 sm:text-sm"
                          >
                            {currentProduct ? 'Save Changes' : 'Add Product'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Category Modal */}
      <Transition show={isCategoryModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsCategoryModalOpen(false)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <DialogBackdrop className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </TransitionChild>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                      onClick={() => setIsCategoryModalOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="size-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div>
                    <div className="mt-3 text-center sm:mt-0 sm:text-left">
                      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{currentCategory ? 'Edit Category' : 'Add New Category'}</h3>
                      <form onSubmit={saveCategory} className="space-y-4">
                        <div>
                          <label htmlFor="category-name" className="block text-sm font-medium text-gray-700">Category Name</label>
                          <input
                            type="text"
                            name="name"
                            id="category-name"
                            value={categoryForm.name}
                            onChange={handleCategoryFormChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2"
                          />
                        </div>
                        <div className="mt-5 sm:mt-6">
                          <button
                            type="submit"
                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-yellow-500 px-4 py-2 text-base font-medium text-gray-900 shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 sm:text-sm"
                          >
                            {currentCategory ? 'Save Changes' : 'Add Category'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Offer Modal */}
      <Transition show={isOfferModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOfferModalOpen(false)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <DialogBackdrop className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </TransitionChild>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                      onClick={() => setIsOfferModalOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="size-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div>
                    <div className="mt-3 text-center sm:mt-0 sm:text-left">
                      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{currentOffer ? 'Edit Offer' : 'Add New Offer'}</h3>
                      <form onSubmit={saveOffer} className="space-y-4">
                        <div>
                          <label htmlFor="offer-name" className="block text-sm font-medium text-gray-700">Offer Name</label>
                          <input
                            type="text"
                            name="name"
                            id="offer-name"
                            value={offerForm.name}
                            onChange={handleOfferFormChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2"
                          />
                        </div>
                        <div>
                          <label htmlFor="offer-code" className="block text-sm font-medium text-gray-700">Offer Code</label>
                          <input
                            type="text"
                            name="code"
                            id="offer-code"
                            value={offerForm.code}
                            onChange={handleOfferFormChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2"
                          />
                        </div>
                        <div>
                          <label htmlFor="discount-type" className="block text-sm font-medium text-gray-700">Discount Type</label>
                          <select
                            id="discount-type"
                            name="discountType"
                            value={offerForm.discountType}
                            onChange={handleOfferFormChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2"
                          >
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed Amount</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="offer-value" className="block text-sm font-medium text-gray-700">Discount Value</label>
                          <input
                            type="number"
                            name="value"
                            id="offer-value"
                            value={offerForm.value}
                            onChange={handleOfferFormChange}
                            required
                            min="0"
                            step={offerForm.discountType === 'percentage' ? "1" : "0.01"}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2"
                          />
                        </div>
                        <div>
                          <label htmlFor="min-order-amount" className="block text-sm font-medium text-gray-700">Minimum Order Amount</label>
                          <input
                            type="number"
                            name="minOrderAmount"
                            id="min-order-amount"
                            value={offerForm.minOrderAmount}
                            onChange={handleOfferFormChange}
                            min="0"
                            step="0.01"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2"
                          />
                        </div>
                        <div>
                          <label htmlFor="expires-at" className="block text-sm font-medium text-gray-700">Expires At (YYYY-MM-DD)</label>
                          <input
                            type="date"
                            name="expiresAt"
                            id="expires-at"
                            value={offerForm.expiresAt}
                            onChange={handleOfferFormChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            id="offer-active"
                            name="active"
                            type="checkbox"
                            checked={offerForm.active}
                            onChange={handleOfferFormChange}
                            className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                          />
                          <label htmlFor="offer-active" className="ml-2 block text-sm text-gray-900">Active</label>
                        </div>
                        <div className="mt-5 sm:mt-6">
                          <button
                            type="submit"
                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-yellow-500 px-4 py-2 text-base font-medium text-gray-900 shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 sm:text-sm"
                          >
                            {currentOffer ? 'Save Changes' : 'Add Offer'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
