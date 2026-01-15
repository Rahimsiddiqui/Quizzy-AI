import { useEffect } from "react";
import { io } from "socket.io-client";

export const useAdminSocket = (callback) => {
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL);

    socket.on("newUserSignup", (data) => {
      if (callback) callback("newUserSignup", data);
    });

    socket.on("newQuizSubmission", (data) => {
      if (callback) callback("newQuizSubmission", data);
    });

    socket.on("dashboardUpdate", (data) => {
      if (callback) callback("dashboardUpdate", data);
    });

    return () => {
      socket.disconnect();
    };
  }, [callback]);
};

export default useAdminSocket;
