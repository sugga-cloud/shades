'use client'

import { useEffect, useState } from 'react'
import supabase from '../utils/supabaseClient' // Ensure this path is correct
import { useNavigate } from 'react-router-dom' // Import useNavigate from react-router-dom
import NavBar from '../components/AccountNavBar' // Assuming AccountNavBar is in NavBar.jsx

// --- NotificationModal Component (New) ---
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
// --- End NotificationModal Component ---

// --- Constants for Edge Function URLs ---
const RAZORPAY_ORDER_FUNCTION_URL = 'https://wgiuubiflletlmzuriwi.supabase.co/functions/v1/create-razorpay-order';
const EMAIL_HANDLER_FUNCTION_URL = 'https://wgiuubiflletlmzuriwi.supabase.co/functions/v1/smooth-handler';
// --- End Constants ---

export default function CheckoutPage() {
  const navigate = useNavigate(); // Initialize useNavigate for redirection

  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  });
  const [orderItems, setOrderItems] = useState([]);
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false); // To prevent double clicks

  // Notification state
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // --- Utility for currency formatting ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
            setNotification({ show: true, message: 'You must be logged in to proceed with checkout.', type: 'error' });
            // Optionally, redirect to login page after a delay
            setTimeout(() => navigate('/login'), 3000); // Redirect after 3 seconds
            throw new Error('Not logged in. Please log in to proceed with checkout.');
        }
        setSession(session);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        setUser(user);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('fullName, address, city, state, zip, phone')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('Profile not found for user, continuing with empty shipping info.');
        }

        if (profile) {
          setShippingInfo({
            fullName: profile.fullName || '',
            address: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            zip: profile.zip || '',
            phone: profile.phone || '',
          });
        }

        const { data: cartData, error: cartError } = await supabase
          .from('cart_items')
          .select(`id, quantity, color, size, products (id, title, price, image_url)`)
          .eq('user_id', user.id);

        if (cartError) throw cartError;
        setOrderItems(cartData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => setNotification({ show: true, message: 'Failed to load Razorpay SDK. Please check your internet connection.', type: 'error' });
    document.body.appendChild(script);

    // Clean up script on unmount
    return () => {
      // Check if the script exists before trying to remove it
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const subtotal = orderItems.reduce(
    (sum, item) => sum + (item.products?.price || 0) * item.quantity,
    0
  );
  const shippingCost = 50.0; // Example fixed shipping cost in INR
  const taxRate = 0.08; // Example 8% tax
  const taxAmount = subtotal * taxRate;
  const total = subtotal + shippingCost + taxAmount;

  // --- New Function to Send Email Notification ---
  const sendEmailNotification = async (orderId, orderTotal, customerEmail, customerName, orderItemsDetails) => {
    const subject = `Order Confirmation - #${orderId} from The Shade Store`;

    const orderSummaryHtml = orderItemsDetails.map(item => `
      <li>
        <strong>${item.quantity}x ${item.title}</strong> (${item.color ? `Color: ${item.color}, ` : ''}${item.size ? `Size: ${item.size}` : ''})
        - ${formatCurrency(item.quantity * item.price)}
      </li>
    `).join('');

    const messageHtml = `
      <p>Dear ${customerName || 'Customer'},</p>
      <p>Thank you for your order with The Shade Store! Your order #${orderId} has been successfully placed and payment of ${formatCurrency(orderTotal)} has been received.</p>
      <p><strong>Order Summary:</strong></p>
      <ul>${orderSummaryHtml}</ul>
      <p><strong>Total Paid:</strong> ${formatCurrency(orderTotal)}</p>
      <p>We will send you another update once your order has been shipped.</p>
      <p>If you have any questions, please contact us.</p>
      <p>Best regards,<br>The Shade Store Team</p>
    `;

    try {
      const response = await fetch(EMAIL_HANDLER_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`, // Authenticate with your user's session
        },
        body: JSON.stringify({
          subject: subject,
          message: messageHtml,
          phone: shippingInfo.phone,
          // You might want to pass 'to' and 'from' emails if your Edge Function supports specific routing,
          // but based on your smooth-handler, it might internally use ADMIN_EMAIL for admin and user.email for user.
          // The smooth-handler is designed to send to both user and admin based on the user's session.
        }),
      });

      if (response.ok) {
        console.log('Order confirmation email sent successfully.');
      } else {
        const errorData = await response.json();
        console.error('Failed to send order confirmation email:', errorData.error);
      }
    } catch (emailError) {
      console.error('Network error sending email notification:', emailError);
    }
  };
  // --- End New Function ---

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsProcessingOrder(true); // Disable button to prevent multiple submissions
    setNotification({ show: false, message: '', type: '' }); // Clear any existing notifications

    if (!user || !session) {
      setNotification({ show: true, message: 'You must be logged in to place an order.', type: 'error' });
      setIsProcessingOrder(false);
      return;
    }
    if (orderItems.length === 0) {
      setNotification({ show: true, message: 'Your cart is empty. Please add items before placing an order.', type: 'error' });
      setIsProcessingOrder(false);
      return;
    }
    if (!razorpayLoaded) {
      setNotification({ show: true, message: 'Payment gateway is still loading. Please wait a moment and try again.', type: 'error' });
      setIsProcessingOrder(false);
      return;
    }

    const { fullName, address, city, state, zip, phone } = shippingInfo;
    if (!fullName || !address || !city || !state || !zip || !phone) {
        setNotification({ show: true, message: 'Please fill in all shipping information fields.', type: 'error' });
        setIsProcessingOrder(false);
        return;
    }

    try {
      // 1. Create Razorpay Order on your Supabase Edge Function
      const res = await fetch(RAZORPAY_ORDER_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ amount: Math.round(total * 100) }), // Razorpay expects amount in paisa
      });

      const data = await res.json();

      if (!res.ok) {
        setNotification({ show: true, message: 'Failed to initiate payment: ' + (data?.error || 'Unknown error.'), type: 'error' });
        console.error('Error creating Razorpay order:', data);
        setIsProcessingOrder(false);
        return;
      }

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: 'rzp_live_yAPlrcW1eFbPEZ', // Your Razorpay Test Key (replace with production key when live)
        amount: data.amount,
        currency: data.currency,
        name: 'The Shade Store',
        description: 'Order Payment',
        order_id: data.id,
        prefill: {
          name: shippingInfo.fullName,
          email: user.email,
          contact: shippingInfo.phone,
        },
        theme: {
          color: '#FACC15', // A nice yellow from Tailwind
        },
        handler: async function (response) {
          console.log('Razorpay Payment Success:', response);

          try {
            // 3. Save Order to Supabase `orders` table
            const { data: order, error: orderError } = await supabase
              .from('orders')
              .insert({
                user_id: user.id,
                total_amount: total,
                shipping_full_name: shippingInfo.fullName,
                shipping_address: shippingInfo.address,
                shipping_city: shippingInfo.city,
                shipping_state: shippingInfo.state,
                shipping_zip: shippingInfo.zip,
                shipping_phone: shippingInfo.phone,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                status: 'paid',
              })
              .select()
              .single();

            if (orderError) throw orderError;
            console.log('Order saved successfully:', order);

            // 4. Prepare and Save Order Items to Supabase `order_items` table
            const orderItemsToInsert = orderItems.map(item => {
              if (!item.products || !item.products.id) {
                throw new Error(`Missing product details for item in cart (Cart Item ID: ${item.id}). Please check your cart items for inconsistencies.`);
              }
              return {
                order_id: order.id,
                product_id: item.products.id,
                quantity: item.quantity,
                price_at_purchase: item.products.price,
                color: item.color || null,
                size: item.size || null,
              };
            });

            const { error: orderItemError } = await supabase
              .from('order_items')
              .insert(orderItemsToInsert);

            if (orderItemError) throw orderItemError;
            console.log('Order items saved successfully.');

            // 5. Clear the User's Cart after successful order creation
            const { error: clearCartError } = await supabase
               .from('cart_items')
               .delete()
               .eq('user_id', user.id);

            if (clearCartError) {
              console.error('Warning: Failed to clear cart after successful order:', clearCartError.message);
            }

            // --- Send Email Notification After Successful Order Saving ---
            const simplifiedOrderItems = orderItems.map(item => ({
              title: item.products?.title,
              quantity: item.quantity,
              price: item.products?.price,
              color: item.color,
              size: item.size,
            }));

            // Don't await this, let it run in the background as it's not critical path for UX
            sendEmailNotification(order.id, total, user.email, shippingInfo.fullName, simplifiedOrderItems);
            // --- End Email Notification Call ---

            setNotification({ show: true, message: `Payment Successful! Your order has been placed. Order ID: ${order.id}`, type: 'success' });
            setOrderItems([]); // Clear local state after successful order
            navigate(`/order/${order.id}`); // Redirect to the order details page using useNavigate

          } catch (saveError) {
            console.error("Error saving order details to database after successful payment:", saveError.message);
            setNotification({ show: true, message: `Payment was successful, but there was an issue saving your order details. Please contact support with your payment ID: ${response.razorpay_payment_id}.`, type: 'error' });
          } finally {
            setIsProcessingOrder(false);
          }
        },
        modal: {
          ondismiss: function () {
            setNotification({ show: true, message: 'Payment was cancelled or failed. Please try again.', type: 'error' });
            console.log('Razorpay modal dismissed.');
            setIsProcessingOrder(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Error during order placement initiation:', err);
      setNotification({ show: true, message: 'An error occurred while trying to place your order: ' + err.message, type: 'error' });
      setIsProcessingOrder(false);
    }
  };

  if (loading) return <div className="text-center py-10 text-lg font-medium text-gray-700">Loading your checkout details...</div>;
  if (error) return <div className="text-center py-10 text-red-600 text-lg font-medium">Error: {error}. Please try again later.</div>;
  if (!user && !loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <NotificationModal
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
      />
      <h1 className="text-4xl font-bold tracking-tight text-red-600 text-center mb-6">Access Denied</h1>
      <p className="text-lg text-gray-700 text-center">Please log in to proceed with checkout.</p>
      {/* You might want to add a login button here */}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <NavBar /> {/* Render the NavBar component here */}
      {notification.show && (
        <NotificationModal
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}

      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center text-gray-900 mb-12 tracking-tight">Checkout</h1>

        <form onSubmit={handlePlaceOrder} className="lg:grid lg:grid-cols-3 lg:gap-10">
          {/* Shipping Information Section */}
          <section className="lg:col-span-2 bg-white p-8 rounded-xl shadow-lg mb-8 lg:mb-0">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Shipping Information</h2>
            <div className="grid grid-cols-1 gap-y-7 sm:grid-cols-2 sm:gap-x-8">
              {['fullName', 'address', 'city', 'state', 'zip', 'phone'].map((field) => (
                <Input
                  key={field}
                  label={field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  name={field}
                  value={shippingInfo[field]}
                  onChange={handleShippingChange}
                  smSpan={field === 'address' ? 2 : undefined}
                  type={field === 'phone' ? 'tel' : 'text'}
                />
              ))}
            </div>
          </section>

          {/* Order Summary Section */}
          <section className="lg:col-span-1 bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Order Summary</h2>
            <ul className="divide-y divide-gray-200">
              {orderItems.length > 0 ? (
                orderItems.map((item) => (
                  <li key={item.id} className="flex py-5 items-center">
                    <img
                      src={item.products?.image_url || 'https://via.placeholder.com/96x96.png?text=No+Image'}
                      alt={item.products?.title || 'Product image'}
                      className="size-24 rounded-lg object-cover border border-gray-200 shadow-sm"
                    />
                    <div className="ml-5 flex-1">
                      <div className="flex justify-between text-base font-semibold text-gray-900 mb-1">
                        <h3>{item.products?.title || 'Unknown Product'}</h3>
                        <p>{formatCurrency(item.products?.price || 0)}</p> {/* Rupee symbol */}
                      </div>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      {(item.color || item.size) && (
                        <p className="text-sm text-gray-600">
                          {item.color && `Color: ${item.color}`}
                          {item.color && item.size && ` | `}
                          {item.size && `Size: ${item.size}`}
                        </p>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <li className="py-4 text-center text-gray-500">Your cart is empty. Please add items to your cart.</li>
              )}
            </ul>
            <div className="mt-8 space-y-4 text-lg text-gray-800">
              <div className="flex justify-between">
                <p>Subtotal</p>
                <p className="font-medium">{formatCurrency(subtotal)}</p> {/* Rupee symbol */}
              </div>
              <div className="flex justify-between">
                <p>Shipping</p>
                <p className="font-medium">{formatCurrency(shippingCost)}</p> {/* Rupee symbol */}
              </div>
              <div className="flex justify-between">
                <p>Tax (8%)</p>
                <p className="font-medium">{formatCurrency(taxAmount)}</p> {/* Rupee symbol */}
              </div>
              <div className="flex justify-between font-bold text-2xl pt-6 border-t-2 border-gray-200 mt-6">
                <p>Total</p>
                <p>{formatCurrency(total)}</p> {/* Rupee symbol */}
              </div>
            </div>
            <button
              type="submit"
              className="mt-10 w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-extrabold py-4 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-opacity-75 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!razorpayLoaded || orderItems.length === 0 || isProcessingOrder}
            >
              {isProcessingOrder ? 'Processing Order...' : 'Place Order'}
            </button>
            {!razorpayLoaded && (
              <p className="text-orange-500 text-sm mt-3 text-center">Loading payment gateway...</p>
            )}
            {orderItems.length === 0 && (
                <p className="text-red-500 text-sm mt-3 text-center">Add items to your cart to place an order.</p>
            )}
          </section>
        </form>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange, smSpan, type = 'text' }) {
  return (
    <div className={smSpan ? `sm:col-span-${smSpan}` : ''}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="mt-1">
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-base px-4 py-2 placeholder-gray-400 text-gray-900 transition duration-150 ease-in-out"
          placeholder={`Enter your ${label.toLowerCase()}`}
        />
      </div>
    </div>
  );
}