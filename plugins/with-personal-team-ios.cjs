const { withEntitlementsPlist } = require('expo/config-plugins');
const withAppleAuthentication = require('expo-apple-authentication/app.plugin.js').default;

module.exports = function withPersonalTeamIOS(config) {
  // Mods execute newest first. Register removal before the package's own mod
  // so removal runs after it; registering the package also prevents auto-apply.
  config = withEntitlementsPlist(config, mod => {
    delete mod.modResults['com.apple.developer.applesignin'];
    return mod;
  });
  return withAppleAuthentication(config);
};
