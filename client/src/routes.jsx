// import { Routes, Route } from "react-router-dom";

// import Dashboard from "./pages/Dashboard";
// import AddRecord from "./pages/AddRecord";
// import AllRecords from "./pages/AllRecords";
// import EditRecord from "./pages/EditRecord";
// import Reports from "./pages/Reports";
// import PartyStatement from "./pages/PartyStatement";

// import { Navigate } from "react-router-dom";
// import useAuth from "./hooks/useAuth";

// export function PrivateRoute({ children }) {
//   const { user, loading } = useAuth();

//   if (loading) return null;
//   return user ? children : <Navigate to="/login" />;
// }

// const AppRoutes = () => {
//   return (
//     <Routes>
//       <Route path="/" element={<Dashboard />} />
//       <Route path="/add" element={<AddRecord />} />
//       <Route path="/records" element={<AllRecords />} />
//       <Route path="/edit/:id" element={<EditRecord />} />
//       <Route path="/reports" element={<Reports />} />
//       <Route path="/party-statement" element={<PartyStatement />} />

//     </Routes>
//   );
// };

//export default AppRoutes;
import { Navigate } from "react-router-dom";
import useAuth from "./hooks/useAuth";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
}
