// app.config.js
const { withAppBuildGradle } = require('@expo/config-plugins');

function withExcludeSupportGroup(config) {
  return withAppBuildGradle(config, (c) => {
    const s = c.modResults.contents;
    if (!/configurations\.all\s*{[^}]*exclude group:\s*'com\.android\.support'/.test(s)) {
      c.modResults.contents = s.replace(
        /(^|\n)\s*dependencies\s*{/,
        `

configurations.all {
    exclude group: 'com.android.support'
}

dependencies {
`
      );
    }
    return c;
  });
}

module.exports = ({ config }) => {
  // si ya exportabas un objeto, integra aquí el plugin
  return withExcludeSupportGroup(config);
};
