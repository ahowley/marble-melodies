import { createContext, useContext, ParentComponent } from "solid-js";
import { GameState } from "../game_context/GameContext";

type ServerResponse = {
  status: number;
  data: {
    id?: number;
    user_id?: number;
    initialState?: GameState;
    previewOnPlayback?: boolean;
    volume?: number;
  };
};

const backendUrl = import.meta.env.VITE_BACKEND;
const serverRequest = async (
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  body?: object,
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

  const response = await fetch(`${backendUrl}${endpoint}`, options);
  const { status } = response;
  const data = await response.json();
  return { status, data };
};

type AuthContext = {
  lastVisitedTrackId: [() => string | null, (id: string | null) => void];
  userId: [() => string | null, (id: string) => void];
  jwt: [() => string | null, (id: string) => void];
  logout: () => void;
  server: {
    getTrack: (id: string) => Promise<ServerResponse>;
  };
};

const authContext: AuthContext = {
  lastVisitedTrackId: [
    () => sessionStorage.getItem("lastVisitedTrackId") || null,
    (id: string | null) =>
      id
        ? sessionStorage.setItem("lastVisitedTrackId", id)
        : sessionStorage.removeItem("lastVisitedTrackId"),
  ],
  userId: [
    () => localStorage.getItem("userId") || null,
    (id: string) => localStorage.setItem("userId", id),
  ],
  jwt: [
    () => localStorage.getItem("token") || null,
    (jwt: string) => localStorage.setItem("token", jwt),
  ],
  logout: () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("jwt");
  },
  server: {
    getTrack: async (id: string) => await serverRequest("GET", `/track/${id}`),
  },
};

const UserContext = createContext<AuthContext>(authContext);

export const UserProvider: ParentComponent = (props) => {
  return <UserContext.Provider value={authContext}>{props.children}</UserContext.Provider>;
};

export const useUserContext = () => useContext<AuthContext>(UserContext);
