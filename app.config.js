// app.config.js
module.exports = ({ config }) => {
  return {
    ...config,

    // Top-level app config fields
    name: "MCDS",
    slug: "mcds-mobile",
    version: "1.7.9",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      bundleIdentifier: "dev.quanticoic.mcds",

      // iOS icon appearances
      icon: {
        light: "./assets/icon.png",
        dark: "./assets/ios-dark.png"
      },

      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },

    extra: {
      eas: {
        projectId: "47c08e81-5e75-4d3e-b2c5-2844b0f44dd0"
      }
    },

    owner: "boosterfrank"
  };
};
