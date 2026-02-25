import { useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  members: number;
  activeProjects: number;
  totalProjects: number;
  progress: number;
  progressColor: string;
  memberImages: string[];
  additionalMembers: number;
  sparklineData: string;
  teamEmails: string[];
  createdAt: string;
  lastActive: string;
}

const STORAGE_KEY = 'kaal_workspaces';

// Default workspaces
const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: "design-system",
    name: "Design System",
    description: "Centralized UI library & assets for KAAL v2.0",
    icon: "diamond",
    gradient: "from-purple-400 via-pink-300 to-blue-300",
    members: 12,
    activeProjects: 8,
    totalProjects: 12,
    progress: 70,
    progressColor: "bg-indigo-500",
    memberImages: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAvMr2ckmALhAmY-nlphdz5_1g-W4nSwmTD3XQAZ7bXuPZrCROdjRexpspaVU2A5WL-nrLfIoVxlw-YD8FPzxohwaMBGYpJDJ78M8G80Z-VYFj7Vk11uo-5Lyhe77wLfrfukWlWEyqro8BlxR0FrMtL8rQkmS1EpaAf0v5pwK4H8R0KHfVufV9eNIAfDjxf6o0BnteqveLDxLiKtehgltZEv4-7-Nxb3NAbdbTe0kmC_1ZPiufMkq-EIoBtcHsQTMB_L0TijSkqBAU",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCaAfwKRoXyqTqisuBbDeLNfsJMTgMnBqZpolQCs3M5wQDsCc2Dn5wneG5-UDVz7K8mt6PpS4nTNUVslzg837NuVuIm2FsHi-8mFcV62WvkUI4_GyqEblJU6zAEMemMHHT-CKZCP_RwTCd7WvkQ5TM3cWq5WkOEhfLdDFwfJuJnCpOP5cnD7JO42Mc_SUAhqA6lgon_OM-t-KckeHNeJYOJsP5KavB8bIdFcm7FKBtFhG-Uzz_XBXdYsN2TJ5K6iIKhUl6HJuA8YlI"
    ],
    additionalMembers: 10,
    sparklineData: "M0,25 Q10,20 20,25 T40,15 T60,20 T80,5 T100,15",
    teamEmails: ["alex@kaal.design", "sarah@kaal.design"],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "growth-q4",
    name: "Growth Q4",
    description: "Marketing campaigns and outreach strategy",
    icon: "rocket",
    gradient: "from-pink-400 via-red-400 to-yellow-300",
    members: 8,
    activeProjects: 3,
    totalProjects: 5,
    progress: 45,
    progressColor: "bg-pink-500",
    memberImages: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDnRIQQFUk7sXrUrvG5brZonDUmI1uHaDRiEqXk0KDj4tmXUXfopgF0JWLa3jyXwDqSjJhk8joyuG6MPR-5367ggc3GqFsNiVHd-c1I_bJr6hydjGoBIQd6MYM-Pkx2GtBzAxPSZLeIgNbqDjFUSUx35VM0-HpYU-0JvAa1Ov92-fyUbZcXh2SSJmZPQNz4J_1Ir4M4-m4PZR5zP3YyWtd_XgB9ChvLLmcVyXsaCXk3zxaxQ7MKX7V96l3E_RpWXu5MePWcdgj1DE8",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCXWuEOy5TvqMUKmavY_CdaLE3OmDz0RUAMipb2g1nMICred0JAI-h7pgF-WJs12GZEyWzrZNyprYqsKca-L2Ond5kfrCgbIhlqPD7ppoUGuY5QCWVqwxbzX9lvNUXqlPtwmFl1BJMN6S7KDBlxAOssUEFUmJtAw9DUq1iuziz4mQ3HPVRD3FnlLMfFbWJSNDC9dJNe0DrHaTKd4XKDTHnv2FhmXTi_E3T7q-WYNwUtL--_LDQxaQB049WVKXEa0dxIVKqwDYH3ygQ"
    ],
    additionalMembers: 6,
    sparklineData: "M0,20 Q20,25 40,10 T80,20 T100,5",
    teamEmails: ["marketing@kaal.design"],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "engineering",
    name: "Engineering",
    description: "Backend architecture & devops pipelines",
    icon: "code",
    gradient: "from-blue-400 via-cyan-300 to-teal-300",
    members: 24,
    activeProjects: 15,
    totalProjects: 18,
    progress: 85,
    progressColor: "bg-cyan-500",
    memberImages: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCngjfsdqfomXvbRvK8TfB0txMGNmijVG3D0wytlNfACpevA6lRKZib-nJfQBx9QptMeM7oZbv9orblmEy5xM4gMSTwG7v_EFMa9OeRolkV4hnkbUhAxejRit7JMT8y496nNPrJSF9_qqRj2KzMWNk8blQc8lVX79406ZvpWjNdJVBmWqLdqb84eQsUU9aXShiovWw4TJ7YwjzYgo7rLsRfMaU3DbHiAh6k_zxFC8t5cAFj2z_3UYtcppgn4Hg2JaQ-eO6BnZzCEiw",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAN63VPamqK4EUd_btHTsZ9WJhkJDQDRLjxIRAewLBTp10e45t19ZQezN5Tl_Gzpk8pL2-ezVCNpJ5-EI-8QMnPtZ0VzCCpjteyezCUjZEJoUMLX-pQ96gBBTFnVBfQXK45na0P0NQfG-amUPvg1abuiLb6WdOE8Acu5bDBygvrkHO2Bz0UuuevwBHFxsJYY8UBBAfqv6E2YNDpz6Oj1j5yn3WWRW20IjS8eiyhEA0uTx-NayOlZj6vhQHB0Q-KgnUARrzn1c2i5Ew"
    ],
    additionalMembers: 22,
    sparklineData: "M0,15 L20,15 L30,5 L40,25 L50,15 L70,15 L80,5 L100,10",
    teamEmails: ["dev@kaal.design"],
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: "brand-identity",
    name: "Brand Identity",
    description: "Visual language exploration",
    icon: "palette",
    gradient: "from-orange-400 via-pink-400 to-yellow-300",
    members: 4,
    activeProjects: 2,
    totalProjects: 2,
    progress: 100,
    progressColor: "bg-orange-400",
    memberImages: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAvMr2ckmALhAmY-nlphdz5_1g-W4nSwmTD3XQAZ7bXuPZrCROdjRexpspaVU2A5WL-nrLfIoVxlw-YD8FPzxohwaMBGYpJDJ78M8G80Z-VYFj7Vk11uo-5Lyhe77wLfrfukWlWEyqro8BlxR0FrMtL8rQkmS1EpaAf0v5pwK4H8R0KHfVufV9eNIAfDjxf6o0BnteqveLDxLiKtehgltZEv4-7-Nxb3NAbdbTe0kmC_1ZPiufMkq-EIoBtcHsQTMB_L0TijSkqBAU"
    ],
    additionalMembers: 3,
    sparklineData: "M0,28 Q50,28 100,5",
    teamEmails: ["design@kaal.design"],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  }
];

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  // Load workspaces from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setWorkspaces(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse workspaces:', error);
        setWorkspaces(DEFAULT_WORKSPACES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WORKSPACES));
      }
    } else {
      setWorkspaces(DEFAULT_WORKSPACES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WORKSPACES));
    }
    setLoading(false);
  }, []);

  // Save to localStorage whenever workspaces change
  const saveWorkspaces = (updatedWorkspaces: Workspace[]) => {
    setWorkspaces(updatedWorkspaces);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWorkspaces));
  };

  // Create a new workspace
  const createWorkspace = (data: {
    name: string;
    icon: string;
    teamEmails: string[];
  }) => {
    const gradients = [
      "from-purple-400 via-pink-300 to-blue-300",
      "from-pink-400 via-red-400 to-yellow-300",
      "from-blue-400 via-cyan-300 to-teal-300",
      "from-orange-400 via-pink-400 to-yellow-300",
      "from-green-400 via-emerald-300 to-teal-300",
      "from-indigo-400 via-purple-300 to-pink-300"
    ];

    const progressColors = [
      "bg-indigo-500",
      "bg-pink-500",
      "bg-cyan-500",
      "bg-orange-400",
      "bg-green-500",
      "bg-purple-500"
    ];

    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    const randomProgressColor = progressColors[Math.floor(Math.random() * progressColors.length)];

    const newWorkspace: Workspace = {
      id: `workspace-${Date.now()}`,
      name: data.name,
      description: "Newly created workspace",
      icon: data.icon,
      gradient: randomGradient,
      members: data.teamEmails.length + 1, // +1 for creator
      activeProjects: 0,
      totalProjects: 0,
      progress: 0,
      progressColor: randomProgressColor,
      memberImages: [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAvMr2ckmALhAmY-nlphdz5_1g-W4nSwmTD3XQAZ7bXuPZrCROdjRexpspaVU2A5WL-nrLfIoVxlw-YD8FPzxohwaMBGYpJDJ78M8G80Z-VYFj7Vk11uo-5Lyhe77wLfrfukWlWEyqro8BlxR0FrMtL8rQkmS1EpaAf0v5pwK4H8R0KHfVufV9eNIAfDjxf6o0BnteqveLDxLiKtehgltZEv4-7-Nxb3NAbdbTe0kmC_1ZPiufMkq-EIoBtcHsQTMB_L0TijSkqBAU"
      ],
      additionalMembers: Math.max(0, data.teamEmails.length - 1),
      sparklineData: "M0,20 L100,20",
      teamEmails: data.teamEmails,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    const updatedWorkspaces = [...workspaces, newWorkspace];
    saveWorkspaces(updatedWorkspaces);
    toast.success(`Workspace "${data.name}" created!`, {
      description: `Invitations sent to ${data.teamEmails.length} team member(s)`
    });
    
    return newWorkspace;
  };

  // Update workspace
  const updateWorkspace = (id: string, updates: Partial<Workspace>) => {
    const updatedWorkspaces = workspaces.map(ws =>
      ws.id === id
        ? { ...ws, ...updates, lastActive: new Date().toISOString() }
        : ws
    );
    saveWorkspaces(updatedWorkspaces);
    toast.success('Workspace updated successfully');
  };

  // Delete workspace
  const deleteWorkspace = (id: string) => {
    const workspace = workspaces.find(ws => ws.id === id);
    const updatedWorkspaces = workspaces.filter(ws => ws.id !== id);
    saveWorkspaces(updatedWorkspaces);
    toast.success(`Workspace "${workspace?.name}" deleted`);
  };

  // Update last active
  const touchWorkspace = (id: string) => {
    const updatedWorkspaces = workspaces.map(ws =>
      ws.id === id
        ? { ...ws, lastActive: new Date().toISOString() }
        : ws
    );
    saveWorkspaces(updatedWorkspaces);
  };

  // Sort workspaces
  const getSortedWorkspaces = (sortBy: 'active' | 'name' | 'members') => {
    const sorted = [...workspaces];
    
    switch (sortBy) {
      case 'active':
        return sorted.sort((a, b) => 
          new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
        );
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'members':
        return sorted.sort((a, b) => b.members - a.members);
      default:
        return sorted;
    }
  };

  return {
    workspaces,
    loading,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    touchWorkspace,
    getSortedWorkspaces
  };
}
