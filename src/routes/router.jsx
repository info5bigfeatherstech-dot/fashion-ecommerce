import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import Home from './Home'
import ProductListing from './ProductListing'
import ProductDetail from './ProductDetail'
import Cart from './Cart'
import Checkout from './Checkout'
import Wishlist from './Wishlist'
import Account from './Account'
import Login from './Login'
import Register from './Register'
import Profile from './Profile'
import AddToCart from './AddToCart'
import Wholesale from './Wholesale'
import AdminLogin from './admin/AdminLogin'
import AdminOrdersPage from './admin/AdminOrdersPage'
import AdminPaymentSettingsPage from './admin/AdminPaymentSettingsPage'
import { AdminShell } from '@/features/admin/components/AdminShell'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'shop/:category', element: <ProductListing /> },
      { path: 'shop/:category/:subcategory', element: <ProductListing /> },
      { path: 'product/:slug', element: <ProductDetail /> },
      { path: 'cart', element: <Cart /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'wishlist', element: <Wishlist /> },
      { path: 'add-to-cart', element: <AddToCart /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'profile', element: <Profile /> },
      { path: 'account', element: <Account /> },
      { path: 'wholesale', element: <Wholesale /> },
    ],
  },
  { path: '/admin/login', element: <AdminLogin /> },
  {
    path: '/admin',
    element: <AdminShell />,
    children: [
      { index: true, element: <Navigate to="orders" replace /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'settings/payment', element: <AdminPaymentSettingsPage /> },
    ],
  },
])
