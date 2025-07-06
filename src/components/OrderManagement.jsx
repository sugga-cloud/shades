'use client'

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom' // Keep Link if used elsewhere or for navigation
import supabase from '../utils/supabaseClient' // Import your Supabase client

// Helper function for conditional class names
function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function OrdersManagement() { // Renamed from ProductGridSection
  const [orders, setOrders] = useState([])
  const [totalItemsSold, setTotalItemsSold] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingOrderId, setUpdatingOrderId] = useState(null); // State to track which order is being updated

  // Define possible order statuses
  const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true)
      setError(null)
      try {
        // Fetch orders from the 'orders' table
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false }); // Order by most recent

        if (ordersError) {
          throw ordersError
        }

        let calculatedTotalItemsSold = 0
        let calculatedTotalEarnings = 0

        // For each order, fetch its associated items from the 'order_items' table
        const ordersWithItems = await Promise.all(ordersData.map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('product_id, quantity, price_at_purchase, color, size') // Select fields from order_items
            .eq('order_id', order.id);

          if (itemsError) {
            console.error('Error fetching order items for order ID:', order.id, itemsError);
            return { ...order, items: [] }; // Return order without items if there's an error
          }

          // Map order items for display.
          // Note: product_name is not in order_items table. In a real app, you'd join with 'products' table.
          const orderItems = itemsData.map(item => ({
            name: `Product ${item.product_id.substring(0, 4)}...`, // Placeholder name using product_id
            quantity: item.quantity,
            price_per_unit: item.price_at_purchase, // Use price_at_purchase
            color: item.color,
            size: item.size
          }));

          // Calculate total items sold for the dashboard summary
          const orderTotalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
          calculatedTotalItemsSold += orderTotalItems;
          calculatedTotalEarnings += order.total_amount; // Use total_amount from orders table

          return {
            id: order.id,
            date: new Date(order.created_at).toLocaleDateString(), // Format date
            total: order.total_amount,
            status: order.order_state, // Using 'order_state' for status
            items: orderItems,
          };
        }));

        setOrders(ordersWithItems)
        setTotalItemsSold(calculatedTotalItemsSold)
        setTotalEarnings(calculatedTotalEarnings)

      } catch (err) {
        console.error('Failed to fetch orders:', err)
        setError('Failed to load orders. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  // Function to update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId); // Set loading state for this specific order
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ order_state: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      // Update the local state to reflect the change immediately
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      console.log(`Order ${orderId} status updated to ${newStatus}`);
    } catch (err) {
      console.error(`Error updating order ${orderId}:`, err);
      setError(`Failed to update order status for ${orderId}.`);
    } finally {
      setUpdatingOrderId(null); // Clear loading state
    }
  };


  return (
    <div className="bg-gray-900 py-16 sm:py-24 lg:py-32 font-inter min-h-screen text-white"> {/* Dark background */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center mb-12">
          Orders Management Dashboard
        </h1>

        {loading && <div className="text-center text-lg text-gray-400">Loading orders...</div>}
        {error && <div className="text-center text-lg text-red-500">{error}</div>}

        {!loading && !error && (
          <section aria-labelledby="orders-management-heading" className="bg-gray-800 p-8 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 id="orders-management-heading" className="text-2xl font-semibold text-white">Orders Overview</h2>
            </div>

            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
              <div className="bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-600">
                <p className="text-sm font-medium text-gray-300">Total Items Sold</p>
                <p className="text-4xl font-bold text-yellow-400 mt-2">{totalItemsSold}</p>
              </div>
              <div className="bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-600">
                <p className="text-sm font-medium text-gray-300">Total Earnings</p>
                <p className="text-4xl font-bold text-yellow-400 mt-2">₹{totalEarnings.toFixed(2)}</p> {/* Rupee symbol */}
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Order ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Items</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th> {/* New column for actions */}
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-700 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{order.id.substring(0, 8)}...</td> {/* Truncate ID for display */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{order.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₹{order.total.toFixed(2)}</td> {/* Rupee symbol */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={classNames(
                            order.status === 'delivered' ? 'bg-green-600' :
                            order.status === 'processing' ? 'bg-yellow-600' :
                            order.status === 'pending' ? 'bg-blue-600' :
                            order.status === 'shipped' ? 'bg-purple-600' : // Added shipped status color
                            order.status === 'cancelled' ? 'bg-red-600' : // Added cancelled status color
                            'bg-gray-600', // Default for unknown status
                            'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white'
                          )}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)} {/* Capitalize first letter */}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          <ul className="list-disc list-inside space-y-1">
                            {order.items.length > 0 ? (
                              order.items.map((item, idx) => (
                                <li key={idx}>
                                  {item.name} (x{item.quantity})
                                  {item.color && `, Color: ${item.color}`}
                                  {item.size && `, Size: ${item.size}`}
                                  {item.price_per_unit && ` (₹${item.price_per_unit.toFixed(2)})`}
                                </li>
                              ))
                            ) : (
                              <li>No items found</li>
                            )}
                          </ul>
                        </td>
                        {/* Actions Column */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500
                                       bg-gray-700 text-white py-2 px-3 pr-8 text-sm
                                       disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={updatingOrderId === order.id} // Disable while updating
                          >
                            {orderStatuses.map(status => (
                              <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </option>
                            ))}
                          </select>
                          {updatingOrderId === order.id && (
                            <p className="text-xs text-yellow-400 mt-1">Updating...</p>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-400">No orders found.</td> {/* Adjusted colspan */}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
