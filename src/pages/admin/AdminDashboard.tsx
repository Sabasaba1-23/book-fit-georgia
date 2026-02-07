import { Navigate } from "react-router-dom";
import AdminListings from "./AdminListings";

// The admin dashboard IS the approval queue
export default function AdminDashboard() {
  return <AdminListings />;
}
