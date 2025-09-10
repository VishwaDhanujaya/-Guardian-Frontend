// Mock API helpers for authentication and data fetching
// Replace the mock URL and responses with real backend integration later

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://mockapi.local';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function mockRequest(path: string, init?: RequestInit): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    // ignore network errors – this is a mock
  }
  await delay(500);
}

export type AuthResponse = {
  token: string;
  user: { name: string; role: 'citizen' | 'officer' };
  requiresMfa?: boolean;
};

export async function loginUser(
  identifier: string,
  password: string,
  role: 'citizen' | 'officer',
): Promise<AuthResponse> {
  await mockRequest('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password, role }),
  });

  if (identifier === 'error') {
    throw new Error('Invalid credentials');
  }

  return {
    token: 'mock-jwt',
    user: { name: 'Test User', role },
    requiresMfa: role === 'officer',
  };
}

export async function registerUser(data: {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  await mockRequest('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (data.email.endsWith('@taken.com')) {
    throw new Error('Email already registered');
  }

  return {
    token: 'mock-jwt',
    user: { name: `${data.firstName} ${data.lastName}`, role: 'citizen' },
  };
}

export async function verifyMfa(
  code: string,
  role: 'citizen' | 'officer',
): Promise<AuthResponse> {
  await mockRequest('/mfa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, role }),
  });

  if (code !== '123456') {
    throw new Error('Invalid code');
  }

  return { token: 'mock-jwt', user: { name: 'Test User', role } };
}

export async function fetchProfile(
  token: string,
  role: 'citizen' | 'officer',
): Promise<{ name: string; role: 'citizen' | 'officer' }> {
  await mockRequest('/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });

  return { name: role === 'officer' ? 'Officer Mock' : 'Test User', role };
}

// Alerts
export type AlertDraft = {
  id?: string;
  title: string;
  message: string;
  region: string;
};

export type AlertRow = {
  id: string;
  title: string;
  message: string;
  region: string;
};

export async function fetchAlerts(): Promise<AlertRow[]> {
  await mockRequest('/alerts');
  return [
    {
      id: 'a1',
      title: 'Road closure at Main St',
      message: 'Main St closed 9–12 for parade. Use 5th Ave detour.',
      region: 'Central Branch',
    },
    {
      id: 'a2',
      title: 'Severe weather advisory',
      message: 'Heavy rains expected. Avoid low-lying roads.',
      region: 'West Branch',
    },
  ];
}

export async function getAlert(id: string): Promise<AlertDraft> {
  await mockRequest(`/alerts/${id}`);
  return {
    id,
    title: 'Road closure at Main St',
    message: 'Main St closed 9–12 for parade. Use 5th Ave detour.',
    region: 'Central Branch',
  };
}

export async function saveAlert(data: AlertDraft): Promise<AlertDraft> {
  await mockRequest(data.id ? `/alerts/${data.id}` : '/alerts', {
    method: data.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return { ...data, id: data.id ?? 'new-alert' };
}

// Incidents
export type Note = { id: string; text: string; at: string; by: string };

export type Report = {
  id: string;
  title: string;
  category: 'Safety' | 'Crime' | 'Maintenance' | 'Other';
  location: string;
  reportedBy: string;
  reportedAt: string;
  status: 'New' | 'In Review' | 'Approved' | 'Assigned' | 'Ongoing' | 'Resolved';
  priority: 'Urgent' | 'Normal' | 'Low';
  description?: string;
  notes: Note[];
};

export async function getIncident(id: string): Promise<Report> {
  await mockRequest(`/incidents/${id}`);
  return {
    id,
    title: 'Traffic accident · Main St',
    category: 'Safety',
    location: 'Main St & 3rd Ave',
    reportedBy: 'Alex Johnson',
    reportedAt: 'Today · 3:10 PM',
    status: 'In Review',
    priority: 'Urgent',
    description:
      'Two vehicles collided at the intersection. No visible fire. One lane blocked. Requesting traffic control.',
    notes: [
      { id: 'n1', text: 'Report received. Reviewing details.', at: '3:12 PM', by: 'System' },
    ],
  };
}

// Lost & Found
export type FoundItem = { id: string; title: string; meta: string };

export async function fetchFoundItems(): Promise<FoundItem[]> {
  await mockRequest('/lost-found');
  return [
    { id: 'f1', title: 'Wallet', meta: 'Negombo · Brown leather' },
    { id: 'f2', title: 'Phone', meta: 'Colombo · Samsung, black' },
  ];
}

export async function reportLostItem(data: {
  itemName: string;
  desc: string;
  model: string;
  serial: string;
  lastLoc: string;
  color: string;
}): Promise<{ success: boolean }> {
  await mockRequest('/lost-found', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (data.itemName.toLowerCase() === 'fail') {
    throw new Error('Submission failed');
  }

  return { success: true };
}

export type FoundItemDetail = {
  id: string;
  name: string;
  description?: string;
  model?: string;
  serial?: string;
  color?: string;
  lastLocation?: string;
  branch?: string;
  postedAt?: string;
};

export async function getFoundItem(id: string): Promise<FoundItemDetail> {
  await mockRequest(`/lost-found/found/${id}`);
  return {
    id,
    name: "Wallet",
    description: "Brown leather wallet",
    model: "N/A",
    serial: "N/A",
    color: "Brown",
    lastLocation: "Negombo PS",
    branch: "Negombo",
    postedAt: "Today 10:30",
  };
}

export type LostItemDetail = {
  id: string;
  name: string;
  description?: string;
  model?: string;
  serial?: string;
  color?: string;
  lastLocation?: string;
  reportedBy?: string;
  reportedAt?: string;
  status?: string;
};

export async function getLostItem(id: string): Promise<LostItemDetail> {
  await mockRequest(`/lost-found/lost/${id}`);
  return {
    id,
    name: "Phone",
    description: "Samsung black case",
    model: "S21",
    serial: "IMEI123",
    color: "Black",
    lastLocation: "Colombo Central",
    reportedBy: "Priya K.",
    reportedAt: "Yesterday 15:20",
    status: "In Review",
  };
}

