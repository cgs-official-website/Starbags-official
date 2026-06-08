import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SearchProvider } from './context/SearchContext';
import { useAuth } from './context/AuthContext';

import Home from './pages/User/Home';
import Cart from './pages/User/Cart';

import Orders from './pages/User/Orders';
import ProductDetails from './pages/User/ProductDetails';
import WishList from './pages/User/WishList';
import Contact from './pages/User/Contact';
import CreateAccount from './pages/User/CreateAccount';
import Login from './pages/User/Login';
import ResetPassword from './pages/User/Resetpassword';
import ForgotPassword from './pages/User/ForgotPassword';
import Profile from './pages/User/Profile';
import SavedAddress from './pages/User/SavedAddress';
import TrackOrder from './pages/User/TrackOrder';
import Product from './pages/User/Allproducts';
import BillAddress from './pages/User/BillAddress';
import Myreviews from './pages/User/Myreviews';


import AdminLogin from './pages/Admin/AdminLogin';
import AdminSignup from './pages/Admin/AdminSignup';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Coupons from './pages/Admin/Coupons';
import AdminForgetPassword from './pages/Admin/ForgetPassword';
import OrderManagement from './pages/Admin/OrderManagement';
import PaymentDetails from './pages/Admin/PaymentDetails';
import ProductManagement from './pages/Admin/ProductManagement';
import AdminSettings from './pages/Admin/Settings';
import ReportAnalysis from './pages/Admin/ReportAnalysis';
import AdminResetPassword from './pages/Admin/ResetPassword';
import StoreDetails from './pages/Admin/StoreDetails';
import BannerManagement from './pages/Admin/BannerManagement';
import OrderDetails from './pages/Admin/OrderDetails';
import ReviewManagement from './pages/Admin/ReviewManagement';
// import BillAddress from './pages/User/BillAddress';
import SignUpVerification from './pages/User/SignUpVerification';
import Checkout from './pages/User/Checkout';

// Protected Route for Admin users
const AdminProtectedRoute = ({ children }) => {
  const { currentUser, userData } = useAuth();
  
  // Provide fallback to local storage if userData isn't populated immediately
  const localUser = JSON.parse(localStorage.getItem('user'));
  const role = userData?.role || localUser?.role;
  
  if (!currentUser || role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Protected Route for authenticated normal/admin users
const UserProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};


import { useTheme } from './context/ThemeContext';

const ThemeController = () => {
  const location = useLocation();
  const { isDark } = useTheme();

  React.useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      document.body.classList.remove('dark-theme');
    } else {
      if (isDark) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    }
  }, [location.pathname, isDark]);

  return null;
};

const App = () => {
  return (

    <SearchProvider> {/* Wrap everything with SearchProvider */}
      <BrowserRouter>
        <ThemeController />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<CreateAccount />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgotPassword" element={<ForgotPassword/>} />
          <Route path="/resetPassword" element={<ResetPassword/>} />
          <Route path="/signup-verification" element={<SignUpVerification />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/allProducts" element={<Product />} />
          <Route path="/product" element={<ProductDetails />} />
          <Route path="/products" element={<Navigate to="/allProducts" replace />} />
          <Route path="/shop" element={<Navigate to="/allProducts" replace />} />
          <Route path="/bags" element={<Navigate to="/allProducts" replace />} />

          


          {/* User Protected Routes */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<UserProtectedRoute><Orders /></UserProtectedRoute>} />
          <Route path="/wishlist" element={<UserProtectedRoute><WishList /></UserProtectedRoute>} />
          <Route path="/profile" element={<UserProtectedRoute><Profile /></UserProtectedRoute>} />
          <Route path="/address" element={<UserProtectedRoute><SavedAddress /></UserProtectedRoute>} />
          <Route path="/track-order" element={<UserProtectedRoute><TrackOrder /></UserProtectedRoute>} />
          <Route path="/checkout" element={<UserProtectedRoute><Checkout /></UserProtectedRoute>} />
          <Route path="/BillAddress" element={<UserProtectedRoute><BillAddress /></UserProtectedRoute>} />
          <Route path="/reviews" element={<UserProtectedRoute><Myreviews /></UserProtectedRoute>} />

          {/* Admin Routes (Protected) */}
          <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
          <Route path="/admin/coupons" element={<AdminProtectedRoute><Coupons /></AdminProtectedRoute>} />
          <Route path="/admin/order-management" element={<AdminProtectedRoute><OrderManagement /></AdminProtectedRoute>} />
          <Route path="/admin/payment-details" element={<AdminProtectedRoute><PaymentDetails /></AdminProtectedRoute>} />
          <Route path="/admin/product-management" element={<AdminProtectedRoute><ProductManagement /></AdminProtectedRoute>} />
          <Route path="/admin/settings" element={<AdminProtectedRoute><AdminSettings /></AdminProtectedRoute>} />
          <Route path="/admin/banner-management" element={<AdminProtectedRoute><BannerManagement /></AdminProtectedRoute>} />
          <Route path="/admin/order-details" element={<AdminProtectedRoute><OrderDetails /></AdminProtectedRoute>} />
          <Route path="/admin/review-management" element={<AdminProtectedRoute><ReviewManagement /></AdminProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </SearchProvider>

  );
};

export default App;



// import React from 'react'
// import { BrowserRouter,Routes,Route } from 'react-router-dom';


// import Home from './pages/User/Home';
// import Cart from './pages/User/Cart';
// // import Checkout from './pages/User/Checkout';
// import Orders from './pages/User/Orders';
// import ProductDetails from './pages/User/ProductDetails';
// import WishList from './pages/User/WishList';
// import Contact from './pages/User/Contact';
// import CreateAccount from './pages/User/CreateAccount';
// import Login from './pages/User/Login';
// import ResetPassword from './pages/User/Resetpassword';
// import ForgotPassword from './pages/User/ForgotPassword';
// import Profile from './pages/User/Profile';
// import SavedAddress from './pages/User/SavedAddress';
// import TrackOrder from './pages/User/TrackOrder';
// import Product from './pages/User/Allproducts';
// import BillAddress from './pages/User/BillAddress';








// import AdminLogin from './pages/Admin/AdminLogin';
// import AdminSignup from './pages/Admin/AdminSignup';
// import AdminDashboard from './pages/Admin/AdminDashboard';
// import Coupons from './pages/Admin/Coupons';
// import AdminForgetPassword from './pages/Admin/ForgetPassword';
// import OrderManagement from './pages/Admin/OrderManagement';
// import PaymentDetails from './pages/Admin/PaymentDetails';
// import ProductManagement from './pages/Admin/ProductManagement';
// import AdminSettings from './pages/Admin/Settings';
// import ReportAnalysis from './pages/Admin/ReportAnalysis';
// import AdminResetPassword from './pages/Admin/ResetPassword';
// import StoreDetails from './pages/Admin/StoreDetails';







//  const App = () => {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/cart" element={<Cart />} />
//         <Route path="/signup" element={<CreateAccount />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/forgotPassword" element={<ForgotPassword/>} />
//         <Route path="/resetPassword" element={<ResetPassword/>} />

//         {/* <Route path="/checkout" element={<Checkout />} /> */}
//         <Route path="/orders" element={<Orders />} />
//         <Route path="/contact" element={<Contact />} />
//         <Route path="/allProducts" element={<Product />} />

//         <Route path="/product" element={<ProductDetails />} />
//         <Route path="/wishlist" element={<WishList />} />
//         <Route path="/profile" element={<Profile />} />
//         <Route path="/address" element={<SavedAddress />} />
//         <Route path="/track-order" element={<TrackOrder />} />
//         <Route path="/checkout" element={<BillAddress />} />
















//         {/* Admin Routes */}
//         <Route path="/admin" element={<AdminLogin />} />
//         <Route path="/admin/signup" element={<AdminSignup />} />
//         <Route path="/admin/forget-password" element={<AdminForgetPassword />} />
//         <Route path="/admin/reset-password" element={<AdminResetPassword />} />
//         <Route path="/admin/dashboard" element={<AdminDashboard />} />
//         <Route path="/admin/coupons" element={<Coupons />} />
//         <Route path="/admin/order-management" element={<OrderManagement />} />
//         <Route path="/admin/payment-details" element={<PaymentDetails />} />
//         <Route path="/admin/product-management" element={<ProductManagement />} />
//         <Route path="/admin/settings" element={<AdminSettings />} />
//         <Route path="/admin/report-analysis" element={<ReportAnalysis />} />
//         <Route path="/admin/store-details" element={<StoreDetails />} />
//       </Routes>
//     </BrowserRouter>
//   );
// };

// export default App;