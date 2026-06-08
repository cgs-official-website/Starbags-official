import React, { useState, useEffect, useMemo } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaPaypal, FaMoneyBillWave, FaCreditCard, FaUniversity } from "react-icons/fa";
import "../../assets/styles/AdminDashboard.css";
import { useNavigate, Link } from "react-router-dom";
import AdminHeader from "../../components/Admin/AdminHeader";
import { FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";
import { DashboardSkeleton } from "../../components/Admin/AdminSkeleton";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

const renderPayModeIcon = (payMode) => {
  const modeLower = (payMode || '').toLowerCase();
  if (modeLower.includes('cod') || modeLower.includes('cash')) {
    return <FaMoneyBillWave size={22} color="#8b5cf6" />;
  }
  return <FaCreditCard size={22} color="#0072bc" />;
};


const AdminDashboard = () => {
  const navigate = useNavigate();
  const [revenueFilter, setRevenueFilter] = useState("Last Week");
  const [loading, setLoading] = useState(true);

  // Live Firestore data
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [prodSnap, orderSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'orders')),
        ]);

        const prodList = [];
        prodSnap.forEach(d => prodList.push({ id: d.id, ...d.data() }));

        const orderList = [];
        orderSnap.forEach(d => {
          const data = d.data();
          orderList.push({
            id: data.id || d.id,
            img: data.items?.[0]?.image || data.items?.[0]?.img || '',
            productName: data.items?.[0]?.productName || data.items?.[0]?.name || '',
            category: data.items?.[0]?.category || '',
            brand: data.items?.[0]?.brand || '-',
            customer: data.customerDetails?.name || '',
            address: data.customerDetails?.shippingAddress || '',
            orderDate: data.orderDate?.toDate ? data.orderDate.toDate() : (data.orderDate ? new Date(data.orderDate) : null),
            paymentMode: data.paymentMode || '',
            payMethod: data.paymentDetails?.method || 'card',
            payType: data.paymentDetails?.payType || 'Card payment',
            amount: data.paymentDetails?.total ? `₹${data.paymentDetails.total}` : '',
            amountRaw: data.paymentDetails?.total || 0,
            status: data.status || '',
            isCOD: (data.paymentMode || '').toLowerCase().includes('cod') || (data.paymentMode || '').toLowerCase().includes('cash'),
          });
        });

        orderList.sort((a, b) => {
          const timeA = a.orderDate ? a.orderDate.getTime() : 0;
          const timeB = b.orderDate ? b.orderDate.getTime() : 0;
          return timeB - timeA;
        });

        setProducts(prodList);
        setOrders(orderList);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Derived stats (Last 30 Days)
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const ordersLast30Days = orders.filter(o => o.orderDate && o.orderDate >= thirtyDaysAgo);
  const totalOrdersLast30Days = ordersLast30Days.length;
  const pendingOrdersLast30Days = ordersLast30Days.filter(o => o.status === 'Order Placed' || o.status === 'Pending').length;
  const totalRevenueLast30Days = ordersLast30Days.reduce((sum, o) => sum + (Number(o.amountRaw) || 0), 0);

  const totalProducts = products.length;
  const lowStockCount = products.filter(p => parseInt(p.stocks) > 0 && parseInt(p.stocks) <= 10).length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Order Placed' || o.status === 'Pending').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.amountRaw) || 0), 0);

  const inStockCount = products.filter(p => parseInt(p.stocks) > 0).length;
  const outOfStockCount = products.filter(p => parseInt(p.stocks) === 0).length;
  const inStockPct = totalProducts > 0 ? Math.round((inStockCount / totalProducts) * 100) : 0;

  const statCards = [
    { label: "Total Sales (30 Days)", value: `₹${totalRevenueLast30Days.toLocaleString('en-IN')}`, icon: "bi-graph-up-arrow", iconBg: "#dcfce7", iconColor: "#16a34a", badge: `${ordersLast30Days.filter(o => o.status === 'Delivered').length} Delivered`, badgeClass: "up" },
    { label: "Total Products", value: totalProducts, icon: "bi-bag", iconBg: "#ede9fe", iconColor: "#7c3aed", badge: `${inStockPct}% Available`, badgeClass: "up" },
    { label: "Low Stock Items", value: lowStockCount, icon: "bi-clock-history", iconBg: "#ffedd5", iconColor: "#f97316", badge: `${outOfStockCount} Out of stock`, badgeClass: outOfStockCount > 0 ? "down" : "up" },
    { label: "Total Orders (30 Days)", value: totalOrdersLast30Days, icon: "bi-boxes", iconBg: "#fef3c7", iconColor: "#d97706", badge: `${pendingOrdersLast30Days} Pending`, badgeClass: pendingOrdersLast30Days > 0 ? "down" : "up" },
  ];

  // --- Dynamic Revenue Chart ---
  const revenueChartData = useMemo(() => {
    const now = new Date();

    if (revenueFilter === 'Last Week') {
      // Last 7 days grouped by day name
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const map = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        map[days[d.getDay()]] = 0;
      }
      orders.forEach(o => {
        if (!o.orderDate) return;
        const diff = Math.floor((now - o.orderDate) / 86400000);
        if (diff >= 0 && diff <= 6) {
          const key = days[o.orderDate.getDay()];
          map[key] = (map[key] || 0) + Number(o.amountRaw || 0);
        }
      });
      return Object.entries(map).map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }));
    }

    if (revenueFilter === 'Last Month') {
      // Last 4 weeks
      const map = { 'Week 1': 0, 'Week 2': 0, 'Week 3': 0, 'Week 4': 0 };
      orders.forEach(o => {
        if (!o.orderDate) return;
        const diff = Math.floor((now - o.orderDate) / 86400000);
        if (diff >= 0 && diff <= 27) {
          const week = `Week ${4 - Math.floor(diff / 7)}`;
          map[week] = (map[week] || 0) + Number(o.amountRaw || 0);
        }
      });
      return Object.entries(map).map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }));
    }

    if (revenueFilter === 'Last Year') {
      // Last 12 months
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const map = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        map[months[d.getMonth()]] = 0;
      }
      orders.forEach(o => {
        if (!o.orderDate) return;
        const monthsAgo = (now.getFullYear() - o.orderDate.getFullYear()) * 12 + (now.getMonth() - o.orderDate.getMonth());
        if (monthsAgo >= 0 && monthsAgo <= 11) {
          const key = months[o.orderDate.getMonth()];
          if (key in map) map[key] = (map[key] || 0) + Number(o.amountRaw || 0);
        }
      });
      return Object.entries(map).map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }));
    }

    return [];
  }, [orders, revenueFilter]);


  // Top selling products — sorted by order frequency (Last 30 Days)
  const productSalesCount = {};
  ordersLast30Days.forEach(o => {
    const name = o.productName;
    if (name) productSalesCount[name] = (productSalesCount[name] || 0) + 1;
  });
  const topSellingData = Object.entries(productSalesCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, sold]) => {
      const prod = products.find(p => p.name === name);
      const stocks = parseInt(prod?.stocks ?? 0);
      return {
        img: prod?.image || '',
        name,
        category: prod?.category || '-',
        sold,
        revenue: `₹${(sold * (Number(prod?.price?.replace(/[^0-9.]/g, '')) || 0)).toLocaleString('en-IN')}`,
        status: stocks === 0 ? 'Out of stock' : stocks <= 10 ? 'Low inventory' : 'In stock',
        statusColor: stocks === 0 ? '#ef4444' : stocks <= 10 ? '#d97706' : '#16a34a',
        statusBg: stocks === 0 ? '#fee2e2' : stocks <= 10 ? '#fef3c7' : '#dcfce7',
      };
    });

  // Low stock list
  const lowStockData = products
    .filter(p => parseInt(p.stocks) > 0 && parseInt(p.stocks) <= 10)
    .sort((a, b) => parseInt(a.stocks) - parseInt(b.stocks))
    .slice(0, 6)
    .map(p => ({ img: p.image || '', name: p.name, left: parseInt(p.stocks) }));

  // Order status pie (Last 30 Days)
  const deliveredLast30Days = ordersLast30Days.filter(o => o.status === 'Delivered').length;
  const shippedLast30Days = ordersLast30Days.filter(o => o.status === 'Shipped' || o.status === 'Out for Delivery').length;
  const pendingLast30Days = ordersLast30Days.filter(o => o.status === 'Order Placed' || o.status === 'Pending').length;
  const orderStatusPie = [
    { name: 'Delivered', value: deliveredLast30Days || 0, color: '#a3e635' },
    { name: 'Shipped', value: shippedLast30Days || 0, color: '#a78bfa' },
    { name: 'Pending', value: pendingLast30Days || 0, color: '#fdba74' },
  ];

  // Today's orders
  const todayStr = new Date().toDateString();
  const todayOrderData = orders
    .filter(o => o.orderDate && o.orderDate.toDateString() === todayStr)
    .slice(0, 6);

  // Transactions
  const transactionsData = orders
    .filter(o => o.amount)
    .slice(0, 5)
    .map(o => ({
      id: o.id,
      img: o.img,
      category: o.productName || o.category,
      payMode: o.isCOD ? 'COD' : 'Razorpay',
      payType: o.isCOD ? 'Cash on delivery' : 'Online payment',
      amount: o.amount,
      date: o.orderDate ? o.orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/') : '-',
      status: o.status === 'Delivered' ? 'Completed' : o.status === 'Cancelled' ? 'Canceled' : 'Pending',
      statusColor: o.status === 'Delivered' ? '#16a34a' : o.status === 'Cancelled' ? '#ef4444' : '#d97706',
      statusBg: o.status === 'Delivered' ? '#dcfce7' : o.status === 'Cancelled' ? '#fee2e2' : '#fef3c7',
    }));

  const getRevenueData = () => revenueChartData;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader title="Admin Dashboard" subtitle="Showing statistics and sales analysis for the last 30 days." />

        <main className="admin-content" style={{ background: '#fafafa' }}>
          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
          
          <div className="stats-grid mb-4">
            {statCards.map((card, i) => (
              <div className="stat-card" key={i}>
                <div className="stat-card-top d-flex justify-content-between align-items-start">
                  <div className="stat-card-info">
                    <p className="stat-label">{card.label}</p>
                    <p className="stat-value">{card.value}</p>
                  </div>
                  <div className="stat-icon" style={{ background: card.iconBg, color: card.iconColor }}>
                    <i className={card.icon} style={{ fontSize: '20px' }}/>
                  </div>
                </div>
                <div className={`stat-badge ${card.badgeClass}`} style={{ fontSize: '13px', fontWeight: 500, marginTop: '8px' }}>
                  {card.badgeClass === 'up' ? <FiArrowUpRight style={{ fontSize: '16px' }} className="me-1" /> : <FiArrowDownRight style={{ fontSize: '16px' }} className="me-1" />}
                  {card.badge}
                </div>
              </div>
            ))}
          </div>

         
          <div className="chart-section mb-4 bg-white p-4 rounded-3 border">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="m-0 fw-bold">Revenue</h5>
              <div className="d-flex align-items-center gap-3">
                <select 
                  className="form-select form-select-sm text-muted" 
                  style={{ width: '120px', fontSize: '13px', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                  value={revenueFilter}
                  onChange={(e) => setRevenueFilter(e.target.value)}
                >
                  <option value="Last Week">Last Week</option>
                  <option value="Last Month">Last Month</option>
                  <option value="Last Year">Last Year</option>
                </select>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={getRevenueData()} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(val) => val >= 100000 ? `₹${(val/100000).toFixed(1)}L` : val >= 1000 ? `₹${(val/1000).toFixed(0)}k` : `₹${val}`} dx={-5} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, "Revenue"]}
                />
                <Area type="linear" dataKey="revenue" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

       
          <div className="row g-4 mb-4">
           
            <div className="col-lg-8">
              <div className="bg-white p-4 rounded-3 border h-100">
                <h5 className="fw-bold mb-4">Top selling products</h5>
                <div className="table-responsive">
                  <table className="table align-middle border-bottom-0 custom-table">
                    <thead className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                      <tr>
                        <th>Product Detail</th>
                        <th>Category</th>
                        <th>Sold</th>
                        <th>Revenue</th>
                        <th className="stock-status-col">Stock Status</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: '13px', fontWeight: 500 }}>
                      {topSellingData.length > 0 ? topSellingData.map((item, i) => (
                        <tr key={i}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {item.img ? (
                                <img src={item.img} alt={item.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', background: '#f3f4f6' }} />
                              ) : (
                                <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <i className="bi bi-bag" style={{ color: '#9ca3af' }} />
                                </div>
                              )}
                              <span>{item.name}</span>
                            </div>
                          </td>
                          <td>{item.category}</td>
                          <td>{item.sold}</td>
                          <td>{item.revenue}</td>
                          <td className="stock-status-col">
                            <span style={{ color: item.statusColor, background: item.statusBg, padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
                              <i className={`bi ${item.status === 'Out of stock' ? 'bi-x' : item.status === 'Low inventory' ? 'bi-dash' : 'bi-plus'} me-1`} />
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="5" className="text-center text-muted py-4">No order data yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          
            <div className="col-lg-4">
              <div className="bg-white p-4 rounded-3 border h-100">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <h6 className="fw-bold m-0">Low stock alerts</h6>
                  <Link to="/admin/product-management" state={{ stockBy: 'Low to High' }} className="text-decoration-none" style={{ color: '#6366f1', fontSize: '13px' }}>View all &rarr;</Link>
                </div>
                <p className="text-muted" style={{ fontSize: '12px', marginBottom: '20px' }}>Products requiring attention</p>
                <div className="d-flex flex-column gap-3">
                  {lowStockData.length > 0 ? lowStockData.map((item, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ gap: '12px' }}>
                      <div className="d-flex align-items-center gap-2" style={{ minWidth: 0, flex: 1 }}>
                        {item.img ? (
                          <img src={item.img} alt={item.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', background: '#f3f4f6', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className="bi bi-bag" style={{ color: '#9ca3af' }} />
                          </div>
                        )}
                        <span style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                      </div>
                      <span className="text-danger" style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>Only {item.left} left</span>
                    </div>
                  )) : (
                    <p className="text-muted" style={{ fontSize: '13px' }}>No low stock items. 🎉</p>
                  )}
                </div>
              </div>
            </div>
          </div>

        
          <div className="row g-4 mb-4">
          
            <div className="col-lg-4">
              <div className="bg-white p-4 rounded-3 border h-100">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold m-0">Order Status</h5>
                </div>
                <div className="position-relative d-flex justify-content-center my-4">
                  <PieChart width={200} height={200}>
                    <Pie data={orderStatusPie} cx={100} cy={100} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                      {orderStatusPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="position-absolute top-50 start-50 translate-middle text-center">
                    <h5 className="m-0 fw-bold">{totalOrdersLast30Days.toLocaleString('en-IN')}</h5>
                    <span style={{ fontSize: '11px', color: '#6b7280', whiteSpace: 'nowrap' }}>Orders (30 days)</span>
                  </div>
                </div>
                <div className="d-flex flex-column gap-3 mt-4">
                  {orderStatusPie.map((item, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center" style={{ fontSize: '13px', fontWeight: 500 }}>
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ width: 10, height: 10, background: item.color, display: 'inline-block', borderRadius: 2 }}></span>
                        {item.name}
                      </div>
                      <span>{item.value} <span className="text-muted">({totalOrdersLast30Days > 0 ? Math.round((item.value / totalOrdersLast30Days) * 100) : 0}%)</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

           
            <div className="col-lg-8">
              <div className="bg-white p-4 rounded-3 border h-100">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold m-0">Today Orders</h5>
                  <Link to="/admin/order-management" className="text-decoration-none" style={{ color: '#6366f1', fontSize: '13px' }}>View all &rarr;</Link>
                </div>
                <div className="table-responsive">
                  <table className="table align-middle border-bottom-0 custom-table">
                    <thead className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                      <tr>
                        <th>Image</th>
                        <th>Product Name</th>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Brand</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: '13px', fontWeight: 500 }}>
                      {todayOrderData.length > 0 ? todayOrderData.map((item, i) => (
                        <tr key={i}>
                          <td>
                            {item.img ? (
                              <img src={item.img} alt="img" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', background: '#f3f4f6' }} />
                            ) : (
                              <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="bi bi-bag" style={{ color: '#9ca3af' }} />
                              </div>
                            )}
                          </td>
                          <td>{item.productName}</td>
                          <td style={{ color: '#6b7280', fontSize: 12 }}>{item.id}</td>
                          <td>{item.customer}</td>
                          <td>{item.brand}</td>
                          <td>{item.amount}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="6" className="text-center text-muted py-4">No orders today yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          
          <div className="bg-white p-4 rounded-3 border mb-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold m-0">Recent Transactions</h5>
              <Link to="/admin/payment-details" className="text-decoration-none" style={{ color: '#6366f1', fontSize: '13px' }}>See All &gt;</Link>
            </div>
            <div className="table-responsive">
              <table className="table align-middle border-bottom-0 custom-table">
                <thead className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                  <tr>
                    <th>Order ID</th>
                    <th>Image</th>
                    <th>Product</th>
                    <th style={{ textAlign: 'center' }}>Payment mode</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '13px', fontWeight: 500 }}>
                  {transactionsData.length > 0 ? transactionsData.map((item, i) => (
                    <tr key={i}>
                      <td style={{ color: '#6b7280' }}>{item.id}</td>
                      <td>
                        {item.img ? (
                          <img src={item.img} alt="img" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', background: '#f3f4f6' }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="bi bi-bag" style={{ color: '#9ca3af' }} />
                          </div>
                        )}
                      </td>
                      <td>{item.category}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="d-flex align-items-center justify-content-center gap-2">
                          {renderPayModeIcon(item.payMode)}
                          <div className="d-flex flex-column text-start">
                            <span className="fw-bold">{item.payMode}</span>
                            <span className="text-muted" style={{ fontSize: '11px' }}>{item.payType}</span>
                          </div>
                        </div>
                      </td>
                      <td>{item.amount}</td>
                      <td>{item.date}</td>
                      <td>
                        <span style={{ color: item.statusColor, background: item.statusBg, padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
                          <i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }} />
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="7" className="text-center text-muted py-4">No transactions yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

