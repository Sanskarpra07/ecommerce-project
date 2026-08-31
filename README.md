# MegaFoot - E-Commerce Web Application

A full-stack e-commerce web application for a modern footwear and shoe store built with a **React.js** frontend, **PHP REST API** backend, and **MySQL** relational database.

---

## 🚀 Features

- **Product Catalog & Filtering**: Browse shoes with real-time filtering by category (Running, Casual, Formal, Sneakers), size, price range, and search keyword.
- **Product Details**: High-resolution image preview, sizing selector, stock availability indicator, and specifications.
- **Shopping Cart & Checkout**: Add/remove products, adjust quantities, calculate order totals, and checkout with automatic inventory/stock deduction.
- **User Authentication**: Secure user registration and login with bcrypt password hashing and role-based access control (`customer` vs `admin`).
- **Admin Dashboard**:
  - Add new products (with category, name, brand, price, size, color, description, stock quantity, image URL).
  - Manage product inventory and delete products.
  - View real-time order history and customer purchase records.

---

## 🗄 Database Schema (`backend/schema.sql`)

The database `MegaFoot_db` includes the following tables:

1. **`categories`**:
   - `id` (INT, Primary Key, Auto Increment)
   - `category_name` (VARCHAR, Unique)
   - `description` (VARCHAR)
   - `created_at` (TIMESTAMP)

2. **`products`**:
   - `id` (INT, Primary Key, Auto Increment)
   - `category_id` (INT, Foreign Key -> `categories.id`)
   - `name` (VARCHAR)
   - `brand` (VARCHAR)
   - `price` (DECIMAL 10,2)
   - `size` (VARCHAR)
   - `color` (VARCHAR)
   - `description` (TEXT)
   - `image_url` (VARCHAR)
   - `stock_quantity` (INT)
   - `created_at`, `updated_at` (TIMESTAMP)

3. **`users`**:
   - `id` (INT, Primary Key, Auto Increment)
   - `full_name` (VARCHAR)
   - `email` (VARCHAR, Unique)
   - `password_hash` (VARCHAR)
   - `role` (ENUM: `customer`, `admin`)
   - `created_at` (TIMESTAMP)

4. **`orders`**:
   - `id` (INT, Primary Key, Auto Increment)
   - `user_id` (INT, Foreign Key -> `users.id`)
   - `total_amount` (DECIMAL 10,2)
   - `payment_status` (VARCHAR)
   - `order_status` (VARCHAR)
   - `shipping_address` (TEXT)
   - `created_at`, `updated_at` (TIMESTAMP)

5. **`order_items`**:
   - `id` (INT, Primary Key, Auto Increment)
   - `order_id` (INT, Foreign Key -> `orders.id`)
   - `product_id` (INT, Foreign Key -> `products.id`)
   - `quantity` (INT)
   - `price` (DECIMAL 10,2)
   - `created_at` (TIMESTAMP)

---

## 🔑 Default Accounts

| Role | Email | Password | Admin Access |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@MegaFoot.com` | `admin123` | ✅ Yes (`/admin`) |
| **Demo Customer** | `customer@MegaFoot.com` | `password123` | ❌ No |
| **Guest User** | `guest@MegaFoot.com` | `guest123` | ❌ No (Default checkout) |

---

## 🛠 Quick Setup & Installation

### 1. Database Setup
1. Start Apache & MySQL in **XAMPP / WAMP / LAMP**.
2. Import `backend/schema.sql` via phpMyAdmin or MySQL CLI:
   ```bash
   mysql -u root -p < backend/schema.sql
   ```
3. Alternatively, run the built-in database seeder script in your browser or terminal:
   ```bash
   php backend/seed.php
   ```
   *(Or navigate to `http://localhost/mega-foot/backend/seed.php` in your browser)*

### 2. Frontend Setup
- Open `index.html` in your browser or serve the root directory via your web server (e.g. `http://localhost/mega-foot/`).

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/backend/api/products.php` | List products with filters (`category`, `size`, `min_price`, `max_price`, `search`, `brand`) |
| `GET` | `/backend/api/products.php?id={id}` | Get single product details |
| `POST` | `/backend/api/products.php` | Create a new product (Requires `admin_token: "admin123"`) |
| `PUT` | `/backend/api/products.php` | Update an existing product (Requires `admin_token: "admin123"`) |
| `DELETE`| `/backend/api/products.php?id={id}` | Delete a product (Requires `admin_token: "admin123"`) |
| `GET` | `/backend/api/categories.php` | List all shoe categories with product counts |
| `POST` | `/backend/api/auth.php` | User login (`action: "login"`) or registration (`action: "register"`) |
| `POST` | `/backend/api/orders.php` | Create an order with transaction & stock deduction |
| `GET` | `/backend/api/orders.php` | List orders (Admin all, or user-filtered `?user_id={id}`) |

