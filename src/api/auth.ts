import { api } from "./client";
import type {
  AuthUser,
  Contributor,
  Envelope,
  RawAuthUser,
  TokenPair,
} from "./types";

/** The server calls the id `id` on auth responses; everything else uses `_id`. */
export const normalizeAuthUser = (raw: RawAuthUser): AuthUser => ({
  ...raw,
  _id: String(raw._id ?? raw.id),
});

interface SessionPayload {
  user: RawAuthUser;
  tokens?: TokenPair;
}

export const login = async (body: { email: string; password: string }) => {
  const res = await api.post<Envelope<SessionPayload>>("/auth/login", body);
  return res.data.data;
};

export const register = (body: {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}) => api.post<Envelope<{ userId?: string }>>("/auth/register", body);

/** Verifying the code also signs the user in, exactly like a login. */
export const verifyEmail = async (body: { email: string; otp: string }) => {
  const res = await api.post<Envelope<SessionPayload>>("/auth/verify-email", body);
  return res.data.data;
};

export const resendOtp = (body: { email: string }) =>
  api.post("/auth/resend-otp", body);

export const forgotPassword = (body: { email: string }) =>
  api.post("/auth/forgot-password", body);

export const resetPassword = (body: {
  email: string;
  otp: string;
  newPassword: string;
  confirmNewPassword: string;
}) => api.post("/auth/reset-password", body);

export const changePassword = (body: {
  currentPassword: string;
  newPassword: string;
}) => api.post("/auth/change-password", body);

export const getMe = async () => {
  const res = await api.get<Envelope<{ user: RawAuthUser }>>("/auth/me");
  return normalizeAuthUser(res.data.data.user);
};

export const logout = () => api.post("/auth/logout", {});
export const logoutAll = () => api.post("/auth/logout-all", {});

export const deactivateAccount = () => api.post("/auth/deactivate", {});
export const deleteAccount = () => api.delete("/auth/account");

export const requestModRole = (body: { contactNo: string; motivation: string }) =>
  api.post("/auth/request-mod", body);

export const getContributors = async () => {
  const res = await api.get<{ contributors: Contributor[] }>("/auth/contributors");
  return res.data.contributors ?? [];
};

/** A picked file in the shape React Native's FormData expects. */
export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

export interface ProfileUpdate {
  name?: string;
  bio?: string;
  course?: string;
  contactNo?: string;
  profilePic?: UploadFile;
  showEmail?: boolean;
  showContactNo?: boolean;
  showCourse?: boolean;
}

export const updateProfile = async (data: ProfileUpdate) => {
  const form = new FormData();
  if (data.name !== undefined) form.append("name", data.name);
  if (data.bio !== undefined) form.append("bio", data.bio);
  if (data.course !== undefined) form.append("course", data.course);
  if (data.contactNo) form.append("contactNo", data.contactNo);
  if (data.profilePic) form.append("profilePic", data.profilePic as unknown as Blob);
  // Booleans are checked against undefined: `false` ("hide this") is the point.
  if (data.showEmail !== undefined) form.append("showEmail", String(data.showEmail));
  if (data.showContactNo !== undefined)
    form.append("showContactNo", String(data.showContactNo));
  if (data.showCourse !== undefined) form.append("showCourse", String(data.showCourse));

  const res = await api.put<Envelope<{ user: RawAuthUser }>>("/auth/profile", form, {
    headers: { "Content-Type": "multipart/form-data" },
    transformRequest: (d) => d,
  });
  return normalizeAuthUser(res.data.data.user);
};

export const removeProfilePic = async () => {
  const res = await api.delete<Envelope<{ user: RawAuthUser }>>("/auth/profile-pic");
  return normalizeAuthUser(res.data.data.user);
};
