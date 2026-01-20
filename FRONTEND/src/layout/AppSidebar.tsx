import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

// Assume these icons are imported from an icon library
import {
  AlertIcon,
  BoxCubeIcon,
  BoxIconLine,
  ChatIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DocsIcon,
  FolderIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  ListIcon,
  LockIcon,
  MailIcon,
  PieChartIcon,
  TableIcon,
  TaskIcon,
  UserCircleIcon,
  UserIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import SidebarWidget from "./SidebarWidget";

type SubItem = {
  name: string;
  path: string;
  icon?: React.ReactNode;
  pro?: boolean;
  new?: boolean;
  permission?: string;
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubItem[];
  permission?: string;
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <DocsIcon />,
    name: "Disaster Risk Assessment",
    path: "/disaster-risk-assessment",
  },
  {
    icon: <TableIcon />,
    name: "Disaster Risk Database",
    path: "/disaster-risk-database",
  },
  {
    icon: <GroupIcon />,
    name: "Community Management",
    path: "/community-management",
  },
  {
    icon: <AlertIcon />,
    name: "Early Warning",
    path: "/early-warning",
  },
  {
    icon: <UserCircleIcon />,
    name: "Volunteers",
    path: "/volunteers",
  },
  {
    icon: <ChatIcon />,
    name: "Awareness",
    path: "/awareness",
  },
  {
    icon: <TaskIcon />,
    name: "Inspection",
    path: "/inspection",
  },
  {
    icon: <PieChartIcon />,
    name: "Analytics",
    path: "/analytics",
  },
];

const adminItems: NavItem[] = [
  {
    icon: <BoxCubeIcon />,
    name: "Structure",
    subItems: [
     
      {
        name: "Organizations",
        path: "/admin/organizations",
        icon: <BoxCubeIcon />,
        permission: "view_organization",
      },
      {
        name: "Sectors",
        path: "/admin/sectors",
        icon: <BoxIconLine />,
        permission: "view_sector",
      },
      {
        name: "Departments",
        path: "/admin/departments",
        icon: <FolderIcon />,
        permission: "view_department",
      },
      {
        name: "Teams",
        path: "/admin/teams",
        icon: <GroupIcon />,
        permission: "view_team",
      },
       {
        name: "Graph",
        path: "/admin/structure-graph",
        icon: <GridIcon />,
        permission: "view_organization",
      }
    ],
  },
  {
    icon: <LockIcon />,
    name: "Auth",
    subItems: [
      {
        name: "Permissions",
        path: "/admin/permissions",
        icon: <LockIcon />,
        permission: "view_permission",
      },
      {
        name: "Roles",
        path: "/admin/roles",
        icon: <CheckCircleIcon />,
        permission: "view_role",
      },
      {
        name: "Users",
        path: "/admin/users",
        icon: <UserIcon />,
        permission: "view_user",
      },
      {
        name: "Hierarchy",
        path: "/admin/hierarchy",
        icon: <BoxIconLine />,
        permission: "view_user",
      },
    ],
  },
  {
    icon: <ListIcon />,
    name: "Audit",
    subItems: [
      {
        name: "Audit Logs",
        path: "/admin/audit-logs",
        icon: <ListIcon />,
        permission: "view_audit_log",
      },
      {
        name: "Email Logs",
        path: "/admin/email-logs",
        icon: <MailIcon />,
        permission: "view_audit_log",
      },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "admin";
    index: number;
  } | null>(null);

  // State to store submenu heights
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Helper to check if a path is active
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  // Helper to check permissions
  const checkPermission = (permission?: string) => {
    // Super Admin has full access
    if (user?.roles?.some(r => ['superadmin', 'super admin'].includes(r.name.toLowerCase()))) {
      return true;
    }
    // If no permission requirement, it's public (to auth users)
    if (!permission) return true;
    // Check if user has the specific permission
    return user?.permissions?.includes(permission) || false;
  };

  // Filter items based on permissions
  const filterItems = (items: NavItem[]) => {
    return items.map(item => {
      // If item has subItems, filter them
      if (item.subItems) {
        const filteredSub = item.subItems.filter(sub => checkPermission(sub.permission));
        // If subItems exist after filter, keep the item with filtered subItems
        if (filteredSub.length > 0) {
          return { ...item, subItems: filteredSub };
        }
        // If no subItems match, don't show the parent
        return null;
      }
      // If no subItems, just check permission on the item itself
      return checkPermission(item.permission) ? item : null;
    }).filter(Boolean) as NavItem[];
  };

  const filteredAdminItems = filterItems(adminItems);
  const hasAdminAccess = filteredAdminItems.length > 0;

  useEffect(() => {
    let submenuMatched = false;
    ["main", "admin"].forEach((menuType) => {
      // Use original items for matching to keep state consistent even if hidden
      const items = menuType === "main" ? navItems : adminItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "admin",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "admin") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "admin") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={`menu-item-icon-size  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? "rotate-180 text-brand-500"
                    : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.icon && (
                        <span className="[&>svg]:w-5 [&>svg]:h-5">
                          {subItem.icon}
                        </span>
                      )}
                      <span>{subItem.name}</span>
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex items-center gap-3 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link to="/" className="flex items-center gap-3">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                src="/images/logo/logo.png"
                alt="Logo"
                className="h-12 w-12 object-contain"
              />
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                IDRMIS
              </h3>
            </>
          ) : (
            <img
              src="/images/logo/logo.png"
              alt="Logo"
              className="h-10 w-10 object-contain"
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            <div className="">
              {hasAdminAccess && (
                <>
                  <h2
                    className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                      }`}
                  >
                    {isExpanded || isHovered || isMobileOpen ? (
                      "Admin"
                    ) : (
                      <HorizontaLDots />
                    )}
                  </h2>
                  {renderMenuItems(filteredAdminItems, "admin")}
                </>
              )}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
