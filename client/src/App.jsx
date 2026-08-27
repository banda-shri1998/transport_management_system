// import Navbar from "./components/Navbar";
// import Sidebar from "./components/Sidebar";
// import AppRoutes from "./routes";

// const App = () => {
//   return (
//     <div className="flex">
//       <Sidebar />
//       <div className="flex-1">
//         <Navbar />
//         <div className="p-6">
//           <AppRoutes />
//         </div>
//       </div>
//     </div>
//   );
// };
// import { Routes, Route, Navigate } from "react-router-dom";
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
// import AllRecords from "./pages/AllRecords";
// import AddRecord from "./pages/AddRecord";
// import PrivateRoute from "./routes";
// import useAuth from "./hooks/useAuth";

// export default function App() {
//   const { user } = useAuth();

//   return (
//     <Routes>
//       <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

//       <Route
//         path="/"
//         element={
//           <PrivateRoute>
//             <Dashboard />
//           </PrivateRoute>
//         }
//       />

//       <Route
//         path="/records"
//         element={
//           <PrivateRoute>
//             <AllRecords />
//           </PrivateRoute>
//         }
//       />

//       <Route
//         path="/add"
//         element={
//           <PrivateRoute>
//             <AddRecord />
//           </PrivateRoute>
//         }
//       />
//     </Routes>
//   );
// }
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AllRecords from "./pages/AllRecords";
import AddRecord from "./pages/AddRecord";
import { PrivateRoute, StaffRoute, AdminRoute } from "./routes";
import useAuth from "./hooks/useAuth";
import EditRecord from "./pages/EditRecord";
import Reports from "./pages/Reports";
import ImportRecords from "./pages/ImportRecords";
import PartyStatement from "./pages/PartyStatement";
import Vehicles from "./pages/Vehicles";
import ErrorPage from "./pages/ErrorPage";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/records"
        element={
          <StaffRoute>
            <AllRecords />
          </StaffRoute>
        }
      />

      <Route
        path="/add"
        element={
          <StaffRoute>
            <AddRecord />
          </StaffRoute>
        }
      />

      <Route
        path="/import"
        element={
          <AdminRoute>
            <ImportRecords />
          </AdminRoute>
        }
      />

      <Route
        path="/edit/:id"
        element={
          <AdminRoute>
            <EditRecord />
          </AdminRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <StaffRoute>
            <Reports />
          </StaffRoute>
        }
      />

      <Route
        path="/party-statement"
        element={
          <StaffRoute>
            <PartyStatement />
          </StaffRoute>
        }
      />

      <Route
        path="/vehicles"
        element={
          <AdminRoute>
            <Vehicles />
          </AdminRoute>
        }
      />

      <Route
        path="/error/403"
        element={
          <ErrorPage
            status={403}
            title="Access denied"
            message="You do not have permission to view this page. Please contact your administrator."
          />
        }
      />

      <Route
        path="*"
        element={
          <ErrorPage
            status={404}
            title="Page not found"
            message="The page you are looking for does not exist or may have moved."
          />
        }
      />
    </Routes>
  );
}
