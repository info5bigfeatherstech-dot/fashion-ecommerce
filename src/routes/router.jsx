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
import AdminDashboardPage from './admin/AdminDashboardPage'
import AdminOrdersPage from './admin/AdminOrdersPage'
import AdminReturnsPage from './admin/AdminReturnsPage'
import AdminRtoPage from './admin/AdminRtoPage'
import AdminProductsPage from './admin/AdminProductsPage'
import AdminArchivedPage from './admin/AdminArchivedPage'
import AdminAnalyticsPage from './admin/AdminAnalyticsPage'
import AdminOutOfStockPage from './admin/AdminOutOfStockPage'
import AdminCustomersPage from './admin/AdminCustomersPage'
import AdminCartsPage from './admin/AdminCartsPage'
import AdminWishlistsPage from './admin/AdminWishlistsPage'
import AdminCouponsPage from './admin/AdminCouponsPage'
import AdminStaffPage from './admin/AdminStaffPage'
import AdminPaymentSettingsPage from './admin/AdminPaymentSettingsPage'
import AdminDeliverySettingsPage from './admin/AdminDeliverySettingsPage'
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
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'returns', element: <AdminReturnsPage /> },
      { path: 'rto', element: <AdminRtoPage /> },
      { path: 'products', element: <AdminProductsPage /> },
      { path: 'archived', element: <AdminArchivedPage /> },
      { path: 'analytics', element: <AdminAnalyticsPage /> },
      { path: 'out-of-stock', element: <AdminOutOfStockPage /> },
      { path: 'customers', element: <AdminCustomersPage /> },
      { path: 'carts', element: <AdminCartsPage /> },
      { path: 'wishlists', element: <AdminWishlistsPage /> },
      { path: 'coupons', element: <AdminCouponsPage /> },
      { path: 'staff', element: <AdminStaffPage /> },
      { path: 'settings/payment', element: <AdminPaymentSettingsPage /> },
      { path: 'settings/delivery', element: <AdminDeliverySettingsPage /> },
    ],
  },
])
