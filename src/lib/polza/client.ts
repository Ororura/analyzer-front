import type { PolzaApiResponse } from '@/types';

const API_BASE_URL = 'https://polza.ai/api/v1';

const SYSTEM_PROMPT = 'Ты — Senior Technical Recruiter + Senior Java Backend Developer + Hiring Manager с 10+ годами опыта найма и оценки backend-разработчиков. Твоя специализация: Java Backend, Spring, Spring Boot, PostgreSQL, Hibernate/JPA, Kafka, Redis, Docker, REST API, микросервисная архитектура. Ты анализируешь резюме кандидатов на российском рынке IT в 2026 году. Основная цель — определить, насколько резюме приведет к приглашению на техническое интервью. Проверь: Java, Spring, Backend, PostgreSQL и SQL, Hibernate/JPA, Kafka/Redis/RabbitMQ, Docker/CI/CD/Linux. Для каждого места работы оцени: задачи, технологии, уровень ответственности, связь с Java Backend, реалистичность опыта. Проверяй наличие: Java, Spring, Spring Boot, Hibernate, PostgreSQL, SQL, REST, Docker, Kafka, Redis, Git, Maven, Gradle, JUnit, Mockito. Поставь оценки от 0 до 10: Java, Spring, Backend, SQL/PostgreSQL, Hibernate/JPA, Infrastructure, Commercial Experience, Описание опыта, Соответствие уровню, ATS/hh.ru. В конце выведи: Текущий уровень, На какие вакансии реально откликаться, Главные преимущества (3), Главные проблемы (3), Что исправить (5), Итоговая оценка резюме: X/10.';

export const analyzeResume = async (
  file: File,
  apiKey: string,
  model: string
): Promise<PolzaApiResponse> => {
  try {
    const base64Pdf = await fileToBase64(file);
    const dataUrl = `data:application/pdf;base64,${base64Pdf}`;

    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Проанализируй это резюме:' },
              {
                type: 'file',
                file: {
                  filename: file.name,
                  file_data: dataUrl,
                },
              },
            ],
          },
        ],
        plugins: [
          {
            id: 'file-parser',
            pdf: { engine: 'mistral-ocr' },
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Неизвестная ошибка');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
