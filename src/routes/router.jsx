import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import Home from './Home'
import ProductListing from './ProductListing'
import ProductDetail from './ProductDetail'
import Cart from './Cart'
import Wishlist from './Wishlist'
import Login from './Login'
import Register from './Register'
import Profile from './Profile'

const Checkout = lazy(() => import('./Checkout'))
const Account = lazy(() => import('./Account'))
const AddToCart = lazy(() => import('./AddToCart'))
const Wholesale = lazy(() => import('./Wholesale'))
const AdminLogin = lazy(() => import('./admin/AdminLogin'))
const AdminDashboardPage = lazy(() => import('./admin/AdminDashboardPage'))
const AdminOrdersPage = lazy(() => import('./admin/AdminOrdersPage'))
const AdminReturnsPage = lazy(() => import('./admin/AdminReturnsPage'))
const AdminRtoPage = lazy(() => import('./admin/AdminRtoPage'))
const AdminProductsPage = lazy(() => import('./admin/AdminProductsPage'))
const AdminArchivedPage = lazy(() => import('./admin/AdminArchivedPage'))
const AdminAnalyticsPage = lazy(() => import('./admin/AdminAnalyticsPage'))
const AdminOutOfStockPage = lazy(() => import('./admin/AdminOutOfStockPage'))
const AdminCustomersPage = lazy(() => import('./admin/AdminCustomersPage'))
const AdminCartsPage = lazy(() => import('./admin/AdminCartsPage'))
const AdminWishlistsPage = lazy(() => import('./admin/AdminWishlistsPage'))
const AdminCouponsPage = lazy(() => import('./admin/AdminCouponsPage'))
const AdminStaffPage = lazy(() => import('./admin/AdminStaffPage'))
const AdminPaymentSettingsPage = lazy(() => import('./admin/AdminPaymentSettingsPage'))
const AdminDeliverySettingsPage = lazy(() => import('./admin/AdminDeliverySettingsPage'))
const AdminUtilitiesPage = lazy(() => import('./admin/AdminUtilitiesPage'))
const AdminEcommercePage = lazy(() => import('./admin/AdminEcommercePage'))
const AdminMarketingPage = lazy(() => import('./admin/AdminMarketingPage'))
const AdminSupportPage = lazy(() => import('./admin/AdminSupportPage'))
const AdminWebsiteSeoPage = lazy(() => import('./admin/AdminWebsiteSeoPage'))
const AdminWebsiteBlogsPage = lazy(() => import('./admin/AdminWebsiteBlogsPage'))
const AdminReviewsSubmissionsPage = lazy(() => import('./admin/AdminReviewsSubmissionsPage'))
const AdminReviewsGeneratedPage = lazy(() => import('./admin/AdminReviewsGeneratedPage'))
const AdminSettingsSectionPage = lazy(() => import('./admin/AdminSettingsSectionPage'))
const AdminShell = lazy(() => import('@/features/admin/components/AdminShell').then((m) => ({ default: m.AdminShell })))

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
      { path: 'utilities', element: <AdminUtilitiesPage /> },
      { path: 'website/seo', element: <AdminWebsiteSeoPage /> },
      { path: 'website/blogs', element: <AdminWebsiteBlogsPage /> },
      { path: 'ecommerce', element: <AdminEcommercePage /> },
      { path: 'marketing', element: <AdminMarketingPage /> },
      { path: 'coupons', element: <AdminCouponsPage /> },
      { path: 'reviews/submissions', element: <AdminReviewsSubmissionsPage /> },
      { path: 'reviews/generated', element: <AdminReviewsGeneratedPage /> },
      { path: 'staff', element: <AdminStaffPage /> },
      { path: 'support', element: <AdminSupportPage /> },
      { path: 'settings', element: <Navigate to="profile" replace /> },
      { path: 'settings/profile', element: <AdminSettingsSectionPage section="profile" /> },
      { path: 'settings/controls', element: <AdminSettingsSectionPage section="controls" /> },
      { path: 'settings/product-display', element: <AdminSettingsSectionPage section="product-display" /> },
      { path: 'settings/delivery', element: <AdminDeliverySettingsPage /> },
      { path: 'settings/label', element: <AdminSettingsSectionPage section="label" /> },
      { path: 'settings/payment', element: <AdminPaymentSettingsPage /> },
      { path: 'settings/orders', element: <AdminSettingsSectionPage section="orders" /> },
      { path: 'settings/customer', element: <AdminSettingsSectionPage section="customer" /> },
      { path: 'settings/staff', element: <AdminStaffPage /> },
      { path: 'settings/policies', element: <AdminSettingsSectionPage section="policies" /> },
      { path: 'settings/help', element: <AdminSettingsSectionPage section="help" /> },
      { path: 'settings/ideas', element: <AdminSettingsSectionPage section="ideas" /> },
      { path: 'settings/other', element: <AdminSettingsSectionPage section="other" /> },
    ],
  },
])
