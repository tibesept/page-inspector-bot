import 'dotenv/config'



export interface IAppConfig {
  env: "dev" | "prod";
  telegram: {
    token: string;
    botAdmins: number[];
  };
  db: {
    host: string;
    port: number;
    table: string;
  };
  server: {
    host: string;
    port: number;
    webhookUrl: string;
  };
}


const getEnv = <T>(key: string, parser?: (value: string) => T): T => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Отсутствует переменная окружения: ${key}`)
  }
  if (parser) {
    return parser(value)
  }
  return value as T
}


export const config: IAppConfig = {
  env: getEnv('NODE_ENV'),

  telegram: {
    token: getEnv('BOT_TOKEN'),
    botAdmins: getEnv('BOT_ADMINS', (s: string) => JSON.parse(s || '')),
  },

  db: {
    host: getEnv('DB_HOST'),
    port: getEnv('DB_PORT', parseInt),
    table: getEnv('DB_TABLE'),
  },

  server: {
    host: getEnv('SERVER_HOST'),
    port: getEnv('SERVER_PORT', parseInt),
    webhookUrl: getEnv('WEBHOOK_URL'),
  }
}