import { Link } from "react-router";

export function NavBar() {
  return (
    <nav className="flex flex-row justify-between items-center bg-white rounded-full p-4 w-full px-10 max-w-[1200px] mx-auto">
      <Link to="/">
        <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#AB8C95] via-[#000000] to-[#8E97C5]">
          Rankify
        </p>
      </Link>
      <Link
        to="/upload"
        className="w-fit primary-button"
      >
        Upload Resume
      </Link>
    </nav>
  );
}
