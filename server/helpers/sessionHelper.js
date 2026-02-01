export const getIpAddress = (req) => {
  let ipAddress =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "127.0.0.1";

  // Remove IPv6 prefix only if it's an IPv4-mapped address
  if (ipAddress.startsWith("::ffff:")) {
    ipAddress = ipAddress.substring(7);
  }

  // Fallback
  if (ipAddress === "-1" || !ipAddress) {
    ipAddress = "127.0.0.1";
  }

  return ipAddress;
};

export const getDeviceName = (userAgent) => {
  let deviceName = "Unknown Device";
  
  if (userAgent.includes("Windows")) deviceName = "Windows";
  else if (userAgent.includes("Macintosh")) deviceName = "Mac";
  else if (userAgent.includes("iPhone")) deviceName = "iPhone";
  else if (userAgent.includes("iPad")) deviceName = "iPad";
  else if (userAgent.includes("Android")) deviceName = "Android";
  else if (userAgent.includes("Linux")) deviceName = "Linux";

  let browserInfo = "";
  if (userAgent.includes("Chrome") && !userAgent.includes("Chromium")) {
    const chromeMatch = userAgent.match(/Chrome\/([\d.]+)/);
    browserInfo = chromeMatch ? `Chrome ${chromeMatch[1].split('.')[0]}` : "Chrome";
  } else if (userAgent.includes("Firefox")) {
    const firefoxMatch = userAgent.match(/Firefox\/([\d.]+)/);
    browserInfo = firefoxMatch ? `Firefox ${firefoxMatch[1].split('.')[0]}` : "Firefox";
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    browserInfo = "Safari";
  } else if (userAgent.includes("Edge") || userAgent.includes("Edg")) {
    const edgeMatch = userAgent.match(/Edg\/([\d.]+)/);
    browserInfo = edgeMatch ? `Edge ${edgeMatch[1].split('.')[0]}` : "Edge";
  }

  return browserInfo ? `${deviceName} - ${browserInfo}` : deviceName;
};

export const createSession = (req, user) => {
  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = getIpAddress(req);
  const deviceName = getDeviceName(userAgent);

  const newSession = {
    deviceName,
    userAgent,
    ipAddress,
    lastActive: new Date(),
    isCurrent: true,
    createdAt: new Date(),
  };

  user.sessions = user.sessions || [];

  // Mark previous sessions as not current
  user.sessions.forEach((session) => {
    session.isCurrent = false;
  });

  // Add the new session
  user.sessions.push(newSession);

  // Cap sessions at 10 (remove oldest)
  if (user.sessions.length > 10) {
    user.sessions.sort((a, b) => new Date(a.lastActive) - new Date(b.lastActive));
    while (user.sessions.length > 10) {
      user.sessions.shift();
    }
  }

  // Return the newly created session (now it has an _id from Mongoose)
  return user.sessions[user.sessions.length - 1];
};
