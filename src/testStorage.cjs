// In-memory native storage for contract tests; never reads device credentials.
const Module = require('node:module');
const values = new Map();
const storage = {
  getItem: async key => values.get(key) ?? null,
  setItem: async (key, value) => { values.set(key, value); },
  removeItem: async key => { values.delete(key); },
  multiGet: async keys => keys.map(key => [key, values.get(key) ?? null]),
  multiSet: async pairs => { pairs.forEach(([key, value]) => values.set(key, value)); },
  multiRemove: async keys => { keys.forEach(key => values.delete(key)); },
};
const original = Module._load;
Module._load = function(name, ...args) {
  if (name === '@react-native-async-storage/async-storage') return { __esModule: true, default: storage, ...storage };
  return original.call(this, name, ...args);
};
module.exports = { values, storage };
