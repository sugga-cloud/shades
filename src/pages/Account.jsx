// src/pages/MyAccountPage.jsx (or wherever your MyAccountPage component is located)

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // No need for 'Link' here as it's in AccountNavBar
import supabase from '../utils/supabaseClient';

// --- NEW: Import the AccountNavBar component ---
import AccountNavBar from '../components/AccountNavBar'; // Adjust this path if your NavBar.jsx is elsewhere

export default function MyAccountPage() {
  const navigate = useNavigate();

  const [profileInfo, setProfileInfo] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Currency formatter for Indian Rupees
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  useEffect(() => {
    async function fetchAccountData() {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          throw new Error('You must be logged in to view your account details.');
        }

        setUser(session.user);

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('fullName, address, city, state, zip, phone')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('Profile not found for user:', profileError.message);
        }

        if (profile) {
          setProfileInfo({
            fullName: profile.fullName || '',
            address: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            zip: profile.zip || '',
            phone: profile.phone || '',
          });
        }

        // Fetch recent orders and their items
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            total_amount,
            status,
            order_items (
              quantity,
              price_at_purchase,
              color,
              size,
              products (
                title,
                image_url
              )
            )
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (ordersError) {
          throw ordersError;
        }

        const formattedOrders = ordersData.map(order => ({
          id: order.id, // Keep the full ID for navigation
          displayId: order.id.substring(0, 8).toUpperCase(), // For display only
          date: new Date(order.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          total: order.total_amount,
          status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
          items: order.order_items.map(item => ({
            name: item.products?.title || 'Unknown Product',
            quantity: item.quantity,
            price: item.price_at_purchase,
            color: item.color,
            size: item.size,
            imageUrl: item.products?.image_url
          })),
        }));

        setRecentOrders(formattedOrders);

      } catch (err) {
        console.error('Error fetching account data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAccountData();
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to update your profile.');
      return;
    }

    setIsSavingProfile(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            fullName: profileInfo.fullName,
            address: profileInfo.address,
            city: profileInfo.city,
            state: profileInfo.state,
            zip: profileInfo.zip,
            phone: profileInfo.phone,
          },
          { onConflict: 'id' }
        );

      if (updateError) {
        throw updateError;
      }

      alert('Your profile has been updated successfully!');
      setIsEditingProfile(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to update profile: ' + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleOrderClick = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50 flex items-center justify-center text-xl font-medium text-gray-700">Loading your account details...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-red-600 text-center mb-6">Error</h1>
        <p className="text-lg text-gray-700 text-center">{error}</p>
        <p className="text-md text-gray-500 mt-4">Please try refreshing the page or logging in again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50 font-sans py-12 px-4 sm:px-6 lg:px-8">
      {/* --- RENDER AccountNavBar COMPONENT HERE --- */}
      <AccountNavBar />

      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 text-center mb-12 drop-shadow-sm">Your Account Dashboard</h1>

        <div className="lg:grid lg:grid-cols-3 lg:gap-x-10 xl:gap-x-14">
          {/* Profile Information Section */}
          <section aria-labelledby="profile-info-heading" className="lg:col-span-1 bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 mb-8 lg:mb-0">
            <div className="flex justify-between items-center mb-8">
              <h2 id="profile-info-heading" className="text-3xl font-semibold text-gray-800">Profile Details</h2>
              <button
                type="button"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="rounded-full bg-amber-500 px-5 py-2.5 text-base font-medium text-white shadow-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105"
              >
                {isEditingProfile ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="grid grid-cols-1 gap-y-5">
                {['fullName', 'address', 'city', 'state', 'zip', 'phone'].map((field) => (
                  <div key={field}>
                    <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                    <input
                      type={field === 'phone' ? 'tel' : 'text'}
                      id={field}
                      name={field}
                      value={profileInfo[field]}
                      onChange={handleProfileChange}
                      readOnly={!isEditingProfile}
                      className={`mt-1 block w-full rounded-lg border ${isEditingProfile ? 'border-gray-300 focus:border-amber-500 focus:ring-amber-500' : 'border-gray-200 bg-gray-50 cursor-not-allowed'} shadow-sm text-base px-4 py-2.5 transition-all duration-200 focus:ring-1`}
                    />
                  </div>
                ))}
              </div>
              {isEditingProfile && (
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="mt-8 w-full rounded-lg border border-transparent bg-emerald-500 px-6 py-3.5 text-lg font-semibold text-white shadow-lg hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingProfile ? 'Saving Changes...' : 'Save Changes'}
                </button>
              )}
            </form>
          </section>

          {/* Recent Orders Section */}
          <section aria-labelledby="recent-orders-heading" className="lg:col-span-2 bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <h2 id="recent-orders-heading" className="text-3xl font-semibold text-gray-800 mb-8">Your Recent Orders</h2>
            {recentOrders.length === 0 ? (
              <p className="text-gray-600 text-lg text-center py-10">You haven't placed any orders yet. Start shopping now!</p>
            ) : (
              <ul role="list" className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <li
                    key={order.id}
                    className="py-6 last:pb-0 cursor-pointer hover:bg-gray-50 transition-colors duration-200 rounded-lg -mx-2 px-2"
                    onClick={() => handleOrderClick(order.id)}
                  >
                    <button type="button" className="w-full text-left">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 sm:mb-0">Order #{order.displayId}</h3>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                            order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'Paid' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-yellow-100 text-yellow-800'
                          } ring-1 ring-inset ${
                            order.status === 'Delivered' ? 'ring-green-200' :
                            order.status === 'Shipped' ? 'ring-blue-200' :
                            order.status === 'Paid' ? 'ring-indigo-200' :
                            'ring-yellow-200'
                          }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-base text-gray-600 mb-1">Order Date: <span className="font-medium">{order.date}</span></p>
                      <p className="text-lg font-bold text-gray-800 mb-4">Total: <span className="text-amber-600">{formatCurrency(order.total)}</span></p>

                      <div className="text-base text-gray-700">
                        <p className="font-semibold mb-3">Items Ordered:</p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="flex items-center p-3 border border-gray-100 rounded-lg bg-gray-50 shadow-sm">
                              {item.imageUrl && (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-20 h-20 object-cover rounded-md mr-4 flex-shrink-0 border border-gray-200"
                                />
                              )}
                              <div>
                                <p className="font-semibold text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-700">Quantity: {item.quantity}</p>
                                <p className="text-sm text-gray-700">Price: {formatCurrency(item.price)}</p>
                                {(item.color || item.size) && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {item.color && `Color: ${item.color}`}
                                    {item.color && item.size && ` | `}
                                    {item.size && `Size: ${item.size}`}
                                  </p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}