'use client'

import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import supabase from '../utils/supabaseClient' // your supabase client import
import { getProductById, getAllProducts } from '../services/productService'
import NavBar from '../components/AccountNavBar' // Adjust path to your NavBar component
import { format } from 'date-fns'

// --- NotificationModal Component ---
function NotificationModal({ message, type, onClose }) {
  const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700';
  const icon = type === 'success' ? '✅' : '❌';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black opacity-30" onClick={onClose}></div> {/* Overlay */}
      <div className={`relative ${bgColor} border rounded-lg p-6 shadow-xl max-w-sm w-full transform transition-all scale-100 opacity-100 duration-300 ease-out`}>
        <div className="flex items-center">
          <div className="flex-shrink-0 text-3xl mr-4">{icon}</div>
          <div className="flex-grow">
            <p className="text-lg font-semibold">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Copy to Clipboard Button Component ---
function CopyToClipboardButton({ textToCopy, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Potentially show a notification/toast about failure
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-150 active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
      title={`Copy ${label}`}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}

// --- Order Status ProgressBar Component ---
function OrderStatusProgressBar({ status }) {
  // Define the order of statuses for the progress bar
  const statuses = ['pending', 'processing', 'shipped', 'delivered']; // Removed 'cancelled' as it's an end state, not a progress step

  const currentIndex = statuses.indexOf(status.toLowerCase());

  const getStatusColor = (index) => {
    if (index <= currentIndex) {
      return 'bg-green-500'; // Completed/current steps are green
    }
    return 'bg-gray-300'; // Future steps are grey
  };

  return (
    <div className="flex justify-between items-center text-sm font-medium text-gray-500 my-6">
      {statuses.map((s, index) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getStatusColor(index)}`}>
              {index + 1}
            </div>
            <p className="mt-2 text-center capitalize text-gray-700">{s}</p> {/* Ensure text color is visible */}
          </div>
          {index < statuses.length - 1 && (
            <div className={`flex-1 h-1 rounded-full mx-2 ${getStatusColor(index)}`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// --- Order Card Component (for listing all orders) ---
function OrderCard({ order }) {
  const navigate = useNavigate();
  const latestItemImage = order.order_items?.[0]?.products?.image_url || 'https://via.placeholder.com/60x60.png?text=Item';

  return (
    <div
      onClick={() => navigate(`/order/${order.id}`)}
      className="bg-white rounded-lg shadow-md p-6 mb-4 cursor-pointer hover:shadow-lg transition-shadow duration-200"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
            
          Order ID: <span className="font-mono text-base bg-gray-50 px-2 py-1 rounded ml-2">{order.id.substring(0, 8)}...</span>
          <CopyToClipboardButton textToCopy={order.id} label="Copy ID" />
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {order.order_state}
        </span>
      </div>
      <div className="flex items-center space-x-4 mb-4">
        <img src={latestItemImage} alt="Order Item" className="w-16 h-16 rounded-md object-cover border" />
        <div>
          <p className="text-gray-600 text-sm">Placed on: {format(new Date(order.created_at), 'MMM dd, yyyy')}</p>
          <p className="text-gray-800 font-semibold">Total: ₹{order.total_amount.toFixed(2)}</p>
        </div>
      </div>
      {console.log(order)}
      <OrderStatusProgressBar status={order.order_state} />
      <p className="text-sm text-gray-500 mt-2">
        Items: {order.order_items?.length || 0}
      </p>
    </div>
  );
}


// --- Main Order Details Page Component ---
export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });


  useEffect(() => {
    async function fetchUserDataAndOrders() {
      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Please log in to view your orders.");
          setNotification({ show: true, message: 'Please log in to view your orders.', type: 'error' });
          setLoading(false);
          return;
        }
        setUser(user);

        if (id) {
          // Fetch a specific order
          const { data, error: orderError } = await supabase
            .from('orders')
            .select(`
              *,
              order_items (
                id, quantity, price_at_purchase, color, size,
                products (id, title, price, image_url, image_alt)
              )
            `)
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

          if (orderError) {
            if (orderError.code === 'PGRST116') {
              setError("Order not found or you don't have permission to view it.");
              setNotification({ show: true, message: "Order not found or you don't have permission to view it.", type: 'error' });
            } else {
              throw orderError;
            }
          }
          setOrder(data);
        } else {
          // Fetch all orders for the logged-in user
          const { data, error: allOrdersError } = await supabase
            .from('orders')
            .select(`
              id, created_at, total_amount, order_state,
              order_items (products (image_url))
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (allOrdersError) throw allOrdersError;
          setAllOrders(data || []);
        }
      } catch (err) {
        console.error("Error fetching order(s):", err);
        setError(err.message || "Failed to fetch orders.");
        setNotification({ show: true, message: err.message || "Failed to fetch orders.", type: 'error' });
      } finally {
        setLoading(false);
      }
    }

    fetchUserDataAndOrders();
  }, [id, navigate]);

  if (loading) {
    return <div className="text-center py-10 text-gray-600 text-lg">Loading order details...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600 text-lg">
        {error}
        {!user && (
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Log In
          </button>
        )}
      </div>
    );
  }

  // Render specific order details
  if (id) {
    if (!order) {
      return (
        <div className="text-center py-10 text-gray-600 text-lg">
          No order found for ID: {id}.
          <button
            onClick={() => navigate('/order')}
            className="mt-4 px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            View All Orders
          </button>
        </div>
      );
    }

    const subtotal = order.order_items.reduce((sum, item) => sum + item.price_at_purchase * item.quantity, 0);
    const taxRate = 0.08;
    const shipping = 99;
    const tax = subtotal * taxRate;

    return (
      <>
        <NavBar />
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        
        {notification.show && (
            <NotificationModal
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification({ ...notification, show: false })}
            />
        )}
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">Order Details</h2>
          <p className="text-gray-600 text-center mb-8 flex items-center justify-center">
            Order ID: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded ml-2">{order.id}</span>
            <CopyToClipboardButton textToCopy={order.id} />
            <br />
          </p>
            We will call you to update your order status

          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Order Status: <span className="capitalize">{order.order_state}</span></h3> {/* Use order.order_state */}
            <OrderStatusProgressBar status={order.order_state} /> {/* Pass order.order_state */}
            <p className="text-sm text-gray-500 mt-4">
              Placed on: {format(new Date(order.created_at), 'MMMM dd, yyyy hh:mm a')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Shipping Information */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Shipping Information</h3>
              <p className="text-gray-700"><strong>{order.shipping_full_name}</strong></p> {/* Corrected field name */}
              <p className="text-gray-600">{order.shipping_address}</p>
              <p className="text-gray-600">{order.shipping_city}, {order.shipping_state} {order.shipping_zip}</p>
              <p className="text-gray-600">Phone: {order.shipping_phone}</p>
            </div>

            {/* Payment Information */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Payment Information</h3>
              <p className="text-gray-700"><strong>Payment Method:</strong> Razorpay</p>
              <p className="text-gray-600 flex items-center">
                Payment ID: <span className="font-mono text-xs ml-1">{order.razorpay_payment_id}</span>
                <CopyToClipboardButton textToCopy={order.razorpay_payment_id} />
              </p>
              <p className="text-gray-600 flex items-center">
                Order ID (Razorpay): <span className="font-mono text-xs ml-1">{order.razorpay_order_id}</span>
                <CopyToClipboardButton textToCopy={order.razorpay_order_id} />
              </p>
            </div>
          </div>

          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Items in Order</h3>
          <ul className="divide-y divide-gray-200 mb-6 border rounded-lg">
            {order.order_items.length > 0 ? (
              order.order_items.map((item) => (
                <li key={item.id} className="flex py-4 items-center px-4">
                  <img
                    src={item.products?.image_url || 'https://via.placeholder.com/80x80.png?text=No+Image'}
                    alt={item.products?.title || 'Product Image'}
                    className="w-20 h-20 object-cover rounded-md border"
                  />
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between text-gray-700 font-medium">
                      <span>{item.products?.title || 'Unknown Product'}</span>
                      <span>₹{(item.price_at_purchase * item.quantity).toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    {(item.color || item.size) && (
                      <p className="text-sm text-gray-500">
                        {item.color && `Color: ${item.color}`}
                        {item.color && item.size && ` | `}
                        {item.size && `Size: ${item.size}`}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">Price per item: ₹{item.price_at_purchase.toFixed(2)}</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="py-4 text-center text-gray-500">No items found for this order.</li>
            )}
          </ul>

          <div className="space-y-2 text-md text-gray-700 mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>₹{shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({taxRate * 100}%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="border-t pt-4 flex justify-between font-bold text-lg text-gray-800">
              <span>Total</span>
              <span>₹{order.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <button
              onClick={() => navigate('/order')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition shadow"
            >
              View All My Orders
            </button>
          </div>
        </div>
      </div>
      </>
    );
  }

  // Render all orders
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {notification.show && (
          <NotificationModal
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification({ ...notification, show: false })}
          />
      )}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">My Orders</h2>
        {allOrders.length === 0 ? (
          <div className="text-center py-10 text-gray-600 text-xl">You haven't placed any orders yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}