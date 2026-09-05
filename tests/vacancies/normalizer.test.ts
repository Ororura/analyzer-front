import { describe, it, expect } from 'vitest';
import { normalizeSkill } from '@/lib/vacancies/normalizer';

describe('Skill Normalizer', () => {
  it('should normalize Spring Boot variations', () => {
    expect(normalizeSkill('springboot')).toBe('Spring Boot');
    expect(normalizeSkill('Spring Boot')).toBe('Spring Boot');
    expect(normalizeSkill('spring boot')).toBe('Spring Boot');
  });

  it('should normalize PostgreSQL variations', () => {
    expect(normalizeSkill('postgres')).toBe('PostgreSQL');
    expect(normalizeSkill('Postgre SQL')).toBe('PostgreSQL');
    expect(normalizeSkill('postgresql')).toBe('PostgreSQL');
  });

  it('should normalize Java variations', () => {
    expect(normalizeSkill('java 17')).toBe('Java');
    expect(normalizeSkill('java 11')).toBe('Java');
    expect(normalizeSkill('java se')).toBe('Java');
  });

  it('should normalize Kafka variations', () => {
    expect(normalizeSkill('kafka')).toBe('Kafka');
    expect(normalizeSkill('apache kafka')).toBe('Kafka');
  });

  it('should normalize Redis variations', () => {
    expect(normalizeSkill('redis cache')).toBe('Redis');
    expect(normalizeSkill('redis db')).toBe('Redis');
  });

  it('should normalize Docker variations', () => {
    expect(normalizeSkill('docker container')).toBe('Docker');
    expect(normalizeSkill('dockerhub')).toBe('Docker');
  });

  it('should normalize Kubernetes variations', () => {
    expect(normalizeSkill('k8s')).toBe('Kubernetes');
    expect(normalizeSkill('kubernetes cluster')).toBe('Kubernetes');
  });

  it('should normalize CI/CD variations', () => {
    expect(normalizeSkill('ci cd')).toBe('CI/CD');
    expect(normalizeSkill('continuous integration')).toBe('CI/CD');
  });

  it('should normalize Git variations', () => {
    expect(normalizeSkill('git version')).toBe('Git');
    expect(normalizeSkill('git scm')).toBe('Git');
  });
});
