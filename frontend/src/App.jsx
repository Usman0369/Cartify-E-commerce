import { Route, Routes } from 'react-router-dom'
import { RequireAdmin, RequireAuth } from './components/RouteGuards.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { CatalogProvider } from './context/CatalogContext.jsx'
import { SearchProvider } from './context/SearchContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import SiteLayout from './layouts/SiteLayout.jsx'
import AccountPage from './pages/AccountPage.jsx'
import BestSellersPage from './pages/BestSellersPage.jsx'
import CartPage from './pages/CartPage.jsx'
import CategoriesPage from './pages/CategoriesPage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import ContactPage from './pages/ContactPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import OrderConfirmationPage from './pages/OrderConfirmationPage.jsx'
import ProductPage from './pages/ProductPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import ShopPage from './pages/ShopPage.jsx'
import TwoFactorPage from './pages/TwoFactorPage.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage.jsx'
import ActivityPage from './pages/admin/AdminActivityPage.jsx'
import AdminCouponsPage from './pages/admin/AdminCouponsPage.jsx'
import AdminCustomersPage from './pages/admin/AdminCustomersPage.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx'
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx'
import AdminReviewsPage from './pages/admin/AdminReviewsPage.jsx'

function App() {
  return (
    <AuthProvider>
      <CatalogProvider>
        <CartProvider>
          <ToastProvider>
            <WishlistProvider>
              <SearchProvider>
                <Routes>
                <Route element={<SiteLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/best-sellers" element={<BestSellersPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/product/:slug" element={<ProductPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route
                    path="/order-confirmation/:orderId"
                    element={<OrderConfirmationPage />}
                  />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/login/2fa" element={<TwoFactorPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                  <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                  <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                  />
                  <Route element={<RequireAuth />}>
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                  </Route>
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                <Route element={<RequireAdmin />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="orders" element={<AdminOrdersPage />} />
                    <Route path="products" element={<AdminProductsPage />} />
                    <Route path="customers" element={<AdminCustomersPage />} />
                    <Route path="reviews" element={<AdminReviewsPage />} />
                    <Route path="coupons" element={<AdminCouponsPage />} />
                    <Route path="activity" element={<ActivityPage />} />
                  </Route>
                </Route>
                </Routes>
              </SearchProvider>
            </WishlistProvider>
          </ToastProvider>
        </CartProvider>
      </CatalogProvider>
    </AuthProvider>
  )
}

export default App
