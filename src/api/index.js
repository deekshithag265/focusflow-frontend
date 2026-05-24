import api from "./axios";

// // ── Auth ──────────────────────────────────────────────
// export const authAPI = {
//   register:       (data)       => api.post("/auth/register", data),
//   login:          (data)       => api.post("/auth/login", data),
//   getMe:          ()           => api.get("/auth/me"),
//   updateSettings: (settings)   => api.put("/auth/settings", settings),
// };

export const authAPI = {
  register:       (data)       => api.post("/auth/register", data),
  login:          (data)       => api.post("/auth/login", data),
  getMe:          ()           => api.get("/auth/me"),
  updateSettings: (settings)   => api.put("/auth/settings", settings),
  getUserCount:   ()           => api.get("/auth/users/count"), 
  getUsers:       ()           => api.get("/auth/users"),
};

// ── Tasks ─────────────────────────────────────────────
export const tasksAPI = {
  getAll:  (params)     => api.get("/tasks", { params }),
  create:  (data)       => api.post("/tasks", data),
  update:  (id, data)   => api.put(`/tasks/${id}`, data),
  remove:  (id)         => api.delete(`/tasks/${id}`),
};

// ── Sessions ──────────────────────────────────────────
export const sessionsAPI = {
  getAll:   (params)    => api.get("/sessions", { params }),
  getStats: ()          => api.get("/sessions/stats"),
  start:    (data)      => api.post("/sessions/start", data),
  end:      (id, data)  => api.put(`/sessions/${id}/end`, data),
};