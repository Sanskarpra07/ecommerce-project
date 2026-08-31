import React, { useEffect, useState } from 'react';
import api from '../api';

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [status, setStatus] = useState({ payment: {}, order: {} });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders.php');
        setOrders(res.data.orders || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const toggleExpand = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Order Management</h1>
          <p className="admin-subtitle">{orders.length} total orders</p>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">No orders have been placed yet.</div>
      ) : (
        <table className="admin-table orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <React.Fragment key={o.id}>
                <tr className="clickable-row" onClick={() => toggleExpand(o.id)}>
                  <td>#{o.id}</td>
                  <td>{o.user_name || `User #${o.user_id}`}</td>
                  <td>{o.items.reduce((s, it) => s + it.quantity, 0)}</td>
                  <td>${parseFloat(o.total_amount).toFixed(2)}</td>
                  <td>
                    <span className={`status-badge status-${(o.payment_status || '').toLowerCase()}`}>
                      {o.payment_status}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${(o.order_status || '').toLowerCase()}`}>
                      {o.order_status}
                    </span>
                  </td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="expand-toggle">{expanded === o.id ? '\u25B2' : '\u25BC'}</td>
                </tr>
                {expanded === o.id && (
                  <tr className="expanded-row">
                    <td colSpan="8">
                      <div className="order-detail">
                        <h4>Order Items</h4>
                        <table className="detail-table">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Qty</th>
                              <th>Price</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {o.items.map((item) => (
                              <tr key={item.id}>
                                <td>{item.name}</td>
                                <td>{item.quantity}</td>
                                <td>${parseFloat(item.price).toFixed(2)}</td>
                                <td>${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="order-meta">
                          <strong>Shipping:</strong> {o.shipping_address || 'Not provided'} &nbsp;
                          <strong>Placed:</strong> {new Date(o.created_at).toLocaleString()}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
