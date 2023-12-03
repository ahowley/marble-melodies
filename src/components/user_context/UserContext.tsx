import {
  createContext,
  useContext,
  ParentComponent,
  createSignal,
  Accessor,
  Setter,
} from "solid-js";
import { GameState } from "../game_context/GameContext";
import { Track } from "../track_grid/TrackGrid";

export type ServerResponse = {
  status: number;
  data: {
    id?: number;
    token?: string;
    trackId?: number;
    user_id?: number;
    name?: string;
    initialState?: GameState;
    previewOnPlayback?: boolean;
    volume?: number;
    message?: string;
    errors?: { location: string; msg: string; path: string; type: string; value: string }[];
  };
  tracks?: Track[];
};

type LoginBody = {
  username: string;
  password: string;
};

export type SaveTrackBody = {
  name: string;
  previewOnPlayback: boolean;
  volume: number;
  initialState: GameState;
};

type AuthContext = {
  lastVisitedTrackId: [() => string | null, (id: string | null) => void];
  lastVisitedOwnedByUser: [() => boolean, (isOwnedByUser: boolean) => void];
  lastVisitedName: [() => string | null, (id: string | null) => void];
  unsavedChangesSignal: [Accessor<boolean>, Setter<boolean>];
  unsavedChangesStored: [() => boolean, (hasUnsavedChanges: boolean) => void];
  userId: [() => number | null, (id: number) => void];
  jwt: [() => string | null, (id: string) => void];
  logout: () => void;
  server: {
    register: (postBody: LoginBody) => Promise<ServerResponse>;
    login: (postBody: LoginBody) => Promise<ServerResponse>;
    getTrack: (id: string) => Promise<ServerResponse>;
    getHomeTracks: () => Promise<ServerResponse>;
    getUserTracks: () => Promise<ServerResponse>;
    postTrack: (postBody: SaveTrackBody) => Promise<ServerResponse>;
    putTrack: (id: string, postBody: SaveTrackBody) => Promise<ServerResponse>;
    deleteTrack: (id: string) => Promise<ServerResponse>;
  };
};

const backendUrl = import.meta.env.VITE_BACKEND;
const serverRequest = async (
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  body?: object,
  auth = false,
  dataIsTracks = false,
): Promise<ServerResponse> => {
  const options: RequestInit = {
    method: method,
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  if (auth) {
    if (!options.headers) throw new TypeError("Something went wrong with the request headers.");
    const authHeader = localStorage.getItem("token");
    if (!authHeader) throw new TypeError("User is not logged in.");
    options.headers = {
      ...options.headers,
      authorization: authHeader,
    };
  }

  const response = await fetch(`${backendUrl}${endpoint}`, options);
  const { status } = response;

  if (dataIsTracks) {
    const tracks = await response.json();
    return { status, data: {}, tracks };
  }

  if (status !== 204) {
    const data = await response.json();
    return { status, data };
  }

  return { status, data: {} };
};

const authContext: AuthContext = {
  lastVisitedTrackId: [
    () => sessionStorage.getItem("lastVisitedTrackId") || null,
    (id: string | null) =>
      id
        ? sessionStorage.setItem("lastVisitedTrackId", id)
        : sessionStorage.removeItem("lastVisitedTrackId"),
  ],
  lastVisitedOwnedByUser: [
    () => {
      const isOwnedByUser = sessionStorage.getItem("lastVisitedOwnedByUser") === "true";
      return isOwnedByUser;
    },
    (isOwnedByUser: boolean) =>
      isOwnedByUser
        ? sessionStorage.setItem("lastVisitedOwnedByUser", "true")
        : sessionStorage.removeItem("lastVisitedOwnedByUser"),
  ],
  lastVisitedName: [
    () => {
      const name = sessionStorage.getItem("lastVisitedName") || null;
      return name;
    },
    (name: string | null) =>
      name
        ? sessionStorage.setItem("lastVisitedName", name)
        : sessionStorage.removeItem("lastVisitedName"),
  ],
  unsavedChangesSignal: createSignal(false),
  unsavedChangesStored: [
    () => {
      const hasUnsavedChanges = localStorage.getItem("unsavedChanges") === "true";
      return hasUnsavedChanges;
    },
    (hasUnsavedChanges: boolean) =>
      hasUnsavedChanges
        ? localStorage.setItem("unsavedChanges", "true")
        : localStorage.removeItem("unsavedChanges"),
  ],
  userId: [
    () => {
      const loggedId = localStorage.getItem("userId");
      if (loggedId) return parseInt(loggedId);
      return null;
    },
    (id: number) => localStorage.setItem("userId", `${id}`),
  ],
  jwt: [
    () => localStorage.getItem("token") || null,
    (jwt: string) => localStorage.setItem("token", jwt),
  ],
  logout: () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
  },
  server: {
    register: async (postBody: LoginBody) =>
      await serverRequest("POST", "/user/register", postBody),
    login: async (postBody: LoginBody) => await serverRequest("POST", "/user/login", postBody),
    getTrack: async (id: string) => await serverRequest("GET", `/track/${id}`),
    getHomeTracks: async () => await serverRequest("GET", "/track", undefined, false, true),
    getUserTracks: async () => await serverRequest("GET", "/user/track", undefined, true, true),
    postTrack: async (postBody: SaveTrackBody) =>
      await serverRequest("POST", "/track", postBody, true),
    putTrack: async (id: string, putBody: SaveTrackBody) =>
      await serverRequest("PUT", `/track/${id}`, putBody, true),
    deleteTrack: async (id: string) =>
      await serverRequest("DELETE", `/track/${id}`, undefined, true),
  },
};

const UserContext = createContext<AuthContext>(authContext);

export const UserProvider: ParentComponent = (props) => {
  return <UserContext.Provider value={authContext}>{props.children}</UserContext.Provider>;
};

export const useUserContext = () => useContext<AuthContext>(UserContext);
