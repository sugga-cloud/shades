import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'

import Home from './pages/Home'
import Shop from './pages/Shop'
import AccountPage from './pages/Account'
import ProductView from './pages/ProductView'
import CheckoutPage from './pages/Checkout'
import CartPage from './pages/Cart'
import AdminPage from './pages/Admin'
import LoginPage from './pages/Auth'

import { ProtectedRoute } from './components/ProtectedRoute'

import './App.css'
import OrderSummary from './pages/Order'

// Wrapper component to provide navigation callbacks to CartPage
function CartWrapper() {
  const navigate = useNavigate()

  return (
    <CartPage
      onNavigateToCheckout={() => navigate('/checkout')}
      onNavigateToShop={() => navigate('/shop')}
    />
  )
}

function App() {
  return (

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductView />} />
        <Route path="/order/:id" element={<OrderSummary />} />
        <Route path="/order" element={<OrderSummary />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route path="/cart" element={<ProtectedRoute><CartWrapper /></ProtectedRoute>} />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>

  )
}

export default App
