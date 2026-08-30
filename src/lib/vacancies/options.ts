export const VACANCY_REGIONS = [
  { value: "", label: "По всей России" },
  { value: "Москва", label: "Москва" },
  { value: "Санкт-Петербург", label: "Санкт-Петербург" },
  { value: "Екатеринбург", label: "Екатеринбург" },
  { value: "Новосибирск", label: "Новосибирск" },
  { value: "Казань", label: "Казань" },
  { value: "Нижний Новгород", label: "Нижний Новгород" },
  { value: "Самара", label: "Самара" },
  { value: "Ростов-на-Дону", label: "Ростов-на-Дону" },
  { value: "Краснодар", label: "Краснодар" },
] as const;

export const POPULAR_TECHNOLOGIES = [
  "Java",
  "Spring Boot",
  "Spring Framework",
  "PostgreSQL",
  "SQL",
  "Hibernate",
  "Docker",
  "Kubernetes",
  "Kafka",
  "Redis",
  "REST API",
  "Git",
] as const;

export const addUniqueTechnology = (technologies: string[], technology: string): string[] => {
  const normalized = technology.trim();
  if (!normalized || technologies.some((item) => item.toLocaleLowerCase() === normalized.toLocaleLowerCase())) {
    return technologies;
  }
  return [...technologies, normalized];
};

export const toggleTechnology = (technologies: string[], technology: string): string[] => {
  const selected = technologies.some((item) => item.toLocaleLowerCase() === technology.toLocaleLowerCase());
  return selected
    ? technologies.filter((item) => item.toLocaleLowerCase() !== technology.toLocaleLowerCase())
    : [...technologies, technology];
};
