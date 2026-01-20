import { useState, useEffect } from 'react';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { getOrganizations } from '../../api/organizationService';
import { getDepartments, Department } from '../../api/departmentService';
import { getTeams, Team } from '../../api/teamService';
import api from '../../api/axios';

// Interfaces
interface Organization {
    id: string;
    name: string;
    type: string;
    parentId?: string | { id: string; name: string } | null;
}

interface Sector {
    id: string;
    name: string;
    organizationId: string;
}

// Tree Node Types
interface TeamNode {
    type: 'team';
    data: Team;
}

interface DeptNode {
    type: 'department';
    data: Department;
    children: TeamNode[];
}

interface SectorNode {
    type: 'sector';
    data: Sector;
    children: DeptNode[];
}

interface OrgNode {
    type: 'organization';
    data: Organization;
    children: (OrgNode | SectorNode | DeptNode)[];
}

// Union type for all nodes
type TreeNodeType = OrgNode | SectorNode | DeptNode | TeamNode;

const TreeNode = ({ node, level = 0, onTeamClick }: { node: TreeNodeType; level?: number; onTeamClick: (team: Team) => void }) => {
    const [isOpen, setIsOpen] = useState(true);

    // Helper to safely check children existence
    const hasChildren = 'children' in node && Array.isArray(node.children) && node.children.length > 0;

    // Color coding based on type
    const getColor = (type: string) => {
        switch (type) {
            case 'organization': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border-blue-200 dark:border-blue-700';
            case 'sector': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 border-purple-200 dark:border-purple-700';
            case 'department': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border-green-200 dark:border-green-700';
            case 'team': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 border-orange-200 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-900/60';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getLabel = (type: string) => {
        switch (type) {
            case 'organization': return 'Organization';
            case 'sector': return 'Sector';
            case 'department': return 'Department';
            case 'team': return 'Team';
            default: return '';
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.type === 'team') {
            onTeamClick(node.data);
        } else {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className="flex flex-col select-none">
            <div
                className={`flex items-center p-3 mb-2 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm ${getColor(node.type)}`}
                style={{ marginLeft: `${level * 24}px` }}
                onClick={handleClick}
            >
                <div className="flex items-center gap-2 flex-1">
                    {hasChildren ? (
                        <div
                            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(!isOpen);
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    ) : (
                        <div className="w-5" /> // Spacer
                    )}
                    <span className="text-xs font-semibold uppercase tracking-wider opacity-70 w-20 text-right mr-2">
                        {getLabel(node.type)}
                    </span>
                    <span className="font-medium text-base truncate">
                        {node.data.name}
                    </span>
                    {node.type === 'organization' && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded border border-current opacity-60">
                            {node.data.type.replace('_', ' ')}
                        </span>
                    )}
                    {node.type === 'team' && (
                        <span className="ml-auto flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/30">
                                Click for details
                            </span>
                        </span>
                    )}
                </div>
            </div>

            {hasChildren && isOpen && (
                <div className="relative">
                    {/* Connecting line */}
                    <div
                        className="absolute left-0 bottom-4 w-px bg-gray-300 dark:bg-gray-700"
                        style={{ left: `${(level * 24) + 10}px`, top: '-8px' }}
                    />

                    <div>
                        {(node as any).children.map((child: TreeNodeType, idx: number) => (
                            <TreeNode
                                key={((child.data as any).id || (child.data as any)._id || idx) + child.type}
                                node={child}
                                level={level + 1}
                                onTeamClick={onTeamClick}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Simple Modal Component
const TeamDetailsModal = ({ team, onClose }: { team: Team | null; onClose: () => void }) => {
    if (!team) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {team.name} <span className="text-sm font-normal text-gray-500 ml-2">(Team Details)</span>
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {team.description && (
                        <div className="mb-6">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                                {team.description}
                            </p>
                        </div>
                    )}

                    <div className="mb-6">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Team Leader</h4>
                        {team.teamLeader ? (
                            <div className="flex items-center p-3 rounded-lg border border-purple-100 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800">
                                <div className="h-10 w-10 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center font-bold mr-3">
                                    {team.teamLeader.fullname?.charAt(0) || 'L'}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{team.teamLeader.fullname}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{team.teamLeader.email}</p>
                                </div>
                                <span className="ml-auto text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full font-medium">
                                    Leader
                                </span>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No team leader assigned.</p>
                        )}
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            Team Members <span className="ml-1 text-gray-400">({team.members?.length || 0})</span>
                        </h4>

                        {!team.members || team.members.length === 0 ? (
                            <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                                No members added yet.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {team.members.map((member: any) => (
                                    <div key={member._id || member.id} className="flex items-center p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-200 flex items-center justify-center font-bold text-xs mr-3">
                                            {member.fullname?.charAt(0) || 'M'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{member.fullname}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function StructureGraph() {
    const [treeData, setTreeData] = useState<OrgNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

    useEffect(() => {
        buildTree();
    }, []);

    const buildTree = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("Fetching structure data...");
            // Use services where possible to handle response unwrapping
            const [orgsData, sectorsRes, deptsData, teamsData] = await Promise.all([
                getOrganizations(),
                api.get('/sectors'),
                getDepartments(),
                getTeams()
            ]);

            // Normalize Data
            const orgs: Organization[] = Array.isArray(orgsData) ? orgsData : (orgsData as any).data || [];
            const sectors: Sector[] = Array.isArray(sectorsRes.data) ? sectorsRes.data : [];
            const depts: Department[] = Array.isArray(deptsData) ? deptsData : [];
            const teams: Team[] = Array.isArray(teamsData) ? teamsData : [];

            // Helper to get ID from object or string
            const getId = (obj: any): string | null => {
                if (!obj) return null;
                if (typeof obj === 'string') return obj;
                if (typeof obj === 'object' && obj.id) return obj.id;
                if (typeof obj === 'object' && obj._id) return obj._id;
                return null;
            };

            // Recursive function to build organization node
            const buildOrgNode = (org: Organization): OrgNode => {
                // 1. Find Sub-Organizations (Branches)
                const childOrgs = orgs.filter(o => {
                    const parentId = getId(o.parentId);
                    return parentId === org.id;
                });
                const childOrgNodes = childOrgs.map(childOrg => buildOrgNode(childOrg));

                // 2. Find Sectors
                const orgSectors = sectors.filter(s => {
                    // Try multiple ways to get the organization ID
                    const sAny = s as any;
                    const sOrgId = getId(s.organizationId) || getId(sAny.organization);
                    const isMatch = sOrgId === org.id;
                    if (isMatch) console.log(`Matched Sector ${s.name} to Org ${org.name}`);
                    return isMatch;
                });

                console.log(`Org: ${org.name}, Sectors Found: ${orgSectors.length}`);

                // 3. Build Sector Nodes (finding Departments from GLOBAL list)
                const sectorNodes: SectorNode[] = orgSectors.map(sector => {
                    // Find Departments for this Sector from GLOBAL list
                    const sectorDepts = depts.filter(d => {
                        const dAny = d as any;
                        const sId = getId(dAny.sectorId) || getId(dAny.sector);
                        return sId === sector.id;
                    });

                    const deptNodes: DeptNode[] = sectorDepts.map(dept => buildDeptNode(dept));

                    return {
                        type: 'sector',
                        data: sector,
                        children: deptNodes
                    };
                });

                // 4. Find Direct Departments (those associated with Org but NOT any Sector)
                // We search global depts for those matching Org ID, then exclude those we already found in sectors
                const assignedDeptIds = new Set<string>();
                sectorNodes.forEach(s => s.children.forEach(d => assignedDeptIds.add(d.data.id)));

                const directDepts = depts.filter(d => {
                    const dAny = d as any;
                    const orgId = getId(d.organizationId) || getId(dAny.organization);
                    // Must match Org AND not be in a sector we just processed
                    // (Note: if a dept has a sector that belongs to ANOTHER org, it won't be in assignedDeptIds,
                    // but we should technically exclude it if it has ANY sector. User implies strict hierarchy.)
                    const hasSector = getId(dAny.sectorId) || getId(dAny.sector);

                    return orgId === org.id && !hasSector;
                });

                const directDeptNodes: DeptNode[] = directDepts.map(dept => buildDeptNode(dept));

                // Combine all children
                const children = [...sectorNodes, ...directDeptNodes, ...childOrgNodes];

                return {
                    type: 'organization',
                    data: org,
                    children: children
                };
            };

            const buildDeptNode = (dept: Department): DeptNode => {
                const deptTeams = teams.filter(t => getId(t.department) === dept.id);
                const teamNodes: TeamNode[] = deptTeams.map(t => ({
                    type: 'team',
                    data: t
                }));

                return {
                    type: 'department',
                    data: dept,
                    children: teamNodes
                };
            };

            // Start with Root Organizations (parentId is null or undefined)
            const rootOrgs = orgs.filter(o => !getId(o.parentId));
            const rootNodes = rootOrgs.map(org => buildOrgNode(org));

            setTreeData(rootNodes);

        } catch (error: any) {
            console.error('Failed to build organization tree', error);
            setError(error.message || "Failed to load hierarchy data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <PageMeta
                title="Structure Graph | IDRMIS"
                description="Organization Structure Hierarchy"
            />
            <PageBreadcrumb pageTitle="Structure Graph" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Organization Hierarchy
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Visual representation of the entire organization structure. Click on a Team to view its members.
                    </p>
                </div>

                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                    </div>
                ) : error ? (
                    <div className="p-4 rounded-lg bg-red-50 text-red-500 text-center">
                        {error}
                    </div>
                ) : (
                    <div className="overflow-x-auto pb-4">
                        <div className="min-w-[800px]">
                            {treeData.length === 0 ? (
                                <p className="text-center text-gray-500">No root organizations found.</p>
                            ) : (
                                treeData.map(node => (
                                    <TreeNode
                                        key={node.data.id}
                                        node={node}
                                        onTeamClick={setSelectedTeam}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Team Details Modal */}
            <TeamDetailsModal
                team={selectedTeam}
                onClose={() => setSelectedTeam(null)}
            />
        </>
    );
}
