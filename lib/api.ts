const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  if (!res.ok) {
    throw new Error(`API request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type AlertDraft = {
  id?: string;
  title: string;
  message: string;
  region: string;
};

export async function getAlert(id: string): Promise<AlertDraft> {
  return fetchJSON<AlertDraft>(`/alerts/${id}`);
}

export async function saveAlert(data: AlertDraft): Promise<AlertDraft> {
  const method = data.id ? 'PUT' : 'POST';
  const path = data.id ? `/alerts/${data.id}` : '/alerts';
  return fetchJSON<AlertDraft>(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

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
  return fetchJSON<Report>(`/incidents/${id}`);
}
