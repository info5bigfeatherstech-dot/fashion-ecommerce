import { createBrowserRouter } from 'react-router-dom'
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
])
