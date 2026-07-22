export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 120],
    'subject-case': [2, 'never', ['start-case', 'pascal-case']],
  },
};
