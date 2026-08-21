# CobTravels – Backend API Implementation Specification

> **Base URL:** `https://coochbehar-travels.onrender.com`
> **API Prefix:** `/api/v1` (public) · `/api/v1/admin` (admin)
> **Format:** JSON (`Content-Type: application/json`)
> **Auth:** JWT Bearer Token

---

## 📱 Mobile App – API Endpoint Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/send-otp` | No | Send OTP to mobile |
| `POST` | `/api/v1/auth/verify-otp` | No | Verify OTP & login/register |
| `POST` | `/api/v1/auth/resend-otp` | No | Resend OTP |
| `POST` | `/api/v1/auth/logout` | Yes | Logout user |
| `GET` | `/api/v1/tour-packages` | No | List all tours (with filters) |
| `GET` | `/api/v1/tour-packages/:slug` | No | Get full tour detail |
| `POST` | `/api/v1/enquiries` | No | Submit tour enquiry |
| `GET` | `/api/v1/enquiries/my` | Yes | Get user's enquiries |
| `GET` | `/api/v1/enquiries/:id` | No | Get enquiry status by ID |
| `POST` | `/api/v1/custom-tour-requests` | No | Submit custom tour request |
| `GET` | `/api/v1/users/me` | Yes | Get logged-in user profile |
| `PATCH` | `/api/v1/users/me` | Yes | Update user profile |
| `GET` | `/api/v1/users/me/saved-tours` | Yes | Get wishlist slugs |
| `POST` | `/api/v1/users/me/saved-tours` | Yes | Add tour to wishlist |
| `DELETE` | `/api/v1/users/me/saved-tours/:slug` | Yes | Remove from wishlist |
| `GET` | `/api/v1/notifications` | Yes | Get user notifications |
| `PATCH` | `/api/v1/notifications/mark-all-read` | Yes | Mark all as read |
| `PATCH` | `/api/v1/notifications/:id/read` | Yes | Mark single as read |

---

---

# 🔐 Admin Panel – API Specification

> All admin endpoints are prefixed with `/api/v1/admin` and require an **Admin JWT Token** (`role: "ADMIN"` or `"SUPER_ADMIN"`).
> Admin tokens are issued via a separate admin login endpoint (email + password, NOT OTP).

---

## Admin API Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/admin/auth/login` | Admin login with email & password |
| `POST` | `/api/v1/admin/auth/logout` | Admin logout |
| `GET` | `/api/v1/admin/dashboard` | Dashboard stats & KPIs |
| `GET` | `/api/v1/admin/tour-packages` | List all tours (incl. inactive) |
| `POST` | `/api/v1/admin/tour-packages` | Create new tour package |
| `GET` | `/api/v1/admin/tour-packages/:slug` | Get tour detail for editing |
| `PUT` | `/api/v1/admin/tour-packages/:slug` | Full update of tour package |
| `PATCH` | `/api/v1/admin/tour-packages/:slug` | Partial update (e.g. toggle active) |
| `DELETE` | `/api/v1/admin/tour-packages/:slug` | Delete a tour package |
| `POST` | `/api/v1/admin/tour-packages/:slug/seasons` | Add season variant to tour |
| `PUT` | `/api/v1/admin/tour-packages/:slug/seasons/:id` | Update season variant |
| `DELETE` | `/api/v1/admin/tour-packages/:slug/seasons/:id` | Delete season variant |
| `GET` | `/api/v1/admin/enquiries` | List all enquiries (with filters) |
| `GET` | `/api/v1/admin/enquiries/:id` | Get single enquiry detail |
| `PATCH` | `/api/v1/admin/enquiries/:id/status` | Update enquiry status |
| `PATCH` | `/api/v1/admin/enquiries/:id/assign` | Assign enquiry to manager |
| `DELETE` | `/api/v1/admin/enquiries/:id` | Delete an enquiry |
| `GET` | `/api/v1/admin/custom-tour-requests` | List all custom tour requests |
| `GET` | `/api/v1/admin/custom-tour-requests/:id` | Get single custom request |
| `PATCH` | `/api/v1/admin/custom-tour-requests/:id/status` | Update custom request status |
| `GET` | `/api/v1/admin/users` | List all registered users |
| `GET` | `/api/v1/admin/users/:id` | Get user detail & activity |
| `PATCH` | `/api/v1/admin/users/:id` | Update user (block, etc.) |
| `GET` | `/api/v1/admin/reviews` | List all tour reviews |
| `PATCH` | `/api/v1/admin/reviews/:id/publish` | Publish / unpublish a review |
| `DELETE` | `/api/v1/admin/reviews/:id` | Delete a review |
| `POST` | `/api/v1/admin/reviews` | Manually add a review |
| `GET` | `/api/v1/admin/notifications` | List all sent notifications |
| `POST` | `/api/v1/admin/notifications/broadcast` | Broadcast push notification to all users |
| `POST` | `/api/v1/admin/notifications/send` | Send notification to specific user(s) |
| `DELETE` | `/api/v1/admin/notifications/:id` | Delete a notification |
| `GET` | `/api/v1/admin/analytics/overview` | Revenue, enquiries, user growth |
| `GET` | `/api/v1/admin/analytics/top-tours` | Top performing tour packages |
| `GET` | `/api/v1/admin/analytics/enquiry-trends` | Enquiry volume over time |

---

