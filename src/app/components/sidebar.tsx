import { AlignJustify, X } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import { usePathname } from "next/navigation";
const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null); // Reference to the sidebar container
  const pathname = usePathname(); // Get current route
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // const closeSidebar = (e: MouseEvent): void => {
  //     if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
  //         setIsOpen(false); // Close the sidebar if clicked outside
  //     }
  // };

  // useEffect(() => {
  //     // Add event listener for click outside
  //     const handleClickOutside = (e: Event) => {
  //         closeSidebar(e as MouseEvent); // Ensure the event is treated as MouseEvent
  //     };

  //     document.addEventListener('click', handleClickOutside);

  //     // Cleanup event listener when component unmounts
  //     return () => {
  //         document.removeEventListener('click', handleClickOutside);
  //     };
  // }, []);

  return (
    <div>
      {/* Toggle Button */}
      <button className="toggleBtn" onClick={toggleSidebar}>
        {isOpen ? (
          <X color="white" size={20} />
        ) : (
          <AlignJustify color="white" size={20} />
        )}
      </button>

      {/* Sidebar */}
      <div ref={sidebarRef} className={`sidebar ${isOpen ? "open" : ""}`}>
        <ul>
          <li className={pathname === "/resume-analysis" ? "active" : ""}>
            <Link href="/resume-analysis">Home</Link>
          </li>
          <li className={pathname === "/essential-libraries" ? "active" : ""}>
            <Link href="/essential-libraries">Essential Libraries</Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
