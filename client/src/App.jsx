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
import PrivateRoute from "./routes";
import useAuth from "./hooks/useAuth";
import EditRecord from "./pages/EditRecord";
import Reports from "./pages/Reports";
import ImportRecords from "./pages/ImportRecords";
import PartyStatement from "./pages/PartyStatement";
import ErrorPage from "./pages/ErrorPage";

export default function App() {
  const { user, loading } = useAuth();

  // ⛔ Wait until auth state is resolved
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

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
          <PrivateRoute>
            <AllRecords />
          </PrivateRoute>
        }
      />

      <Route
        path="/add"
        element={
          <PrivateRoute>
            <AddRecord />
          </PrivateRoute>
        }
      />

      <Route
        path="/import"
        element={
          <PrivateRoute>
            <ImportRecords />
          </PrivateRoute>
        }
      />

      <Route
        path="/edit/:id"
        element={
          <PrivateRoute>
            <EditRecord />
          </PrivateRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <PrivateRoute>
            <Reports />
          </PrivateRoute>
        }
      />

      <Route
        path="/party-statement"
        element={
          <PrivateRoute>
            <PartyStatement />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}
