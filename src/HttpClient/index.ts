import { z } from "zod";
import { config } from "../config";
import { logger } from "../logger";

/**
 * Отправка HTTP запросов к API
 * Класс не экспортируется, чтобы никто не мог создать второй экземпляр.
 */
class ApiHttpClient {
    private readonly baseUrl: string;
    private readonly apiKey: string;

    constructor() {
        this.baseUrl = config.api.host;
        this.apiKey = config.api.key;
        console.log("ApiHttpClient initialized");
    }

    public get<T>(path: string, schema: z.ZodSchema<T>): Promise<T> {
        return this.request(path, "GET", schema);
    }

    public post<T>(
        path: string,
        body: Record<string, unknown>,
        schema: z.ZodSchema<T>,
    ): Promise<T> {
        return this.request(path, "POST", schema, body);
    }

    public put<T>(
        path: string,
        body: Record<string, unknown>,
        schema: z.ZodSchema<T>,
    ): Promise<T> {
        return this.request(path, "PUT", schema, body);
    }

    private async request<T>(
        path: string,
        method: string,
        schema: z.ZodSchema<T>,
        body?: Record<string, unknown>,
    ): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const options: RequestInit = {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(4000), // таймаут
        };

        logger.debug(
            `Doing ${method} request to URL: ${url}, with body: ${body}`,
        );

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(
                    `Request error: ${response.statusText} (${response.status}). Details: ${errorData}`,
                );
            }

            const data = await response.json();
            const result = schema.safeParse(data);

            if (!result.success) {
                console.error("Zod validation error:", result.error);
                throw new Error(
                    `Invalid data from API: ${result.error.message}`,
                );
            }

            return result.data;
        } catch (error) {
            console.error(`HTTP Request ${url} Failed:`, error);
            throw error;
        }
    }
}

/**
 * Клиент для HTTP запросов к API
 */
export const _apiHttpClient = new ApiHttpClient();
