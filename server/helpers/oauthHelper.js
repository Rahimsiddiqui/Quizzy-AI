import axios from "axios";
import bcrypt from "bcryptjs";

/**
 * Exchange OAuth authorization code for access token
 */
export const exchangeCodeForToken = async (provider, code, redirectUri) => {
  const tokenEndpoints = {
    google: "https://oauth2.googleapis.com/token",
    github: "https://github.com/login/oauth/access_token",
  };

  const clientIds = {
    google: process.env.GOOGLE_CLIENT_ID,
    github: process.env.GITHUB_CLIENT_ID,
  };

  const clientSecrets = {
    google: process.env.GOOGLE_CLIENT_SECRET,
    github: process.env.GITHUB_CLIENT_SECRET,
  };

  // Validate credentials are configured
  if (!clientIds[provider] || !clientSecrets[provider]) {
    throw new Error(
      `${provider} OAuth credentials not configured. Please set ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET in .env`
    );
  }

  try {
    const config = {
      client_id: clientIds[provider],
      client_secret: clientSecrets[provider],
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    };

    const response = await axios.post(tokenEndpoints[provider], config, {
      headers: {
        Accept: "application/json",
      },
    });

    if (response.data.error) {
      throw new Error(response.data.error_description || response.data.error);
    }

    return response.data.access_token;
  } catch (error) {
    throw new Error(
      `Failed to exchange code for token: ${
        error.response?.data?.error_description || error.message
      }`
    );
  }
};

/**
 * Get user info from OAuth provider
 */
export const getOAuthUserInfo = async (provider, accessToken) => {
  const userInfoEndpoints = {
    google: "https://www.googleapis.com/oauth2/v2/userinfo",
    github: "https://api.github.com/user",
  };

  try {
    const response = await axios.get(userInfoEndpoints[provider], {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    let data = response.data;
    let email = data.email;

    // For GitHub, email might not be public - fetch from emails endpoint
    if (provider === "github" && !email) {
      try {
        const emailResponse = await axios.get(
          "https://api.github.com/user/emails",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        );
        const primaryEmail = emailResponse.data.find((e) => e.primary);
        email = primaryEmail?.email || data.login + "@github.com";
      } catch {
        email = data.login + "@github.com";
      }
    }

    // Normalize user data from different providers
    return {
      email: email || data.login + "@github.com",
      name:
        data.name ||
        data.login ||
        (data.given_name || "") + " " + (data.family_name || ""),
      picture: data.picture || data.avatar_url,
      provider,
      providerId: data.id || data.sub,
    };
  } catch (error) {
    throw new Error(
      `Failed to get user info: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

/**
 * Link OAuth account to existing user
 */
export const linkOAuthAccount = async (user, provider, providerId, email) => {
  if (!user.connectedAccounts) {
    user.connectedAccounts = {};
  }

  user.connectedAccounts[provider] = {
    id: providerId,
    email,
    connectedAt: new Date(),
  };

  return await user.save();
};

/**
 * Find or create user from OAuth data
 */
export const findOrCreateOAuthUser = async (User, oauthData) => {
  let user = await User.findOne({ email: oauthData.email });

  if (user) {
    // Link OAuth account to existing user
    await linkOAuthAccount(
      user,
      oauthData.provider,
      oauthData.providerId,
      oauthData.email
    );
    return user;
  }

  // Generate a random secure password so users can also login with email/password
  const randomPassword = Math.random().toString(36).slice(-12) + "Aa1";
  const hashedPassword = await bcrypt.hash(randomPassword, 10);

  // Create new user from OAuth data
  user = new User({
    name: oauthData.name,
    email: oauthData.email,
    picture: oauthData.picture,
    password: hashedPassword,
    passwordIsUserSet: false, // Mark as OAuth-generated password
    isVerified: true,
    tier: "Free",
    limits: {
      generationsRemaining: 7,
      pdfUploadsRemaining: 3,
    },
    connectedAccounts: {
      [oauthData.provider]: {
        id: oauthData.providerId,
        email: oauthData.email,
        connectedAt: new Date(),
      },
    },
  });

  await user.save();
  return user;
};
