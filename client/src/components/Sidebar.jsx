import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="w-60 bg-gray-800 text-white min-h-screen p-4">
      <nav className="flex flex-col gap-4">
        <Link to="/">Dashboard</Link>
        <Link to="/add">Add Record</Link>
        <Link to="/reports">Reports</Link>
      </nav>
    </div>
  );
};

export default Sidebar;
