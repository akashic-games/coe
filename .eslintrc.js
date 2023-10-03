module.exports = {
  root: true,
  extends: [
    "@akashic/eslint-config"
  ],
  parserOptions: {
    project: "tsconfig.jest.json",
    sourceType: "module"
  },
  ignorePatterns: [
    "*.js",
    "tests/**/*"
  ]
}
