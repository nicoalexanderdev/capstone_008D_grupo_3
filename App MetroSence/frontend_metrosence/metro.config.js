const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname)

// Agrega .tflite a los assets sin perder los defaults
if (!config.resolver) config.resolver = {};
const assetExts = config.resolver.assetExts || [];
config.resolver.assetExts = [...new Set([...assetExts, "tflite"])];
 
module.exports = withNativeWind(config, { input: './global.css' })