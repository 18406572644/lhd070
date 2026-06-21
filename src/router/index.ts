import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MainLayout from '@/layouts/MainLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import HomePage from '@/pages/HomePage.vue'
import ProductsPage from '@/pages/ProductsPage.vue'
import ProductDetailPage from '@/pages/ProductDetailPage.vue'
import BuilderPage from '@/pages/BuilderPage.vue'
import CartPage from '@/pages/CartPage.vue'
import CheckoutPage from '@/pages/CheckoutPage.vue'
import OrdersPage from '@/pages/OrdersPage.vue'
import OrderDetailPage from '@/pages/OrderDetailPage.vue'
import FavoritesPage from '@/pages/FavoritesPage.vue'
import ComparePage from '@/pages/ComparePage.vue'
import ProfilePage from '@/pages/ProfilePage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import RegisterPage from '@/pages/RegisterPage.vue'
import MerchantDashboard from '@/pages/merchant/DashboardPage.vue'
import MerchantProducts from '@/pages/merchant/ProductsPage.vue'
import MerchantOrders from '@/pages/merchant/OrdersPage.vue'
import MerchantInventory from '@/pages/merchant/InventoryPage.vue'
import AdminDashboard from '@/pages/admin/DashboardPage.vue'
import AdminUsers from '@/pages/admin/UsersPage.vue'
import AdminStatistics from '@/pages/admin/StatisticsPage.vue'
import AdminInventory from '@/pages/admin/InventoryPage.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', name: 'home', component: HomePage },
      { path: 'products', name: 'products', component: ProductsPage },
      { path: 'products/:id', name: 'product-detail', component: ProductDetailPage },
      { path: 'builder', name: 'builder', component: BuilderPage, meta: { requiresAuth: true } },
      { path: 'cart', name: 'cart', component: CartPage, meta: { requiresAuth: true } },
      { path: 'checkout', name: 'checkout', component: CheckoutPage, meta: { requiresAuth: true } },
      { path: 'orders', name: 'orders', component: OrdersPage, meta: { requiresAuth: true } },
      { path: 'orders/:id', name: 'order-detail', component: OrderDetailPage, meta: { requiresAuth: true } },
      { path: 'favorites', name: 'favorites', component: FavoritesPage, meta: { requiresAuth: true } },
      { path: 'compare', name: 'compare', component: ComparePage },
      { path: 'profile', name: 'profile', component: ProfilePage, meta: { requiresAuth: true } },
      { path: 'login', name: 'login', component: LoginPage },
      { path: 'register', name: 'register', component: RegisterPage },
    ],
  },
  {
    path: '/merchant',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresRole: 'merchant' },
    children: [
      { path: '', name: 'merchant-dashboard', component: MerchantDashboard },
      { path: 'products', name: 'merchant-products', component: MerchantProducts },
      { path: 'orders', name: 'merchant-orders', component: MerchantOrders },
      { path: 'inventory', name: 'merchant-inventory', component: MerchantInventory },
    ],
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresRole: 'admin' },
    children: [
      { path: '', name: 'admin-dashboard', component: AdminDashboard },
      { path: 'users', name: 'admin-users', component: AdminUsers },
      { path: 'statistics', name: 'admin-statistics', component: AdminStatistics },
      { path: 'inventory', name: 'admin-inventory', component: AdminInventory },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!auth.isLoggedIn) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }

  if (to.matched.some((record) => record.meta.requiresRole)) {
    const requiredRole = to.matched.find((r) => r.meta.requiresRole)?.meta.requiresRole
    if (requiredRole) {
      const userRole = auth.user?.role
      if (!userRole) {
        return { path: '/login' }
      }
      if (userRole !== 'admin' && userRole !== requiredRole) {
        return { path: '/' }
      }
    }
  }
})

export default router
