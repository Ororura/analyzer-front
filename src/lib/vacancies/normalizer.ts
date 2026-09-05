const SKILL_ALIASES: Record<string, string> = {
  'java 8': 'Java',
  'java 11': 'Java',
  'java 17': 'Java',
  'java 21': 'Java',
  'java 25': 'Java',
  'java se': 'Java',
  'java ee': 'Java',
  javase: 'Java',
  javaee: 'Java',
  'spring boot': 'Spring Boot',
  springboot: 'Spring Boot',
  'spring mvc': 'Spring MVC',
  'spring security': 'Spring Security',
  'spring data': 'Spring Data',
  'spring cloud': 'Spring Cloud',
  'spring framework': 'Spring',
  postgresql: 'PostgreSQL',
  postgres: 'PostgreSQL',
  'postgre sql': 'PostgreSQL',
  mysql: 'MySQL',
  'mongo db': 'MongoDB',
  mongodb: 'MongoDB',
  'redis cache': 'Redis',
  'redis db': 'Redis',
  kafka: 'Kafka',
  'apache kafka': 'Kafka',
  'rabbit mq': 'RabbitMQ',
  rabbitmq: 'RabbitMQ',
  'docker container': 'Docker',
  dockerhub: 'Docker',
  k8s: 'Kubernetes',
  'kubernetes cluster': 'Kubernetes',
  'linux os': 'Linux',
  'linux server': 'Linux',
  ubuntu: 'Linux',
  centos: 'Linux',
  debian: 'Linux',
  'ci cd': 'CI/CD',
  'continuous integration': 'CI/CD',
  'continuous deployment': 'CI/CD',
  jenkins: 'Jenkins',
  'gitlab ci': 'GitLab CI',
  gitlabci: 'GitLab CI',
  'github actions': 'GitHub Actions',
  githubactions: 'GitHub Actions',
  aws: 'AWS',
  'amazon web services': 'AWS',
  azure: 'Azure',
  'microsoft azure': 'Azure',
  gcp: 'GCP',
  'google cloud': 'GCP',
  'google cloud platform': 'GCP',
  'junit 5': 'JUnit',
  'junit 4': 'JUnit',
  'mockito mock': 'Mockito',
  'mockito core': 'Mockito',
  'test container': 'Testcontainers',
  testcontainers: 'Testcontainers',
  'git version': 'Git',
  'git scm': 'Git',
  'maven build': 'Maven',
  'gradle build': 'Gradle',
  intellij: 'IntelliJ IDEA',
  'intellij idea': 'IntelliJ IDEA',
  eclipse: 'Eclipse',
  vscode: 'VS Code',
  'visual studio code': 'VS Code',
  'rest api': 'REST API',
  restful: 'REST API',
  graphql: 'GraphQL',
  grpc: 'gRPC',
};

export const normalizeSkill = (skill: string): string => {
  const normalized = skill.toLowerCase().trim();
  return SKILL_ALIASES[normalized] || normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export const normalizeSkills = (skills: string[]): string[] => {
  const normalized = skills.map(normalizeSkill);
  return [...new Set(normalized)].sort();
};

export const normalizeTextSkills = (text: string): string[] => {
  const lines = text.split('\n');
  const skills: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 0 && !trimmed.startsWith('#') && !trimmed.startsWith('-')) {
      skills.push(trimmed);
    }
  }

  return normalizeSkills(skills);
};

export const isJavaRelatedSkill = (skill: string): boolean => {
  const normalized = normalizeSkill(skill).toLowerCase();
  const javaKeywords = ['java', 'spring', 'backend', 'server', 'database', 'sql'];
  return javaKeywords.some((keyword) => normalized.includes(keyword));
};
