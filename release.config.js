export default {
  branches: ['master'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    '@semantic-release/github',
    // disabled until we can get past these failing because of branch protections
    // '@semantic-release/changelog',
    // '@semantic-release/git',
  ],
};
